import React, { useEffect, useRef, useState } from 'react';

import { avatarTint, initials } from '../../lib/datetime';
import { HashIcon, LogoutIcon, UsersIcon } from '../ui/icons';

const statusStyles = {
  online: { dot: 'bg-emerald-400', label: 'Connected' },
  connecting: { dot: 'bg-amber-400 animate-pulse', label: 'Connecting' },
  offline: { dot: 'bg-rose-400', label: 'Offline' },
};

const RoomHeader = ({ room, user, online, status, onLeave }) => {
  const [showMembers, setShowMembers] = useState(false);
  const popoverRef = useRef(null);

  // Click-away and Escape both close the member list.
  useEffect(() => {
    if (!showMembers) return undefined;

    const handlePointerDown = (event) => {
      if (!popoverRef.current?.contains(event.target)) setShowMembers(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowMembers(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMembers]);

  const indicator = statusStyles[status] || statusStyles.connecting;

  return (
    <header className="flex items-center gap-3 border-b border-ink-500/70 bg-ink-800/90 px-3 py-2.5 backdrop-blur sm:px-5 sm:py-3">
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300"
      >
        <HashIcon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-slate-100 sm:text-base">
          {room.displayName}
        </h1>
        <p className="flex items-center gap-1.5 text-[11px] text-slate-400 sm:text-xs">
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${indicator.dot}`} />
          <span>{indicator.label}</span>
          <span aria-hidden>·</span>
          <span className="truncate">
            {online.length} online · you are {user.name}
          </span>
        </p>
      </div>

      <div className="relative" ref={popoverRef}>
        <button
          type="button"
          onClick={() => setShowMembers((value) => !value)}
          className="icon-btn"
          aria-label={`Show the ${online.length} people in this room`}
          aria-expanded={showMembers}
        >
          <UsersIcon className="h-5 w-5" />
        </button>

        {showMembers && (
          <div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-xl border border-ink-500 bg-ink-700 shadow-2xl shadow-black/50">
            <p className="border-b border-ink-500/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              In this room ({online.length})
            </p>
            <ul className="scroll-area max-h-64 overflow-y-auto py-1">
              {online.length === 0 && (
                <li className="px-3 py-2 text-xs text-slate-500">Nobody else right now</li>
              )}
              {online.map((member) => (
                <li
                  key={member.memberId}
                  className="flex items-center gap-2.5 px-3 py-1.5 text-sm text-slate-200"
                >
                  <span
                    aria-hidden
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${avatarTint(
                      member.memberId
                    )}`}
                  >
                    {initials(member.name)}
                  </span>
                  <span className="truncate">
                    {member.name}
                    {member.memberId === user.memberId && (
                      <span className="text-slate-500"> (you)</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onLeave}
        className="icon-btn hover:bg-rose-500/15 hover:text-rose-300"
        aria-label="Leave room and sign out"
      >
        <LogoutIcon className="h-5 w-5" />
      </button>
    </header>
  );
};

export default RoomHeader;
