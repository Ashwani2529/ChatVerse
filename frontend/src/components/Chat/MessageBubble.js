import React from 'react';

import { avatarTint, formatTime, initials } from '../../lib/datetime';
import Spinner from '../ui/Spinner';
import { AlertIcon } from '../ui/icons';

/**
 * One message row. `isOwn` flips it to the right, `showMeta` is false for
 * follow-up messages from the same person so runs read as a single block.
 */
const MessageBubble = ({ message, isOwn, showMeta }) => {
  if (message.kind === 'system') {
    return (
      <li className="my-2 flex justify-center px-2">
        <span className="rounded-full bg-ink-700/70 px-3 py-1 text-center text-[11px] text-slate-400">
          {message.text}
        </span>
      </li>
    );
  }

  return (
    <li
      className={`flex animate-fade-up items-end gap-2 ${
        isOwn ? 'flex-row-reverse' : 'flex-row'
      } ${showMeta ? 'mt-3' : 'mt-0.5'}`}
    >
      {/* Avatar only on the first message of a run; a spacer keeps the rest aligned. */}
      {showMeta && !isOwn ? (
        <span
          aria-hidden
          className={`mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatarTint(
            message.memberId || message.user
          )}`}
        >
          {initials(message.user)}
        </span>
      ) : (
        <span aria-hidden className={isOwn ? 'hidden' : 'h-8 w-8 shrink-0'} />
      )}

      <div
        className={`flex max-w-[82%] flex-col sm:max-w-[70%] lg:max-w-[60%] ${
          isOwn ? 'items-end' : 'items-start'
        }`}
      >
        {showMeta && !isOwn && (
          <span className="mb-1 px-1 text-xs font-medium text-slate-400">
            {message.user}
          </span>
        )}

        <div
          className={`relative rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed shadow-sm ${
            isOwn
              ? 'bg-brand-500 text-white'
              : 'bg-ink-600 text-slate-100'
          } ${message.failed ? 'ring-1 ring-rose-400/70' : ''} ${
            message.pending ? 'opacity-70' : ''
          }`}
        >
          <p className="message-text">{message.text}</p>

          <span
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
              isOwn ? 'text-white/70' : 'text-slate-400'
            }`}
          >
            {message.failed ? (
              <span className="flex items-center gap-1 text-rose-200">
                <AlertIcon className="h-3 w-3" />
                Not sent
              </span>
            ) : message.pending ? (
              <Spinner size="sm" className="h-3 w-3 border" label="Sending" />
            ) : (
              formatTime(message.createdAt)
            )}
          </span>
        </div>
      </div>
    </li>
  );
};

export default MessageBubble;
