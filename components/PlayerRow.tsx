
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

  // Format time for display: "DD/MM HH:MM"
  const getDisplayTime = (ts: number | null) => {
    if (!ts) return '';
    const d = new Date(ts);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Parse pasted time - accepts formats like "21/11 15:30" or "15:30" or "21/11/2025 15:30:00"
  const parseTimeInput = (input: string): number | null => {
    if (!input.trim()) return null;

    // Try parsing as full date first
    let d = new Date(input);
    if (!isNaN(d.getTime())) return d.getTime();

    // Try DD/MM HH:MM or DD/MM HH:MM:SS format
    const match = input.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const year = match[3] ? (match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3])) : new Date().getFullYear();
      const hours = parseInt(match[4]);
      const minutes = parseInt(match[5]);
      const seconds = match[6] ? parseInt(match[6]) : 0;
      d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d.getTime();
    }

    // Try HH:MM format (today's date)
    const timeMatch = input.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const now = new Date();
      d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(timeMatch[1]), parseInt(timeMatch[2]), timeMatch[3] ? parseInt(timeMatch[3]) : 0);
      if (!isNaN(d.getTime())) return d.getTime();
    }

    return null;
  };

  const [editShotTime, setEditShotTime] = useState(getDisplayTime(player.lastShotTime));

  const windows = player.lastShotTime ? calculateProWindows(player.lastShotTime) : null;

  let computedStatus = PlayerStatus.OPEN;
  let timerDisplay = "--";
  let statusColor = "text-status-friendly";
  let statusBg = "";

  if (player.status === PlayerStatus.DEAD) {
    computedStatus = PlayerStatus.DEAD;
    statusColor = "text-gray-600 line-through";
    statusBg = "opacity-40";
  } else if (!player.lastShotTime || !windows) {
    computedStatus = PlayerStatus.OPEN;
    statusColor = "text-status-friendly";
    timerDisplay = "OPEN";
  } else {
    if (serverTime < windows.start) {
      computedStatus = PlayerStatus.PROTECTED;
      statusColor = "text-status-protected";
      timerDisplay = getRemainingTime(windows.start, serverTime);
    } else if (serverTime >= windows.start && serverTime < windows.end) {
      computedStatus = PlayerStatus.DROPPING;
      statusColor = "text-status-warning";
      statusBg = "bg-status-warning/5";
      timerDisplay = getRemainingTime(windows.end, serverTime);
    } else {
      computedStatus = PlayerStatus.OPEN;
      statusColor = "text-status-friendly";
      timerDisplay = "OPEN";
    }
  }

  useEffect(() => {
    if (player.status !== PlayerStatus.DEAD && player.status !== computedStatus) {
      onUpdate({ ...player, status: computedStatus });
    }
  }, [computedStatus, player, onUpdate]);

  const handleSave = () => {
    let newShotTime = player.lastShotTime;

    if (editShotTime) {
      const parsed = parseTimeInput(editShotTime);
      if (parsed) {
        newShotTime = parsed;
      }
    } else {
      newShotTime = null;
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

  const cellClass = "px-4 py-3 text-xs font-mono text-gray-400 align-middle";

  return (
    <tr className={`border-b border-tactical-border transition-colors tactical-row ${flash ? 'bg-accent-red/20' : ''} ${statusBg} ${player.status === PlayerStatus.DEAD ? 'opacity-40' : ''}`}>
      {/* Name */}
      <td className={cellClass}>
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-tactical-black border border-tactical-border text-white p-2 w-full focus:border-accent-red outline-none text-xs"
              placeholder="Name"
            />
            {player.faction === Faction.FRIENDLY && (
              <input
                value={editDiscordId}
                onChange={(e) => setEditDiscordId(e.target.value)}
                className="bg-tactical-black border border-tactical-border text-gray-400 p-1.5 w-full focus:border-accent-red outline-none text-[10px] font-mono"
                placeholder="Discord ID"
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            <span className={`text-sm font-sans font-medium ${player.status === PlayerStatus.DEAD ? 'text-gray-600 line-through' : 'text-white'}`}>
              {player.name}
            </span>
            {player.discordId && player.faction === Faction.FRIENDLY && (
              <span className="text-[10px] text-gray-600 mt-0.5">{player.discordId}</span>
            )}
          </div>
        )}
      </td>

      {/* Shot Time */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="text"
            value={editShotTime}
            onChange={(e) => setEditShotTime(e.target.value)}
            placeholder="DD/MM HH:MM"
            className="bg-tactical-black border border-tactical-border text-white p-2 w-full text-xs focus:border-accent-red outline-none font-mono"
          />
        ) : (
          player.lastShotTime ? (
            <span className="text-gray-300">{formatTime(player.lastShotTime)}</span>
          ) : <span className="text-gray-700">--</span>
        )}
      </td>

      {/* Pro Start */}
      <td className={cellClass}>
        {windows ? <span className="text-gray-500">{formatTime(windows.start)}</span> : <span className="text-gray-700">--</span>}
      </td>

      {/* Pro End */}
      <td className={cellClass}>
        {windows ? <span className="text-gray-500">{formatTime(windows.end)}</span> : <span className="text-gray-700">--</span>}
      </td>

      {/* Status */}
      <td className={cellClass}>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${
            computedStatus === PlayerStatus.OPEN ? 'bg-status-friendly' :
            computedStatus === PlayerStatus.PROTECTED ? 'bg-status-protected' :
            computedStatus === PlayerStatus.DROPPING ? 'bg-status-warning status-pulse' :
            'bg-gray-600'
          }`}></div>
          <span className={`text-xs font-medium uppercase tracking-wider ${statusColor}`}>
            {computedStatus === PlayerStatus.DEAD ? 'KIA' : timerDisplay}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center gap-1 justify-end">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="text-accent-red hover:bg-accent-red/20 p-1.5 transition-colors">
                <Save size={14} />
              </button>
              <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white p-1.5">
                <X size={14}/>
              </button>
            </>
          ) : (
            <>
              {canEdit && (
                <>
                  <button
                    onClick={handleShotNow}
                    className={`p-1.5 transition-colors ${feedback === 'shot' ? 'text-accent-red' : 'text-gray-500 hover:text-accent-red'}`}
                    title="Record Shot"
                  >
                    {feedback === 'shot' ? <Check size={14} /> : <Clock size={14} />}
                  </button>

                  {player.status !== PlayerStatus.DEAD && (
                    <button
                      onClick={handleSetDead}
                      className={`p-1.5 transition-colors ${confirmDead ? 'text-status-hostile bg-status-hostile/20' : 'text-gray-500 hover:text-status-hostile'}`}
                      title={confirmDead ? "Confirm KIA" : "Mark KIA"}
                    >
                      {confirmDead ? <AlertTriangle size={14} /> : <Skull size={14} />}
                    </button>
                  )}

                  {(player.status === PlayerStatus.PROTECTED || player.status === PlayerStatus.DROPPING) && (
                    <button
                      onClick={handleSetOpen}
                      className={`p-1.5 transition-colors ${feedback === 'open' ? 'text-status-friendly' : 'text-gray-500 hover:text-status-friendly'}`}
                      title="Force Open"
                    >
                      {feedback === 'open' ? <Check size={14} /> : <Target size={14} />}
                    </button>
                  )}

                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-600 hover:text-white p-1.5"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                </>
              )}

              {canDelete && (
                <button
                  onClick={() => onDelete(player.id)}
                  className="text-gray-600 hover:text-status-hostile p-1.5"
                  title="Delete"
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
