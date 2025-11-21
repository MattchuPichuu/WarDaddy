
import { Faction, Player, PlayerStatus, CMPlayer, SkillStatus } from "./types";

// 3 Hours 40 Minutes = 220 minutes
export const PRO_START_OFFSET_MS = (3 * 60 + 40) * 60 * 1000;
// 4 Hours 20 Minutes = 260 minutes
export const PRO_END_OFFSET_MS = (4 * 60 + 20) * 60 * 1000;

// CM Skill cooldown - 24 hours
export const SKILL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

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

export const INITIAL_CM_PLAYERS: CMPlayer[] = [
  { id: 'cm1', name: 'Hus', discordId: '123456789012345678', lastSkillTime: Date.now() - 1000 * 60 * 60 * 20, status: SkillStatus.CLOSED },
  { id: 'cm2', name: 'Klix', lastSkillTime: null, status: SkillStatus.OPEN },
  { id: 'cm3', name: 'Rubicon', lastSkillTime: Date.now() - 1000 * 60 * 60 * 25, status: SkillStatus.OPEN },
];
