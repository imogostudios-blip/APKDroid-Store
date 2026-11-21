import { useEffect, useState } from 'react';
import { AuthView } from './components/AuthView';
import { ChatWorkspace } from './components/ChatWorkspace';
import type { PublicUser } from './types';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  function handleAuthenticated(nextToken: string, user: PublicUser) {
    setToken(nextToken);
    setCurrentUser(user);
  }

  function handleLogout() {
    setToken(null);
    setCurrentUser(null);
  }

  if (!token || !currentUser) {
    return (
      <AuthView
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((d) => !d)}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <ChatWorkspace
      token={token}
      currentUser={currentUser}
      darkMode={darkMode}
      onToggleDark={() => setDarkMode((d) => !d)}
      onUserUpdated={setCurrentUser}
      onLogout={handleLogout}
    />
  );
}
