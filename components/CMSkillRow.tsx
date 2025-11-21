
import React, { useState, useEffect } from 'react';
import { CMPlayer, SkillStatus, UserRole } from '../types';
import { formatTime, getRemainingTime } from '../utils/timeUtils';
import { Clock, Save, Trash2, Edit2, X, Check } from 'lucide-react';
import { SKILL_COOLDOWN_MS } from '../constants';

interface CMSkillRowProps {
  player: CMPlayer;
  serverTime: number;
  userRole: UserRole;
  onUpdate: (player: CMPlayer) => void;
  onDelete: (id: string) => void;
}

const CMSkillRow: React.FC<CMSkillRowProps> = ({ player, serverTime, userRole, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [editDiscordId, setEditDiscordId] = useState(player.discordId || '');
  const [editSkillTime, setEditSkillTime] = useState('');
  const [feedback, setFeedback] = useState<'skilled' | null>(null);

  const canEdit = userRole === UserRole.ADMIN || userRole === UserRole.EDITOR;
  const canDelete = userRole === UserRole.ADMIN;

  // Format time for display in UTC+0
  const getDisplayTime = (ts: number | null) => {
    if (!ts) return '';
    const d = new Date(ts);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  // Parse pasted time as UTC
  const parseTimeInput = (input: string): number | null => {
    if (!input.trim()) return null;
    const cleaned = input.trim();

    let d = new Date(cleaned + ' UTC');
    if (!isNaN(d.getTime())) return d.getTime();

    d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d.getTime();

    const slashMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?)?/i);
    if (slashMatch) {
      let month = parseInt(slashMatch[1]) - 1;
      let day = parseInt(slashMatch[2]);
      let year = slashMatch[3].length === 2 ? 2000 + parseInt(slashMatch[3]) : parseInt(slashMatch[3]);
      let hours = slashMatch[4] ? parseInt(slashMatch[4]) : 0;
      let minutes = slashMatch[5] ? parseInt(slashMatch[5]) : 0;
      let seconds = slashMatch[6] ? parseInt(slashMatch[6]) : 0;
      const ampm = slashMatch[7];

      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }

      let timestamp = Date.UTC(year, month, day, hours, minutes, seconds);
      if (!isNaN(timestamp)) return timestamp;

      month = parseInt(slashMatch[2]) - 1;
      day = parseInt(slashMatch[1]);
      timestamp = Date.UTC(year, month, day, hours, minutes, seconds);
      if (!isNaN(timestamp)) return timestamp;
    }

    return null;
  };

  // Calculate skill status and timer
  let computedStatus = SkillStatus.OPEN;
  let timerDisplay = "OPEN";
  let skillOpenTime: number | null = null;

  if (player.lastSkillTime) {
    skillOpenTime = player.lastSkillTime + SKILL_COOLDOWN_MS;
    if (serverTime < skillOpenTime) {
      computedStatus = SkillStatus.CLOSED;
      timerDisplay = getRemainingTime(skillOpenTime, serverTime);
    } else {
      computedStatus = SkillStatus.OPEN;
      timerDisplay = "OPEN";
    }
  }

  // Auto-update status when it changes
  useEffect(() => {
    if (player.status !== computedStatus) {
      onUpdate({ ...player, status: computedStatus });
    }
  }, [computedStatus, player, onUpdate]);

  const handleSave = () => {
    let newSkillTime = player.lastSkillTime;

    if (editSkillTime) {
      const parsed = parseTimeInput(editSkillTime);
      if (parsed) {
        newSkillTime = parsed;
      }
    } else {
      newSkillTime = null;
    }

    onUpdate({
      ...player,
      name: editName,
      discordId: editDiscordId,
      lastSkillTime: newSkillTime,
      status: computedStatus
    });
    setIsEditing(false);
  };

  const handleSkillNow = () => {
    const now = Date.now();
    setEditSkillTime(getDisplayTime(now));
    onUpdate({
      ...player,
      lastSkillTime: now,
      status: SkillStatus.CLOSED
    });

    setFeedback('skilled');
    setTimeout(() => setFeedback(null), 1000);
  };

  const cellClass = "px-4 py-3 text-xs font-mono text-gray-400 align-middle";

  return (
    <tr className={`border-b border-tactical-border transition-colors tactical-row ${feedback === 'skilled' ? 'bg-accent-red/20' : ''}`}>
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
            <input
              value={editDiscordId}
              onChange={(e) => setEditDiscordId(e.target.value)}
              className="bg-tactical-black border border-tactical-border text-gray-400 p-1.5 w-full focus:border-accent-red outline-none text-[10px] font-mono"
              placeholder="Discord ID"
            />
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="text-sm font-sans font-medium text-white">
              {player.name}
            </span>
            {player.discordId && (
              <span className="text-[10px] text-gray-600 mt-0.5">{player.discordId}</span>
            )}
          </div>
        )}
      </td>

      {/* Last Skill Time */}
      <td className={cellClass}>
        {isEditing ? (
          <input
            type="text"
            value={editSkillTime}
            onChange={(e) => setEditSkillTime(e.target.value)}
            placeholder="Paste time (any format)"
            className="bg-tactical-black border border-tactical-border text-white p-2 w-full text-xs focus:border-accent-red outline-none font-mono"
          />
        ) : (
          player.lastSkillTime ? (
            <span className="text-gray-300">{formatTime(player.lastSkillTime)}</span>
          ) : <span className="text-gray-700">--</span>
        )}
      </td>

      {/* Skill Opens At */}
      <td className={cellClass}>
        {skillOpenTime ? <span className="text-gray-500">{formatTime(skillOpenTime)}</span> : <span className="text-gray-700">--</span>}
      </td>

      {/* Status */}
      <td className={cellClass}>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${
            computedStatus === SkillStatus.OPEN ? 'bg-status-friendly' : 'bg-status-warning'
          }`}></div>
          <span className={`text-xs font-medium uppercase tracking-wider ${
            computedStatus === SkillStatus.OPEN ? 'text-status-friendly' : 'text-status-warning'
          }`}>
            {timerDisplay}
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
                    onClick={handleSkillNow}
                    className={`p-1.5 transition-colors ${feedback === 'skilled' ? 'text-accent-red' : 'text-gray-500 hover:text-accent-red'}`}
                    title="Record Skill Used"
                  >
                    {feedback === 'skilled' ? <Check size={14} /> : <Clock size={14} />}
                  </button>

                  <button
                    onClick={() => {
                      setEditSkillTime(getDisplayTime(player.lastSkillTime));
                      setIsEditing(true);
                    }}
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

export default CMSkillRow;
