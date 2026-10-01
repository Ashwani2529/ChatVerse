import React from 'react';

import Spinner from '../ui/Spinner';
import { BellIcon } from '../ui/icons';

/**
 * Permission has to be asked from a real click — Safari ignores
 * requestPermission() without a user gesture — so it lives behind this strip.
 */
const NotificationBanner = ({ onEnable, onDismiss, isEnabling }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-brand-500/25 bg-brand-500/10 px-4 py-2.5 text-sm sm:px-5">
    <BellIcon className="h-4 w-4 shrink-0 text-brand-300" />

    <p className="min-w-0 flex-1 text-slate-200">
      Get notified when someone messages this room
    </p>

    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onEnable}
        disabled={isEnabling}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-400 disabled:opacity-60"
      >
        {isEnabling && <Spinner size="sm" label="Enabling notifications" />}
        {isEnabling ? 'Enabling…' : 'Enable'}
      </button>

      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-ink-600 hover:text-slate-200"
      >
        Not now
      </button>
    </div>
  </div>
);

export default NotificationBanner;
