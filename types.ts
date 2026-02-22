
export enum PatternType {
  COLOR = 'COLOR',
  SHAPE = 'SHAPE',
  SIZE = 'SIZE',
  NUMBER = 'NUMBER',
  EMOJI = 'EMOJI',
  ROTATION = 'ROTATION',
  ALPHABET = 'ALPHABET',
  QUANTITY = 'QUANTITY',
  NATURE = 'NATURE',
  FRUIT = 'FRUIT',
  MIRROR = 'MIRROR'
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export interface PatternItem {
  id: string;
  color?: string;
  shape?: 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'arrow' | 'dot' | 'sun' | 'moon' | 'cloud';
  size?: 'sm' | 'md' | 'lg';
  value?: number | string;
  rotation?: number; // degrees
  emoji?: string;
}

export interface Level {
  id: number;
  groupType: PatternType;
  levelInGroup: number; // 1 to 10
  difficulty: Difficulty;
  isBoss?: boolean;
  sequence: PatternItem[];
  options: PatternItem[];
  correctAnswerId: string;
  instruction: string;
}

export interface DailyStats {
  dateKey: string;
  completedToday: number;
  perfectToday: number;
  bossesToday: number;
}

export interface UserStats {
  stars: number;
  streak: number; // current correct streak
  bestStreak: number;
  completedLevels: number[]; // Global IDs
  unlockedGroups: PatternType[];
  lastPlayed: string;
  xp: number;
  badges: string[];
  fastestSolveMs: number | null;
  bossesCompleted: number;
  perfectCompletions: number;
  daily: DailyStats;
}