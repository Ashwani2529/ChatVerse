import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { formatDayLabel, isSameDay } from '../../lib/datetime';
import MessageBubble from './MessageBubble';
import Spinner from '../ui/Spinner';

const NEAR_BOTTOM_PX = 120;
const LOAD_OLDER_PX = 80;

const MessageList = ({
  messages,
  currentMemberId,
  hasMore,
  isLoadingOlder,
  isLoadingHistory,
  onLoadOlder,
  typingLabel,
}) => {
  const containerRef = useRef(null);
  const atBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);
  const geometryRef = useRef({ scrollHeight: 0, scrollTop: 0, firstId: null, lastId: null });

  const [showJumpButton, setShowJumpButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const el = containerRef.current;
    if (!el) return;

    el.scrollTo({ top: el.scrollHeight, behavior });
    atBottomRef.current = true;
    setShowJumpButton(false);
    setUnreadCount(0);
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom <= NEAR_BOTTOM_PX;

    atBottomRef.current = atBottom;
    setShowJumpButton(!atBottom);
    if (atBottom) setUnreadCount(0);

    if (el.scrollTop <= LOAD_OLDER_PX && hasMore && !isLoadingOlder) {
      onLoadOlder();
    }
  }, [hasMore, isLoadingOlder, onLoadOlder]);

  // Keeps the viewport stable: pin to the bottom for new messages, and hold the
  // reader's place when an older page is prepended above them.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || messages.length === 0) return;

    const firstId = messages[0]._id;
    const lastId = messages[messages.length - 1]._id;
    const previous = geometryRef.current;

    if (!didInitialScrollRef.current) {
      el.scrollTop = el.scrollHeight;
      didInitialScrollRef.current = true;
    } else if (firstId !== previous.firstId && lastId === previous.lastId) {
      // Older page prepended — shift down by exactly the height that was added.
      el.scrollTop = previous.scrollTop + (el.scrollHeight - previous.scrollHeight);
    } else if (lastId !== previous.lastId) {
      if (atBottomRef.current) {
        el.scrollTop = el.scrollHeight;
      } else {
        setUnreadCount((count) => count + 1);
      }
    }

    geometryRef.current = {
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
      firstId,
      lastId,
    };
  }, [messages]);

  // The typing strip changes the content height; stay pinned if we were pinned.
  useEffect(() => {
    if (atBottomRef.current) scrollToBottom('auto');
  }, [typingLabel, scrollToBottom]);

  if (isLoadingHistory) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
        <Spinner size="lg" className="text-brand-400" label="Loading messages" />
        <p className="text-sm">Loading your messages…</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="scroll-area flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-5 sm:py-4"
      >
        {hasMore && (
          <div className="flex justify-center pb-2">
            {isLoadingOlder ? (
              <span className="flex items-center gap-2 text-xs text-slate-400">
                <Spinner size="sm" label="Loading earlier messages" />
                Loading earlier messages…
              </span>
            ) : (
              <button
                type="button"
                onClick={onLoadOlder}
                className="rounded-full border border-ink-500 px-3 py-1 text-xs text-slate-300 transition hover:bg-ink-600"
              >
                Load earlier messages
              </button>
            )}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
            <p className="text-base font-medium text-slate-300">No messages yet</p>
            <p className="text-sm text-slate-500">
              Say hello — everything you send here is saved to this room.
            </p>
          </div>
        ) : (
          <ul className="mx-auto w-full max-w-3xl">
            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const needsDayDivider =
                !previous || !isSameDay(previous.createdAt, message.createdAt);

              const isOwn =
                message.kind !== 'system' && message.memberId === currentMemberId;

              // First of a run from the same person, or anything after a divider.
              const showMeta =
                needsDayDivider ||
                !previous ||
                previous.kind === 'system' ||
                previous.memberId !== message.memberId;

              return (
                <React.Fragment key={message._id}>
                  {needsDayDivider && (
                    <li className="my-3 flex items-center gap-3" aria-hidden>
                      <span className="h-px flex-1 bg-ink-500/70" />
                      <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                        {formatDayLabel(message.createdAt)}
                      </span>
                      <span className="h-px flex-1 bg-ink-500/70" />
                    </li>
                  )}
                  <MessageBubble
                    message={message}
                    isOwn={isOwn}
                    showMeta={showMeta}
                  />
                </React.Fragment>
              );
            })}
          </ul>
        )}
      </div>

      {typingLabel && (
        <div className="px-4 pb-1 sm:px-6">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            {typingLabel}
            <span className="flex gap-0.5" aria-hidden>
              <span className="h-1 w-1 animate-pulse-dot rounded-full bg-slate-400" />
              <span className="h-1 w-1 animate-pulse-dot rounded-full bg-slate-400 [animation-delay:150ms]" />
              <span className="h-1 w-1 animate-pulse-dot rounded-full bg-slate-400 [animation-delay:300ms]" />
            </span>
          </span>
        </div>
      )}

      {showJumpButton && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-black/40 transition hover:bg-brand-400 sm:right-5"
        >
          {unreadCount > 0
            ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}`
            : 'Jump to latest'}
          <span aria-hidden>↓</span>
        </button>
      )}
    </div>
  );
};

export default MessageList;
