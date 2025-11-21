
export enum Faction {
  FRIENDLY = 'FRIENDLY',
  ENEMY = 'ENEMY',
}

export enum PlayerStatus {
  OPEN = 'OPEN',
  PROTECTED = 'PROTECTED',
  DROPPING = 'DROPPING',
  DEAD = 'DEAD',
  UNKNOWN = 'UNKNOWN'
}

export interface Player {
  id: string;
  name: string;
  discordId?: string; // Added for Discord linking
  faction: Faction;
  status: PlayerStatus;
  lastShotTime: number | null; // Timestamp in milliseconds
  notes?: string;
}

export interface WarState {
  friendlies: Player[];
  enemies: Player[];
}

export interface ServerTimeConfig {
  offset: number; // Difference between local and server time in ms
}

export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER'
}

export interface User {
  username: string;
  discriminator: string;
  avatar: string;
  role: UserRole;
}

export enum SkillStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export interface CMPlayer {
  id: string;
  name: string;
  discordId?: string;
  lastSkillTime: number | null; // Timestamp in milliseconds
  status: SkillStatus;
}
