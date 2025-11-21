
import React, { useState, useEffect } from 'react';
import { SkillTimer, TimerStatus, UserRole } from '../types';
import { getRemainingTime } from '../utils/timeUtils';
import { Clock, Save, Trash2, Edit2, X, Play, Pause } from 'lucide-react';

interface SkillTimerRowProps {
  timer: SkillTimer;
  serverTime: number;
  userRole: UserRole;
  onUpdate: (timer: SkillTimer) => void;
  onDelete: (id: string) => void;
}

const SkillTimerRow: React.FC<SkillTimerRowProps> = ({ timer, serverTime, userRole, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(timer.playerName);
  const [editDiscordId, setEditDiscordId] = useState(timer.discordId || '');
  const [editDuration, setEditDuration] = useState('');

  const canEdit = userRole === UserRole.ADMIN || userRole === UserRole.EDITOR;
  const canDelete = userRole === UserRole.ADMIN;

  // Calculate timer status and display
  let computedStatus = timer.status;
  let timerDisplay = "--:--:--";
  let statusColor = "text-gray-500";

  if (timer.timerEndTime && timer.status === TimerStatus.ACTIVE) {
    const remaining = timer.timerEndTime - serverTime;
    if (remaining > 0) {
      timerDisplay = getRemainingTime(timer.timerEndTime, serverTime);
      statusColor = remaining < 5 * 60 * 1000 ? "text-status-warning" : "text-accent-red";
    } else {
      computedStatus = TimerStatus.EXPIRED;
      timerDisplay = "EXPIRED";
      statusColor = "text-status-friendly";
    }
  } else if (timer.status === TimerStatus.STOPPED) {
    timerDisplay = "STOPPED";
    statusColor = "text-gray-600";
  } else if (timer.status === TimerStatus.EXPIRED) {
    timerDisplay = "EXPIRED";
    statusColor = "text-status-friendly";
  }

  // Auto-update status when timer expires
  useEffect(() => {
    if (timer.status !== computedStatus) {
      onUpdate({ ...timer, status: computedStatus });
    }
  }, [computedStatus, timer, onUpdate]);

  const handleSave = () => {
    onUpdate({
      ...timer,
      playerName: editName,
      discordId: editDiscordId,
    });
    setIsEditing(false);
  };

  const handleStartTimer = () => {
    if (!editDuration) return;

    // Parse duration input (supports "2h", "30m", "1h30m", "90", etc.)
    const parseDuration = (input: string): number | null => {
      const cleaned = input.trim().toLowerCase();

      // Try parsing as pure number (assume minutes)
      const pureNumber = parseInt(cleaned);
      if (!isNaN(pureNumber) && cleaned === pureNumber.toString()) {
        return pureNumber * 60 * 1000;
      }

      // Parse formats like "2h", "30m", "1h30m", "2h 30m"
      let totalMs = 0;
      const hoursMatch = cleaned.match(/(\d+)\s*h/);
      const minutesMatch = cleaned.match(/(\d+)\s*m/);

      if (hoursMatch) totalMs += parseInt(hoursMatch[1]) * 60 * 60 * 1000;
      if (minutesMatch) totalMs += parseInt(minutesMatch[1]) * 60 * 1000;

      return totalMs > 0 ? totalMs : null;
    };

    const duration = parseDuration(editDuration);
    if (!duration) return;

    const endTime = Date.now() + duration;
    onUpdate({
      ...timer,
      timerEndTime: endTime,
      status: TimerStatus.ACTIVE,
      notified: false
    });
    setEditDuration('');
  };

  const handleStopTimer = () => {
    onUpdate({
      ...timer,
      timerEndTime: null,
      status: TimerStatus.STOPPED,
      notified: false
    });
  };

  const cellClass = "px-4 py-3 text-xs font-mono text-gray-400 align-middle";

  return (
    <tr className={`border-b border-tactical-border transition-colors tactical-row ${
      computedStatus === TimerStatus.ACTIVE && timer.timerEndTime && (timer.timerEndTime - serverTime) < 5 * 60 * 1000
        ? 'bg-status-warning/10'
        : ''
    }`}>
      {/* Name */}
      <td className={cellClass}>
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-tactical-black border border-tactical-border text-white p-2 w-full focus:border-accent-red outline-none text-xs"
              placeholder="Player Name"
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
              {timer.playerName}
            </span>
            {timer.discordId && (
              <span className="text-[10px] text-gray-600 mt-0.5">{timer.discordId}</span>
            )}
          </div>
        )}
      </td>

      {/* Set Timer Duration */}
      <td className={cellClass}>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={editDuration}
            onChange={(e) => setEditDuration(e.target.value)}
            placeholder="2h, 30m, 1h30m"
            className="bg-tactical-black border border-tactical-border text-white p-2 w-24 text-xs focus:border-accent-red outline-none font-mono"
            disabled={!canEdit}
          />
          {canEdit && (
            <button
              onClick={handleStartTimer}
              className="text-accent-red hover:bg-accent-red/20 p-1.5 transition-colors"
              title="Start Timer"
            >
              <Play size={14} />
            </button>
          )}
        </div>
      </td>

      {/* Time Remaining */}
      <td className={cellClass}>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${
            computedStatus === TimerStatus.ACTIVE ? 'bg-accent-red animate-pulse' :
            computedStatus === TimerStatus.EXPIRED ? 'bg-status-friendly' :
            'bg-gray-600'
          }`}></div>
          <span className={`text-sm font-medium uppercase tracking-wider ${statusColor}`}>
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
                  {timer.status === TimerStatus.ACTIVE && (
                    <button
                      onClick={handleStopTimer}
                      className="text-gray-500 hover:text-status-warning p-1.5 transition-colors"
                      title="Stop Timer"
                    >
                      <Pause size={14} />
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
                  onClick={() => onDelete(timer.id)}
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

export default SkillTimerRow;
