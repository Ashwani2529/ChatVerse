import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import Chat from './components/Chat/Chat';
import Join from './components/Join/Join';
import Spinner from './components/ui/Spinner';

const FullScreenLoader = () => (
  <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 text-slate-400">
    <Spinner size="lg" className="text-brand-400" label="Restoring your session" />
    <p className="text-sm">Restoring your session…</p>
  </div>
);

/** Waits for the saved-token check before deciding where to send the user. */
const RequireAuth = ({ children }) => {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return children;
};

const RedirectIfSignedIn = ({ children }) => {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) return <FullScreenLoader />;
  if (isAuthenticated) return <Navigate to="/chat" replace />;

  return children;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RedirectIfSignedIn>
              <Join />
            </RedirectIfSignedIn>
          }
        />
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <Chat />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
