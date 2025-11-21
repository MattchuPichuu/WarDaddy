
import React, { useState, useEffect } from 'react';
import { Faction, Player, PlayerStatus, User, UserRole, CMPlayer, SkillStatus } from '../types';
import { INITIAL_FRIENDLIES, INITIAL_ENEMIES, INITIAL_CM_PLAYERS } from '../constants';
import PlayerRow from './PlayerRow';
import CMSkillRow from './CMSkillRow';
import { generateSitrep } from '../services/geminiService';
import { postWarBoardToDiscord } from '../services/discordService';
import { Plus, LogOut, Clock, FileText, Send } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [friendlies, setFriendlies] = useState<Player[]>(INITIAL_FRIENDLIES);
  const [enemies, setEnemies] = useState<Player[]>(INITIAL_ENEMIES);
  const [cmPlayers, setCmPlayers] = useState<CMPlayer[]>(INITIAL_CM_PLAYERS);
  const [serverTime, setServerTime] = useState(Date.now());
  const [sitrep, setSitrep] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const canManage = user.role === UserRole.ADMIN;
  const canRunOps = user.role === UserRole.ADMIN || user.role === UserRole.EDITOR;

  // Sync Server Time to UTC+0 (MafiaMatrix server time)
  useEffect(() => {
    const updateServerTime = () => {
      // Date.now() already returns UTC milliseconds since epoch
      setServerTime(Date.now());
    };

    updateServerTime();
    const timer = setInterval(updateServerTime, 1000);
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

  const handleUpdateCMPlayer = (updatedPlayer: CMPlayer) => {
    setCmPlayers(cmPlayers.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  };

  const handleAddCMPlayer = () => {
    if (!canManage) return;

    const name = prompt("Enter CM Player Name:");
    if (!name) return;

    const discordId = prompt("Enter Discord ID (Numeric, Optional):") || '';

    const newPlayer: CMPlayer = {
      id: Date.now().toString(),
      name,
      discordId,
      lastSkillTime: null,
      status: SkillStatus.OPEN
    };

    setCmPlayers([...cmPlayers, newPlayer]);
  };

  const handleDeleteCMPlayer = (id: string) => {
    if (!canManage) return;
    if (!confirm("Delete CM player?")) return;
    setCmPlayers(cmPlayers.filter(p => p.id !== id));
  };

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
        handlePostBoard();
      }
    }
  };

  return (
    <div className="min-h-screen bg-tactical-black text-gray-200 pb-20 font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-tactical-dark/95 backdrop-blur border-b border-tactical-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/war-daddy-logo2.png" alt="War Daddy" className="h-10 w-auto" />
            <h1 className="text-lg font-bold text-white tracking-wider font-mono">
              WAR<span className="text-accent-red">DADDY</span>
            </h1>
            <span className="px-2 py-0.5 bg-tactical-gray text-[10px] font-medium text-tactical-text uppercase tracking-wider border border-tactical-border">
              {user.role}
            </span>
          </div>

          {/* Server Time */}
          <div className="flex items-center gap-2 font-mono text-sm text-white bg-tactical-gray px-4 py-2 border border-tactical-border">
            <Clock size={14} className="text-accent-red" />
            <span className="tracking-wider">{new Date(serverTime).toISOString().slice(11, 19)}</span>
            <span className="text-[10px] text-tactical-text ml-1">UTC+0</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {canRunOps && (
              <>
                <button
                  onClick={handlePostBoard}
                  disabled={isPosting}
                  className="hidden md:flex items-center gap-2 bg-tactical-gray hover:bg-tactical-border text-gray-300 border border-tactical-border px-3 py-2 text-xs uppercase tracking-wider transition-colors"
                >
                  <Send size={14} />
                  {isPosting ? 'Posting...' : 'Post to Discord'}
                </button>
                <button
                  onClick={handleGenerateSitrep}
                  disabled={isGenerating}
                  className="hidden md:flex items-center gap-2 bg-accent-red/10 hover:bg-accent-red/20 text-accent-red border border-accent-red/30 px-3 py-2 text-xs uppercase tracking-wider transition-colors"
                >
                  <FileText size={14} />
                  {isGenerating ? 'Generating...' : 'Intel Report'}
                </button>
              </>
            )}
            <button
              onClick={onLogout}
              className="text-tactical-text hover:text-white transition-colors p-2"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* AI Report Output */}
      {sitrep && (
        <div className="max-w-7xl mx-auto mt-6 px-4">
          <div className="bg-tactical-dark border border-tactical-border p-4">
            <div className="flex justify-between items-start mb-3 border-b border-tactical-border pb-2">
              <h3 className="text-accent-red font-medium text-xs uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} /> Intelligence Report
              </h3>
              <button
                onClick={() => { navigator.clipboard.writeText(sitrep); alert("Copied!"); }}
                className="text-[10px] bg-tactical-gray hover:bg-tactical-border text-gray-400 px-2 py-1 uppercase tracking-wider transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="font-mono text-xs text-gray-400 whitespace-pre-wrap leading-relaxed">{sitrep}</div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6 px-4">

        {/* Friendlies Panel */}
        <div className="bg-tactical-dark border border-tactical-border">
          <div className="flex justify-between items-center px-4 py-3 border-b border-tactical-border bg-tactical-gray/50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-status-friendly rounded-full"></div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Friendlies</h2>
              <span className="text-[10px] text-tactical-text font-mono">{friendlies.length}</span>
            </div>
            {canManage && (
              <button
                onClick={() => handleAddPlayer(Faction.FRIENDLY)}
                className="text-status-friendly hover:bg-status-friendly/10 p-1.5 transition-colors"
              >
                <Plus size={16}/>
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-tactical-text uppercase tracking-wider border-b border-tactical-border">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Shot Time</th>
                  <th className="px-4 py-3 font-medium">Pro Start</th>
                  <th className="px-4 py-3 font-medium">Pro End</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
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
        <div className="bg-tactical-dark border border-tactical-border">
          <div className="flex justify-between items-center px-4 py-3 border-b border-tactical-border bg-tactical-gray/50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-status-hostile rounded-full"></div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Hostiles</h2>
              <span className="text-[10px] text-tactical-text font-mono">{enemies.length}</span>
            </div>
            {canManage && (
              <button
                onClick={() => handleAddPlayer(Faction.ENEMY)}
                className="text-status-hostile hover:bg-status-hostile/10 p-1.5 transition-colors"
              >
                <Plus size={16}/>
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-tactical-text uppercase tracking-wider border-b border-tactical-border">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Shot Time</th>
                  <th className="px-4 py-3 font-medium">Pro Start</th>
                  <th className="px-4 py-3 font-medium">Pro End</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
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

      {/* CM Skills Panel */}
      <div className="max-w-7xl mx-auto mt-6 px-4">
        <div className="bg-tactical-dark border border-tactical-border">
          <div className="flex justify-between items-center px-4 py-3 border-b border-tactical-border bg-tactical-gray/50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-accent-red rounded-full"></div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">CM Skills</h2>
              <span className="text-[10px] text-tactical-text font-mono">{cmPlayers.length} Friendlies</span>
            </div>
            {canManage && (
              <button
                onClick={handleAddCMPlayer}
                className="text-accent-red hover:bg-accent-red/10 p-1.5 transition-colors"
              >
                <Plus size={16}/>
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-tactical-text uppercase tracking-wider border-b border-tactical-border">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Last Skill Time</th>
                  <th className="px-4 py-3 font-medium">Opens At</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cmPlayers.map(p => (
                  <CMSkillRow
                    key={p.id}
                    player={p}
                    serverTime={serverTime}
                    userRole={user.role}
                    onUpdate={handleUpdateCMPlayer}
                    onDelete={handleDeleteCMPlayer}
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
