import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useNotifications } from '../../hooks/useNotifications';
import Composer from './Composer';
import MessageList from './MessageList';
import NotificationBanner from './NotificationBanner';
import RoomHeader from './RoomHeader';
import { AlertIcon } from '../ui/icons';

const Chat = () => {
  const navigate = useNavigate();
  const { token, room, user, logout } = useAuth();

  const notifications = useNotifications({ roomName: room.displayName });

  // An expired or revoked token cannot be recovered in place — drop the session
  // and send the user back to the join form.
  const handleAuthFailure = useCallback(() => {
    logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  const {
    messages,
    isLoadingHistory,
    isLoadingOlder,
    hasMore,
    loadOlder,
    status,
    online,
    typingLabel,
    notice,
    dismissNotice,
    sendMessage,
    notifyTyping,
  } = useChatSocket({
    token,
    room,
    user,
    onAuthFailure: handleAuthFailure,
    onIncoming: notifications.handleIncoming,
  });

  const handleLeave = useCallback(async () => {
    // Drop this browser's push subscription first, or it keeps receiving the
    // room's notifications after signing out.
    await notifications.teardown();
    logout();
    navigate('/', { replace: true });
  }, [notifications, logout, navigate]);

  return (
    <main className="flex h-[100dvh] flex-col bg-ink-900">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden border-ink-500/70 bg-ink-800/40 sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-2xl sm:border sm:shadow-2xl sm:shadow-black/40">
        <RoomHeader
          room={room}
          user={user}
          online={online}
          status={status}
          onLeave={handleLeave}
          isMuted={notifications.isMuted}
          onToggleMute={notifications.toggleMute}
          canToggleMute={notifications.permission === 'granted'}
        />

        {notifications.showBanner && (
          <NotificationBanner
            onEnable={notifications.enable}
            onDismiss={notifications.dismissBanner}
            isEnabling={notifications.isEnabling}
          />
        )}

        {notifications.pushError && (
          <div
            role="status"
            className="flex items-start gap-2 border-b border-ink-500/70 bg-ink-700/60 px-4 py-2 text-xs text-slate-300"
          >
            <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{notifications.pushError}</span>
            <button
              type="button"
              onClick={notifications.dismissPushError}
              className="shrink-0 font-semibold text-slate-200 underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="flex items-start gap-2 border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs text-amber-200"
          >
            <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{notice}</span>
            <button
              type="button"
              onClick={dismissNotice}
              className="shrink-0 font-semibold text-amber-100 underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <MessageList
          messages={messages}
          currentMemberId={user.memberId}
          hasMore={hasMore}
          isLoadingOlder={isLoadingOlder}
          isLoadingHistory={isLoadingHistory}
          onLoadOlder={loadOlder}
          typingLabel={typingLabel}
        />

        <Composer
          onSend={sendMessage}
          onTyping={notifyTyping}
          disabled={status !== 'online'}
        />
      </div>
    </main>
  );
};

export default Chat;
