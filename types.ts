
export enum GameState {
  UPLOAD = 'UPLOAD',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  RESULTS = 'RESULTS'
}

export type GameMode = 'DIGITAL' | 'PHYSICAL';

export interface TestResults {
  netWpm: number;
  rawWpm: number;
  accuracy: number;
  timeElapsed: number;
  totalChars: number;
  correctChars: number;
  incorrectChars: number;
  hardKeys: Record<string, number>;
  missedWords: Record<string, number>;
  history: { time: number; wpm: number; raw: number; accuracy: number }[];
  originalText?: string;
  typedText?: string;
  // New fields for gamification result display
  badgesUnlocked?: Badge[];
  xpGained?: number;
  // SSC Mode Specifics
  isSSC?: boolean;
  sscMarks?: number;
  // Source saved-test id for per-test analytics.
  testId?: string;
}

export interface StoredResult {
  id: string;
  timestamp: number;
  netWpm: number;
  accuracy: number;
  mode: GameMode;
  // Optional for backwards compatibility with older history entries.
  testId?: string;
}

export interface SavedTest {
  id: string;
  title: string;
  text: string; // The original extracted text
  imageSrc: string | null;
  createdAt: number;
  gameMode: GameMode;
}

export interface ExtractedContent {
  text: string;
}

export type TimeLimit = 0 | 60 | 120 | 300 | 600; // 0 means "Finish Text"

// --- Gamification Types ---

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or SVG path
  condition: (stats: UserStats, lastResult: TestResults) => boolean;
}

export interface UserStats {
  totalTests: number;
  totalTimeSeconds: number;
  currentStreak: number;
  lastLoginDate: string; // YYYY-MM-DD
  bestWpm: number;
  unlockedBadges: string[]; // List of badge IDs
  xp: number;
}
