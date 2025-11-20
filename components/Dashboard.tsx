
import React, { useState, useEffect } from 'react';
import { Faction, Player, PlayerStatus, User, UserRole } from '../types';
import { INITIAL_FRIENDLIES, INITIAL_ENEMIES } from '../constants';
import PlayerRow from './PlayerRow';
import { generateSitrep } from '../services/geminiService';
import { postWarBoardToDiscord } from '../services/discordService';
import { Plus, Bot, LogOut, Clock, Shield, FileText, Share2, Settings } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [friendlies, setFriendlies] = useState<Player[]>(INITIAL_FRIENDLIES);
  const [enemies, setEnemies] = useState<Player[]>(INITIAL_ENEMIES);
  const [serverTime, setServerTime] = useState(Date.now());
  const [sitrep, setSitrep] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Role Permissions
  const canManage = user.role === UserRole.ADMIN;
  const canRunOps = user.role === UserRole.ADMIN || user.role === UserRole.EDITOR;

  // Sync Server Time (Simulation)
  useEffect(() => {
    const timer = setInterval(() => {
      setServerTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdatePlayer = (faction: Faction, updatedPlayer: Player) => {
    const updateList = (list: Player[]) => 
      list.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);

    if (faction === Faction.FRIENDLY) setFriendlies(updateList(friendlies));
    else setEnemies(updateList(enemies));
  };

  const handleAddPlayer = (faction: Faction) => {
      if (!canManage) return;
      
      const name = prompt("Enter Player Name:");
      if (!name) return;

      let discordId = '';
      if (faction === Faction.FRIENDLY) {
          discordId = prompt("Enter Discord ID (Numeric, Optional):") || '';
      }
      
      const newPlayer: Player = {
          id: Date.now().toString(),
          name,
          discordId,
          faction,
          status: PlayerStatus.OPEN,
          lastShotTime: null
      };

      if (faction === Faction.FRIENDLY) setFriendlies([...friendlies, newPlayer]);
      else setEnemies([...enemies, newPlayer]);
  };

  const handleDeletePlayer = (faction: Faction, id: string) => {
      if (!canManage) return;
      if (!confirm("Delete player?")) return;
      if (faction === Faction.FRIENDLY) setFriendlies(friendlies.filter(p => p.id !== id));
      else setEnemies(enemies.filter(p => p.id !== id));
  }

  const handleGenerateSitrep = async () => {
      if (!canRunOps) return;
      setIsGenerating(true);
      setSitrep(null);
      const report = await generateSitrep(friendlies, enemies);
      setSitrep(report);
      setIsGenerating(false);
  };

  const handlePostBoard = async () => {
      if (!canRunOps) return;
      
      let webhook = localStorage.getItem('mm_discord_webhook');
      if (!webhook) {
          webhook = prompt("Enter Discord Webhook URL to enable posting:");
          if (webhook) localStorage.setItem('mm_discord_webhook', webhook);
          else return;
      }

      setIsPosting(true);
      const success = await postWarBoardToDiscord(webhook, friendlies, enemies, serverTime);
      setIsPosting(false);
      
      if (success) alert("Board posted to Discord successfully.");
      else {
          if (confirm("Failed to post. Update Webhook URL?")) {
              localStorage.removeItem('mm_discord_webhook');
              handlePostBoard(); // Retry logic
          }
      }
  };

  const TableHeader = ({ title, colorClass, count }: { title: string, colorClass: string, count: number }) => (
      <div className={`px-4 py-3 border-b border-slate-800 flex justify-between items-center ${colorClass} bg-opacity-10`}>
          <div className="flex items-center gap-2">
            <h2 className={`text-lg font-bold uppercase tracking-wide ${colorClass.replace('bg-', 'text-')}`}>{title}</h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">{count}</span>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans">
        {/* Top Bar */}
        <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 flex items-center justify-center">
                        <img
                            src="/assets/images/wardaddy-logo.png"
                            alt="WarDaddy"
                            className="w-full h-full object-cover rounded border border-brand-cyan/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                        <Shield className="hidden text-brand-cyan w-6 h-6" />
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight font-mono">WAR<span className="text-brand-cyan">DADDY</span></h1>
                    <div className="hidden md:flex px-2 py-0.5 bg-slate-800 rounded text-[10px] font-bold text-slate-400 tracking-wider uppercase items-center gap-1 border border-slate-700">
                        {user.role}
                    </div>
                </div>
                
                <div className="flex items-center gap-2 font-mono text-lg text-slate-200 bg-slate-950 px-4 py-1 rounded border border-slate-800 shadow-inner">
                    <Clock size={14} className="text-brand-cyan" />
                    <span>{new Date(serverTime).toLocaleTimeString([], { hour12: false })}</span>
                </div>

                <div className="flex items-center gap-4">
                    {canRunOps && (
                        <>
                            <button 
                                onClick={handlePostBoard}
                                disabled={isPosting}
                                className="hidden md:flex items-center gap-2 bg-slate-800 hover:bg-[#5865F2] hover:text-white text-slate-300 border border-slate-700 px-3 py-1.5 rounded text-sm transition-all"
                                title="Post Board to Discord Webhook"
                            >
                                <Share2 size={16} />
                                {isPosting ? 'Posting...' : 'Post Board'}
                            </button>
                            <button 
                                onClick={handleGenerateSitrep}
                                disabled={isGenerating}
                                className="hidden md:flex items-center gap-2 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-800 px-4 py-1.5 rounded text-sm transition-all hover:border-indigo-500"
                            >
                                <Bot size={16} />
                                {isGenerating ? 'Generating...' : 'Generate Report'}
                            </button>
                        </>
                    )}
                    <button onClick={onLogout} className="text-slate-500 hover:text-white transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </div>

        {/* AI Output */}
        {sitrep && (
            <div className="max-w-7xl mx-auto mt-6 mx-4 bg-slate-900 border border-slate-700 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 shadow-xl">
                 <div className="flex justify-between items-start mb-3 border-b border-slate-800 pb-2">
                     <h3 className="text-indigo-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14} /> Analysis Report
                     </h3>
                     <button 
                        onClick={() => { navigator.clipboard.writeText(sitrep); alert("Copied to clipboard!"); }}
                        className="text-xs bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 px-3 py-1 rounded transition-colors"
                    >
                        Copy to Clipboard
                     </button>
                 </div>
                 <div className="font-mono text-sm text-slate-300 whitespace-pre-wrap">{sitrep}</div>
            </div>
        )}

        {/* Main Grid */}
        <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8 px-4">
            
            {/* Friendlies Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg">
                <div className="flex justify-between items-center bg-slate-800/30">
                    <TableHeader title="Friendlies" colorClass="text-brand-cyan" count={friendlies.length} />
                    {canManage && (
                        <button onClick={() => handleAddPlayer(Faction.FRIENDLY)} className="mr-4 text-brand-cyan hover:text-white bg-brand-cyan/10 hover:bg-brand-cyan/20 p-1.5 rounded transition-colors"><Plus size={16}/></button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800 bg-slate-950/50">
                                <th className="p-3 font-semibold">Name / ID</th>
                                <th className="p-3 font-semibold">Time Shot</th>
                                <th className="p-3 font-semibold text-brand-cyan/70">Pro Start (+3:40)</th>
                                <th className="p-3 font-semibold text-status-red/70">Pro End (+4:20)</th>
                                <th className="p-3 font-semibold">Timer</th>
                                <th className="p-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {friendlies.map(p => (
                                <PlayerRow 
                                    key={p.id} 
                                    player={p} 
                                    serverTime={serverTime}
                                    userRole={user.role}
                                    onUpdate={(updated) => handleUpdatePlayer(Faction.FRIENDLY, updated)}
                                    onDelete={(id) => handleDeletePlayer(Faction.FRIENDLY, id)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Enemies Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg">
                <div className="flex justify-between items-center bg-slate-800/30">
                    <TableHeader title="Enemies" colorClass="text-status-red" count={enemies.length} />
                    {canManage && (
                         <button onClick={() => handleAddPlayer(Faction.ENEMY)} className="mr-4 text-status-red hover:text-white bg-status-red/10 hover:bg-status-red/20 p-1.5 rounded transition-colors"><Plus size={16}/></button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800 bg-slate-950/50">
                                <th className="p-3 font-semibold">Name</th>
                                <th className="p-3 font-semibold">Time Shot</th>
                                <th className="p-3 font-semibold text-brand-cyan/70">Pro Start (+3:40)</th>
                                <th className="p-3 font-semibold text-status-red/70">Pro End (+4:20)</th>
                                <th className="p-3 font-semibold">Timer</th>
                                <th className="p-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {enemies.map(p => (
                                <PlayerRow 
                                    key={p.id} 
                                    player={p} 
                                    serverTime={serverTime}
                                    userRole={user.role}
                                    onUpdate={(updated) => handleUpdatePlayer(Faction.ENEMY, updated)}
                                    onDelete={(id) => handleDeletePlayer(Faction.ENEMY, id)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    </div>
  );
};

export default Dashboard;
