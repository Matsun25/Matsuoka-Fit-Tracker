import React, { useState } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { authService } from './services/authService';
import { AuthUser } from './types/records';

export const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(() =>
    authService.getCurrentUser()
  );

  const handleSignOut = () => {
    void authService.signOut();
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLoginSuccess={setUser} />;
  }

  return <DashboardPage user={user} onSignOut={handleSignOut} />;
};

export default App;

