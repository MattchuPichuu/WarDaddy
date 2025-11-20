
import React, { useState, useEffect } from 'react';
import { Player, PlayerStatus, UserRole, Faction } from '../types';
import { calculateProWindows, formatTime, getRemainingTime } from '../utils/timeUtils';
import { Clock, Skull, Target, Save, Trash2, Edit2, X, Check, AlertTriangle } from 'lucide-react';

interface PlayerRowProps {
  player: Player;
  serverTime: number;
  userRole: UserRole;
  onUpdate: (player: Player) => void;
  onDelete: (id: string) => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ player, serverTime, userRole, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [editDiscordId, setEditDiscordId] = useState(player.discordId || '');
  const [feedback, setFeedback] = useState<'shot' | 'open' | null>(null);
  const [confirmDead, setConfirmDead] = useState(false);
  const [flash, setFlash] = useState(false);
  
  const canEdit = userRole === UserRole.ADMIN || userRole === UserRole.EDITOR;
  const canDelete = userRole === UserRole.ADMIN;

  useEffect(() => {
    if (confirmDead) {
        const timer = setTimeout(() => setConfirmDead(false), 3000);
        return () => clearTimeout(timer);
    }
  }, [confirmDead]);

  const getInputValue = (ts: number | null) => {
    if (!ts) return '';
    const d = new Date(ts);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [editShotTime, setEditShotTime] = useState(getInputValue(player.lastShotTime));

  // Calculate Pro Windows
  const windows = player.lastShotTime ? calculateProWindows(player.lastShotTime) : null;

  // Determine Status
  let computedStatus = PlayerStatus.OPEN;
  let timerDisplay = "--";
  let rowStatusColor = "text-slate-500";
  let bgHighlight = "";

  if (player.status === PlayerStatus.DEAD) {
      computedStatus = PlayerStatus.DEAD;
      rowStatusColor = "text-status-red font-bold line-through decoration-slate-600 opacity-50";
      bgHighlight = "bg-slate-950/30";
  } else if (!player.lastShotTime || !windows) {
      computedStatus = PlayerStatus.OPEN;
      rowStatusColor = "text-status-green font-bold";
      bgHighlight = "bg-status-green/5";
  } else {
      // Status Logic based on 3:40 - 4:20 window
      if (serverTime < windows.start) {
          // Before Window starts -> Protected
          computedStatus = PlayerStatus.PROTECTED;
          rowStatusColor = "text-brand-cyan font-bold";
          timerDisplay = `SAFE: ${getRemainingTime(windows.start, serverTime)}`;
      } else if (serverTime >= windows.start && serverTime < windows.end) {
          // Inside Window -> Dropping
          computedStatus = PlayerStatus.DROPPING;
          rowStatusColor = "text-status-amber font-bold animate-pulse";
          bgHighlight = "bg-status-amber/10";
          timerDisplay = `DROP: ${getRemainingTime(windows.end, serverTime)}`;
      } else {
          // After Window -> Open
          computedStatus = PlayerStatus.OPEN;
          rowStatusColor = "text-status-green font-bold";
          bgHighlight = "bg-status-green/5";
          timerDisplay = "OPEN";
      }
  }

  // Auto-update status in parent if it changes logically (optional)
  useEffect(() => {
      if (player.status !== PlayerStatus.DEAD && player.status !== computedStatus) {
          onUpdate({ ...player, status: computedStatus });
      }
  }, [computedStatus, player, onUpdate]);


  const handleSave = () => {
    let newShotTime = player.lastShotTime;
    
    if (editShotTime) {
        const d = new Date(editShotTime);
        if (!isNaN(d.getTime())) {
            newShotTime = d.getTime();
        }
    }

    onUpdate({
        ...player,
        name: editName,
        discordId: editDiscordId,
        lastShotTime: newShotTime,
        status: computedStatus
    });
    setIsEditing(false);
  };

  const handleShotNow = () => {
      const now = Date.now();
      setEditShotTime(getInputValue(now));
      onUpdate({
          ...player,
          lastShotTime: now,
          status: PlayerStatus.PROTECTED
      });
      
      // Visual Feedback
      setFeedback('shot');
      setFlash(true);
      setTimeout(() => {
          setFeedback(null);
          setFlash(false);
      }, 1000);
  }

  const handleSetDead = () => {
      if (!confirmDead) {
          setConfirmDead(true);
          return;
      }
      onUpdate({ ...player, status: PlayerStatus.DEAD, lastShotTime: null });
      setConfirmDead(false);
  }

  const handleSetOpen = () => {
      onUpdate({ ...player, status: PlayerStatus.OPEN, lastShotTime: null });
      setFeedback('open');
      setTimeout(() => setFeedback(null), 1000);
  }

  const cellClass = "p-3 text-sm font-medium text-slate-300 border-r border-slate-800/50 last:border-r-0 align-middle";

  return (
    <tr className={`transition-colors group border-b border-slate-800/50 ${flash ? 'bg-brand-cyan/20 duration-75' : 'hover:bg-slate-800/40 duration-300'} ${!flash && bgHighlight}`}>
      {/* Name & Discord ID */}
      <td className={cellClass}>
        {isEditing ? (
            <div className="flex flex-col gap-1">
                <input 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-white p-1.5 rounded w-full focus:border-brand-cyan outline-none text-sm"
                    placeholder="Name"
                />
                {player.faction === Faction.FRIENDLY && (
                     <input 
                     value={editDiscordId} 
                     onChange={(e) => setEditDiscordId(e.target.value)}
                     className="bg-slate-950 border border-slate-700 text-[#5865F2] p-1 rounded w-full focus:border-[#5865F2] outline-none text-xs font-mono"
                     placeholder="Discord ID (Numeric)"
                 />
                )}
            </div>
        ) : (
            <div className="flex flex-col">
                <span className={`${rowStatusColor} font-sans`}>{player.name}</span>
                {player.discordId && player.faction === Faction.FRIENDLY && (
                    <a 
                        href={`https://discord.com/users/${player.discordId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] text-[#5865F2] hover:text-white hover:bg-[#5865F2] px-1 py-0.5 rounded -ml-1 transition-all w-fit mt-1"
                        title="Open Discord Profile"
                    >
                         <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 26.15 26.15 0 0 0-3.338 6.868 19.81 19.81 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.025-.32 16.847.105 22.364a.08.08 0 0 0 .03.078 19.79 19.79 0 0 0 5.993 3.029.077.077 0 0 0 .084-.027 14.26 14.26 0 0 0 1.22-1.994.076.076 0 0 0-.041-.106 13.175 13.175 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.068 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.078c.424-5.518-.428-13.34-7.134-17.995a.07.07 0 0 0-.03-.028zM8.02 15.331c-1.18 0-2.156-1.085-2.156-2.419 0-1.333.956-2.418 2.156-2.418 1.21 0 2.176 1.095 2.156 2.418 0 1.334-.946 2.419-2.156 2.419zm7.975 0c-1.18 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.176 1.095 2.156 2.418 0 1.334-.946 2.419-2.156 2.419z"/>
                        </svg>
                        <span className="truncate max-w-[100px] font-mono font-bold">{player.discordId}</span>
                    </a>
                )}
            </div>
        )}
      </td>

      {/* Time Shot (Editable directly or via Edit mode) */}
      <td className={`${cellClass} font-mono`}>
        {isEditing ? (
             <input 
             type="datetime-local"
             value={editShotTime} 
             onChange={(e) => setEditShotTime(e.target.value)}
             className="bg-slate-950 border border-slate-700 text-white p-1.5 rounded w-full text-xs focus:border-brand-cyan outline-none font-mono"
         />
        ) : (
            player.lastShotTime ? (
                <div className="flex items-center gap-2 group/time cursor-pointer" onClick={() => canEdit && setIsEditing(true)} title="Click to edit time">
                    <span>{formatTime(player.lastShotTime)}</span>
                </div>
            ) : <span className="text-slate-600">--</span>
        )}
      </td>

      {/* Pro Start (+3:40) */}
      <td className={`${cellClass} font-mono text-xs text-slate-400`}>
        {windows ? formatTime(windows.start) : '--'}
      </td>

      {/* Pro End (+4:20) */}
      <td className={`${cellClass} font-mono text-xs text-slate-400`}>
        {windows ? formatTime(windows.end) : '--'}
      </td>

      {/* Status / Timer */}
      <td className={`${cellClass} font-mono`}>
          <span className={`text-sm ${
              computedStatus === PlayerStatus.PROTECTED ? 'text-slate-400' : 
              computedStatus === PlayerStatus.DROPPING ? 'text-status-amber font-bold' : 
              'text-status-green'
          }`}>
              {timerDisplay}
          </span>
      </td>

      {/* Actions */}
      <td className="p-3 text-right">
        <div className="flex items-center gap-1 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
            {isEditing ? (
                <>
                    <button onClick={handleSave} className="text-brand-cyan hover:text-white p-1.5 rounded bg-brand-cyan/10 hover:bg-brand-cyan/20"><Save size={16} /></button>
                    <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white p-1.5"><X size={16}/></button>
                </>
            ) : (
                <>
                    {canEdit && (
                        <>
                             <button 
                                onClick={handleShotNow} 
                                className={`p-1.5 rounded transition-all duration-200 ${feedback === 'shot' ? 'bg-brand-cyan text-white scale-110' : 'text-brand-cyan hover:text-white hover:bg-brand-cyan/20'}`}
                                title="Shot Now (Resets Timer)"
                            >
                                {feedback === 'shot' ? <Check size={16} /> : <Clock size={16} />}
                            </button>

                            {player.status !== PlayerStatus.DEAD && (
                                <button 
                                onClick={handleSetDead} 
                                className={`p-1.5 rounded transition-all duration-200 ${confirmDead ? 'bg-status-red text-white w-auto px-2 flex items-center gap-1' : 'text-status-red hover:text-white hover:bg-status-red/20'}`}
                                title={confirmDead ? "Click again to confirm" : "Mark Dead"}
                            >
                                {confirmDead ? <><AlertTriangle size={14} /><span className="text-[10px] font-bold">CONFIRM</span></> : <Skull size={16} />}
                            </button>
                            )}
                        
                        {(player.status === PlayerStatus.PROTECTED || player.status === PlayerStatus.DROPPING) && (
                            <button 
                            onClick={handleSetOpen} 
                            className={`p-1.5 rounded transition-all duration-200 ${feedback === 'open' ? 'bg-status-green text-white scale-110' : 'text-status-green hover:text-white hover:bg-status-green/20'}`}
                            title="Force Open"
                        >
                            {feedback === 'open' ? <Check size={16} /> : <Target size={16} />}
                        </button>
                        )}

                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="text-slate-500 hover:text-white ml-1 p-1.5 hover:bg-slate-800 rounded"
                                title="Edit Time/Name"
                            >
                                <Edit2 size={14} />
                            </button>
                        </>
                    )}
                    
                    {canDelete && (
                        <button 
                            onClick={() => onDelete(player.id)} 
                            className="text-slate-600 hover:text-status-red ml-1 p-1.5 hover:bg-slate-800 rounded"
                            title="Delete Unit"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </>
            )}
        </div>
      </td>
    </tr>
  );
};

export default PlayerRow;
