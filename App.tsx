import React, { useState, useEffect } from 'react';
import IntroVideo from './components/IntroVideo';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { User, UserRole } from './types';

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('mm_tracker_user');
    const hasSeenIntro = localStorage.getItem('mm_intro_seen');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Skip intro if already seen
    if (hasSeenIntro === 'true') {
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
    localStorage.setItem('mm_intro_seen', 'true');
    setShowIntro(false);
  };

  const handleLogin = (role: UserRole) => {
    // Mock Login Process
    const mockUser: User = {
        username: "Commander",
        discriminator: "1337",
        avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
        role: role
    };
    localStorage.setItem('mm_tracker_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('mm_tracker_user');
    setUser(null);
  };

  return (
    <>
      {showIntro ? (
        <IntroVideo onComplete={handleIntroComplete} />
      ) : (
        <>
          {user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <LandingPage onLogin={handleLogin} />
          )}
        </>
      )}
    </>
  );
}

export default App;