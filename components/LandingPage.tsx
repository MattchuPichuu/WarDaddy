
import React, { useState, useEffect } from 'react';
import { Shield, Lock, User as UserIcon } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>

        <div className={`relative z-10 p-8 max-w-md w-full flex flex-col items-center text-center bg-slate-900/90 border border-slate-800 shadow-2xl rounded-xl transition-all duration-700 ease-out ${bootSequence ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            
            {/* Logo Section */}
            <div className="mb-8 relative w-48 h-48 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-brand-cyan/20 rounded-lg animate-pulse"></div>

                <div className="relative z-10 bg-slate-950/50 p-2 rounded-lg border border-brand-cyan/50 shadow-[0_0_30px_rgba(6,182,212,0.3)] overflow-hidden backdrop-blur-sm">
                    <img
                        src="/assets/images/wardaddy-logo.png"
                        alt="WarDaddy Logo"
                        className="w-full h-full object-cover rounded-md"
                        onError={(e) => {
                            // Fallback to Shield icon if image not found
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    <div className="hidden w-full h-full flex items-center justify-center">
                        <Shield className="w-16 h-16 text-brand-cyan" />
                    </div>
                </div>

                <div className="absolute inset-0 bg-gradient-radial from-brand-cyan/10 via-transparent to-transparent animate-pulse"></div>
            </div>
            
            {/* Title */}
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-white tracking-tight mb-2 font-mono">
                    WAR<span className="text-brand-cyan">DADDY</span>
                </h1>
                <p className="text-slate-400 text-sm tracking-wide uppercase">Whack Protection System</p>
            </div>

            {/* Login Form Area */}
            <div className="space-y-6 w-full border-t border-slate-800 pt-6">
                <div className="flex flex-col gap-3">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wider text-left pl-1">Select Role</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(UserRole) as Array<keyof typeof UserRole>).map((key) => (
                            <button
                                key={key}
                                onClick={() => setSelectedRole(UserRole[key])}
                                className={`px-2 py-2 text-[10px] font-bold uppercase border rounded transition-all ${
                                    selectedRole === UserRole[key] 
                                    ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300'
                                }`}
                            >
                                {UserRole[key]}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={() => onLogin(selectedRole)}
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-3 px-6 rounded shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 group"
                >
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 26.15 26.15 0 0 0-3.338 6.868 19.81 19.81 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.025-.32 16.847.105 22.364a.08.08 0 0 0 .03.078 19.79 19.79 0 0 0 5.993 3.029.077.077 0 0 0 .084-.027 14.26 14.26 0 0 0 1.22-1.994.076.076 0 0 0-.041-.106 13.175 13.175 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.068 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.078c.424-5.518-.428-13.34-7.134-17.995a.07.07 0 0 0-.03-.028zM8.02 15.331c-1.18 0-2.156-1.085-2.156-2.419 0-1.333.956-2.418 2.156-2.418 1.21 0 2.176 1.095 2.156 2.418 0 1.334-.946 2.419-2.156 2.419zm7.975 0c-1.18 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.176 1.095 2.156 2.418 0 1.334-.946 2.419-2.156 2.419z"/>
                    </svg>
                    Login with Discord
                </button>
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-slate-600 text-[10px]">
                <Lock size={12} />
                <span>SECURE OAUTH 2.0 CONNECTION</span>
            </div>
        </div>
    </div>
  );
};

export default LandingPage;
