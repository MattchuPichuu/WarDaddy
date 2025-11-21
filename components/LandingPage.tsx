
import React, { useState, useEffect } from 'react';
import { Crosshair, Lock } from 'lucide-react';
import { UserRole } from '../types';

interface LandingPageProps {
  onLogin: (role: UserRole) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [bootSequence, setBootSequence] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBootSequence(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-tactical-black relative overflow-hidden font-sans">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 tactical-bg opacity-50"></div>

      <div className={`relative z-10 p-8 max-w-md w-full flex flex-col items-center text-center bg-tactical-dark border border-tactical-border shadow-2xl transition-all duration-700 ease-out ${bootSequence ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Logo Section */}
        <div className="mb-8 relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 border border-tactical-border"></div>
          <div className="absolute inset-2 border border-dashed border-tactical-border opacity-50"></div>

          <div className="relative z-10 bg-tactical-black p-4 border border-accent-gold/30">
            <Crosshair className="w-10 h-10 text-accent-gold" />
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-widest mb-2 font-mono">
            WAR<span className="text-accent-gold">DADDY</span>
          </h1>
          <p className="text-tactical-text text-xs tracking-[0.3em] uppercase">Whack Protection System</p>
        </div>

        {/* Login Form Area */}
        <div className="space-y-6 w-full border-t border-tactical-border pt-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] text-tactical-text uppercase font-medium tracking-widest text-left">Access Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(UserRole) as Array<keyof typeof UserRole>).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedRole(UserRole[key])}
                  className={`px-2 py-2.5 text-[10px] font-medium uppercase tracking-wider border transition-all ${
                    selectedRole === UserRole[key]
                      ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/50'
                      : 'bg-tactical-gray text-tactical-text border-tactical-border hover:border-gray-600 hover:text-white'
                  }`}
                >
                  {UserRole[key]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onLogin(selectedRole)}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-3 px-6 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-wider"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 26.15 26.15 0 0 0-3.338 6.868 19.81 19.81 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.025-.32 16.847.105 22.364a.08.08 0 0 0 .03.078 19.79 19.79 0 0 0 5.993 3.029.077.077 0 0 0 .084-.027 14.26 14.26 0 0 0 1.22-1.994.076.076 0 0 0-.041-.106 13.175 13.175 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.068 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.078c.424-5.518-.428-13.34-7.134-17.995a.07.07 0 0 0-.03-.028zM8.02 15.331c-1.18 0-2.156-1.085-2.156-2.419 0-1.333.956-2.418 2.156-2.418 1.21 0 2.176 1.095 2.156 2.418 0 1.334-.946 2.419-2.156 2.419zm7.975 0c-1.18 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.176 1.095 2.156 2.418 0 1.334-.946 2.419-2.156 2.419z"/>
            </svg>
            Authenticate
          </button>
        </div>

        <div className="mt-6 flex items-center gap-2 text-gray-600 text-[10px] uppercase tracking-widest">
          <Lock size={12} />
          <span>Secure Connection</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
