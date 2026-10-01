import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';

import { API_URL, fetchMessages } from '../lib/api';

const PAGE_SIZE = 50;

const makeClientId = () =>
  `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * Owns the room's message state: the first history page, scroll-up pagination,
 * the live socket feed, presence and typing.
 */
export const useChatSocket = ({ token, room, user, onAuthFailure }) => {
  const [messages, setMessages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState('connecting'); // connecting | online | offline
  const [online, setOnline] = useState([]);
  const [typingNames, setTypingNames] = useState([]);
  const [notice, setNotice] = useState('');

  const socketRef = useRef(null);
  const oldestCursorRef = useRef(null);
  const typingTimersRef = useRef(new Map());
  const typingSentAtRef = useRef(0);
  const authFailureRef = useRef(onAuthFailure);

  useEffect(() => {
    authFailureRef.current = onAuthFailure;
  }, [onAuthFailure]);

  const roomId = room?.roomId;

  /** Appends a live message, replacing this client's optimistic copy if present. */
  const mergeIncoming = useCallback((incoming) => {
    setMessages((prev) => {
      if (incoming.clientId) {
        const pendingIndex = prev.findIndex(
          (m) => m.pending && m.clientId === incoming.clientId
        );

        if (pendingIndex !== -1) {
          const next = [...prev];
          next[pendingIndex] = { ...incoming, pending: false, failed: false };
          return next;
        }
      }

      // Guards against a duplicate from a reconnect replaying an event.
      if (prev.some((m) => m._id && m._id === incoming._id)) return prev;

      return [...prev, { ...incoming, pending: false }];
    });
  }, []);

  // ---- first history page -------------------------------------------------
  useEffect(() => {
    if (!token || !roomId) return undefined;

    let cancelled = false;
    setIsLoadingHistory(true);

    (async () => {
      try {
        const data = await fetchMessages({ roomId, limit: PAGE_SIZE });
        if (cancelled) return;

        setMessages(data.messages);
        setHasMore(data.hasMore);
        oldestCursorRef.current = data.nextCursor;
      } catch (error) {
        if (cancelled) return;

        if (error.status === 401 || error.code === 'ROOM_GONE') {
          authFailureRef.current?.(error.message);
          return;
        }

        setNotice(error.message || 'Could not load earlier messages.');
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, roomId]);

  /** Fetches the next older page. Resolves to the number of messages added. */
  const loadOlder = useCallback(async () => {
    if (!hasMore || isLoadingOlder || !oldestCursorRef.current || !roomId) return 0;

    setIsLoadingOlder(true);

    try {
      const data = await fetchMessages({
        roomId,
        before: oldestCursorRef.current,
        limit: PAGE_SIZE,
      });

      setMessages((prev) => {
        const known = new Set(prev.map((m) => m._id));
        const fresh = data.messages.filter((m) => !known.has(m._id));
        return [...fresh, ...prev];
      });

      setHasMore(data.hasMore);
      if (data.nextCursor) oldestCursorRef.current = data.nextCursor;

      return data.messages.length;
    } catch (error) {
      setNotice(error.message || 'Could not load earlier messages.');
      return 0;
    } finally {
      setIsLoadingOlder(false);
    }
  }, [hasMore, isLoadingOlder, roomId]);

  // ---- live socket --------------------------------------------------------
  useEffect(() => {
    if (!token || !roomId) return undefined;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('online');
      setNotice('');
    });

    socket.on('disconnect', () => setStatus('offline'));

    socket.on('connect_error', (error) => {
      setStatus('offline');

      const message = error?.message || '';

      // The handshake rejects a dead or expired token; there is no recovering
      // from that in-place, so hand control back to the login screen.
      if (/session|authentication|room no longer exists/i.test(message)) {
        socket.disconnect();
        authFailureRef.current?.(message);
        return;
      }

      setNotice('Reconnecting…');
    });

    socket.on('room:ready', (data) => {
      setOnline(data.online || []);
    });

    socket.on('presence', (data) => setOnline(data.online || []));

    socket.on('message:new', mergeIncoming);

    socket.on('system', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: `sys_${data.at}_${Math.random().toString(36).slice(2, 7)}`,
          kind: 'system',
          text: data.text,
          createdAt: data.at,
        },
      ]);
    });

    socket.on('error:message', ({ error, clientId }) => {
      setNotice(error);

      if (clientId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientId === clientId ? { ...m, pending: false, failed: true } : m
          )
        );
      }
    });

    socket.on('typing', ({ memberId, name, isTyping }) => {
      const timers = typingTimersRef.current;

      const stop = () => {
        setTypingNames((prev) => prev.filter((entry) => entry.memberId !== memberId));
        clearTimeout(timers.get(memberId));
        timers.delete(memberId);
      };

      if (!isTyping) {
        stop();
        return;
      }

      setTypingNames((prev) =>
        prev.some((entry) => entry.memberId === memberId)
          ? prev
          : [...prev, { memberId, name }]
      );

      // Safety net: a sender that drops off never sends its "stopped" event.
      clearTimeout(timers.get(memberId));
      timers.set(memberId, setTimeout(stop, 4000));
    });

    return () => {
      typingTimersRef.current.forEach((timer) => clearTimeout(timer));
      typingTimersRef.current.clear();
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, roomId, mergeIncoming]);

  /** Optimistically renders the message, then sends it. */
  const sendMessage = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed || !socketRef.current) return false;

      const clientId = makeClientId();

      setMessages((prev) => [
        ...prev,
        {
          _id: clientId,
          clientId,
          roomId,
          memberId: user?.memberId,
          user: user?.name,
          text: trimmed,
          kind: 'chat',
          createdAt: new Date().toISOString(),
          pending: true,
        },
      ]);

      socketRef.current.emit('message:send', { text: trimmed, clientId }, (ack) => {
        if (ack && !ack.ok) {
          setMessages((prev) =>
            prev.map((m) =>
              m.clientId === clientId ? { ...m, pending: false, failed: true } : m
            )
          );
        }
      });

      return true;
    },
    [roomId, user]
  );

  /** Throttled so a fast typist does not emit on every keystroke. */
  const notifyTyping = useCallback((isTyping) => {
    if (!socketRef.current) return;

    const now = Date.now();

    if (isTyping && now - typingSentAtRef.current < 1500) return;

    typingSentAtRef.current = isTyping ? now : 0;
    socketRef.current.emit('typing', { isTyping });
  }, []);

  const typingLabel = useMemo(() => {
    if (typingNames.length === 0) return '';
    if (typingNames.length === 1) return `${typingNames[0].name} is typing`;
    if (typingNames.length === 2)
      return `${typingNames[0].name} and ${typingNames[1].name} are typing`;
    return `${typingNames.length} people are typing`;
  }, [typingNames]);

  return {
    messages,
    isLoadingHistory,
    isLoadingOlder,
    hasMore,
    loadOlder,
    status,
    online,
    typingLabel,
    notice,
    dismissNotice: () => setNotice(''),
    sendMessage,
    notifyTyping,
  };
};
