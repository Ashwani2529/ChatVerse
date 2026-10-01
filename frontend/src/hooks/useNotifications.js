import { useCallback, useEffect, useRef, useState } from 'react';

import {
  isPushSupported,
  showLocalNotification,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/push';
import { playNotificationSound, primeSound } from '../lib/sound';
import { loadNotificationPrefs, saveNotificationPrefs } from '../lib/storage';

const canNotify = () => typeof window !== 'undefined' && 'Notification' in window;

/**
 * The user counts as away when the tab is hidden *or* the window has lost
 * focus — a visible-but-background window means they are not reading the room,
 * so it should still alert. Only an open, focused room stays silent.
 */
const isAway = () => document.hidden || !document.hasFocus();

export const useNotifications = ({ roomName }) => {
  const supported = canNotify();

  const [permission, setPermission] = useState(() =>
    supported ? Notification.permission : 'unsupported'
  );
  const [prefs, setPrefs] = useState(loadNotificationPrefs);
  const [isEnabling, setIsEnabling] = useState(false);
  const [pushError, setPushError] = useState('');

  const unreadRef = useRef(0);
  const baseTitleRef = useRef('ChatVerse');

  useEffect(() => {
    baseTitleRef.current = document.title || 'ChatVerse';

    return () => {
      document.title = baseTitleRef.current;
    };
  }, []);

  // Permission already granted from a previous visit: make sure this browser is
  // still subscribed, since endpoints rotate and the server record can expire.
  useEffect(() => {
    if (permission !== 'granted' || prefs.muted) return;

    subscribeToPush().catch(() => {
      /* in-tab notifications still work without push */
    });
    // Runs on mount and whenever the mute state flips back on.
  }, [permission, prefs.muted]);

  const resetUnread = useCallback(() => {
    unreadRef.current = 0;
    document.title = baseTitleRef.current;
  }, []);

  // Clear the title badge the moment the user comes back to the room.
  useEffect(() => {
    const handleReturn = () => {
      if (!isAway()) resetUnread();
    };

    document.addEventListener('visibilitychange', handleReturn);
    window.addEventListener('focus', handleReturn);

    return () => {
      document.removeEventListener('visibilitychange', handleReturn);
      window.removeEventListener('focus', handleReturn);
    };
  }, [resetUnread]);

  /** Called from the Enable button, so the permission prompt has a gesture. */
  const enable = useCallback(async () => {
    if (!supported) return;

    setIsEnabling(true);
    setPushError('');

    try {
      // Unlock audio while we still have the user's click.
      primeSound();

      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') return;

      saveNotificationPrefs({ muted: false, bannerDismissed: true });
      setPrefs(loadNotificationPrefs());

      if (isPushSupported()) {
        const outcome = await subscribeToPush();

        // In-tab alerts work regardless; only closed-tab push is lost here.
        if (!outcome.ok && outcome.reason === 'server-disabled') {
          setPushError(
            'Notifications are on for this tab. Background notifications are not configured on the server.'
          );
        }
      }
    } catch (error) {
      setPushError(error.message || 'Could not enable notifications.');
    } finally {
      setIsEnabling(false);
    }
  }, [supported]);

  const dismissBanner = useCallback(() => {
    saveNotificationPrefs({ bannerDismissed: true });
    setPrefs(loadNotificationPrefs());
  }, []);

  const toggleMute = useCallback(async () => {
    const muted = !prefs.muted;

    saveNotificationPrefs({ muted });
    setPrefs(loadNotificationPrefs());

    try {
      if (muted) await unsubscribeFromPush();
      else if (permission === 'granted') await subscribeToPush();
    } catch {
      /* the local mute flag is what actually gates alerts */
    }
  }, [prefs.muted, permission]);

  /** Fed every incoming message from someone else. */
  const handleIncoming = useCallback(
    (message) => {
      if (prefs.muted || !isAway()) return;

      unreadRef.current += 1;
      document.title = `(${unreadRef.current}) ${baseTitleRef.current}`;

      playNotificationSound();

      if (permission === 'granted') {
        showLocalNotification(`${message.user} · ${roomName}`, {
          body: message.text,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: `chatverse-${message.roomId}`,
          renotify: true,
        });
      }
    },
    [prefs.muted, permission, roomName]
  );

  /** Stops this browser receiving pushes — used when leaving the room. */
  const teardown = useCallback(async () => {
    resetUnread();

    try {
      await unsubscribeFromPush();
    } catch {
      /* ignore */
    }
  }, [resetUnread]);

  return {
    supported,
    permission,
    isMuted: prefs.muted,
    isEnabling,
    pushError,
    dismissPushError: () => setPushError(''),
    showBanner: supported && permission === 'default' && !prefs.bannerDismissed,
    enable,
    dismissBanner,
    toggleMute,
    handleIncoming,
    teardown,
  };
};
