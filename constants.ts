
import { Faction, Player, PlayerStatus, SkillTimer, TimerStatus } from "./types";

// 3 Hours 40 Minutes = 220 minutes
export const PRO_START_OFFSET_MS = (3 * 60 + 40) * 60 * 1000;
// 4 Hours 20 Minutes = 260 minutes
export const PRO_END_OFFSET_MS = (4 * 60 + 20) * 60 * 1000;

// Alert threshold - notify when timer has this many minutes remaining
export const TIMER_ALERT_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// Initial Mock Data
export const INITIAL_FRIENDLIES: Player[] = [
  { id: 'f1', name: 'Hus', discordId: '123456789012345678', faction: Faction.FRIENDLY, status: PlayerStatus.PROTECTED, lastShotTime: Date.now() - 1000 * 60 * 30 },
  { id: 'f2', name: 'Klix', faction: Faction.FRIENDLY, status: PlayerStatus.OPEN, lastShotTime: null },
  { id: 'f3', name: 'Rubicon', faction: Faction.FRIENDLY, status: PlayerStatus.PROTECTED, lastShotTime: Date.now() - 1000 * 60 * 200 }, // In window
];

export const INITIAL_ENEMIES: Player[] = [
  { id: 'e1', name: 'Magus', faction: Faction.ENEMY, status: PlayerStatus.PROTECTED, lastShotTime: Date.now() - 1000 * 60 * 45 },
  { id: 'e2', name: 'CocaCola', faction: Faction.ENEMY, status: PlayerStatus.OPEN, lastShotTime: null },
  { id: 'e3', name: 'Frape', faction: Faction.ENEMY, status: PlayerStatus.DEAD, lastShotTime: null },
  { id: 'e4', name: 'Lizard', faction: Faction.ENEMY, status: PlayerStatus.OPEN, lastShotTime: null },
  { id: 'e5', name: 'Zuko', faction: Faction.ENEMY, status: PlayerStatus.DEAD, lastShotTime: null },
  { id: 'e6', name: 'Diverse', faction: Faction.ENEMY, status: PlayerStatus.OPEN, lastShotTime: null },
  { id: 'e7', name: 'SurelyNotPaff', faction: Faction.ENEMY, status: PlayerStatus.OPEN, lastShotTime: null },
  { id: 'e8', name: 'Oishi', faction: Faction.ENEMY, status: PlayerStatus.OPEN, lastShotTime: null },
  { id: 'e9', name: 'Beatriz', faction: Faction.ENEMY, status: PlayerStatus.OPEN, lastShotTime: null },
];

export const INITIAL_SKILL_TIMERS: SkillTimer[] = [
  { id: 'st1', playerName: 'Hus', discordId: '123456789012345678', timerEndTime: Date.now() + 1000 * 60 * 45, status: TimerStatus.ACTIVE, notified: false },
  { id: 'st2', playerName: 'Klix', timerEndTime: null, status: TimerStatus.STOPPED, notified: false },
  { id: 'st3', playerName: 'Rubicon', timerEndTime: Date.now() + 1000 * 60 * 120, status: TimerStatus.ACTIVE, notified: false },
];
