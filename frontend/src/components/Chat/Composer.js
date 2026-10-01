import React, { useCallback, useEffect, useRef, useState } from 'react';

import { SendIcon } from '../ui/icons';

const MAX_LENGTH = 2000;
const MAX_ROWS_PX = 140;

const Composer = ({ onSend, onTyping, disabled }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const typingStopTimerRef = useRef(null);

  // Grow with the content up to a few lines, then scroll inside the box.
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS_PX)}px`;
  }, []);

  useEffect(resize, [text, resize]);

  useEffect(
    () => () => {
      clearTimeout(typingStopTimerRef.current);
    },
    []
  );

  const stopTypingSoon = useCallback(() => {
    clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => onTyping(false), 1800);
  }, [onTyping]);

  const handleChange = (event) => {
    const value = event.target.value.slice(0, MAX_LENGTH);
    setText(value);

    if (value.trim()) {
      onTyping(true);
      stopTypingSoon();
    } else {
      clearTimeout(typingStopTimerRef.current);
      onTyping(false);
    }
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    if (onSend(trimmed)) {
      setText('');
      clearTimeout(typingStopTimerRef.current);
      onTyping(false);
      // Keeps the keyboard open on mobile between messages.
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (event) => {
    // Enter sends; Shift+Enter (or any modifier) inserts a newline instead.
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      submit();
    }
  };

  const remaining = MAX_LENGTH - text.length;

  return (
    <div className="border-t border-ink-500/70 bg-ink-800/90 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-5 sm:py-3">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        <div className="flex-1 rounded-2xl border border-ink-500 bg-ink-700/80 px-3 py-1.5 transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => onTyping(false)}
            rows={1}
            disabled={disabled}
            placeholder={disabled ? 'Reconnecting…' : 'Type a message'}
            aria-label="Message"
            className="scroll-area block max-h-[140px] w-full resize-none bg-transparent py-1.5 text-[15px] leading-relaxed text-slate-100 placeholder-slate-500 outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />

          {remaining <= 200 && (
            <p
              className={`pb-1 text-right text-[10px] ${
                remaining <= 0 ? 'text-rose-300' : 'text-slate-500'
              }`}
            >
              {remaining} characters left
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={disabled || !text.trim()}
          aria-label="Send message"
          className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300 active:scale-95 disabled:cursor-not-allowed disabled:bg-ink-600 disabled:text-slate-500 disabled:active:scale-100"
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>

      <p className="mx-auto mt-1.5 hidden w-full max-w-3xl text-[11px] text-slate-500 sm:block">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
};

export default Composer;
