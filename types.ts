
export enum GameState {
  UPLOAD = 'UPLOAD',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  RESULTS = 'RESULTS'
}

export type GameMode = 'DIGITAL' | 'PHYSICAL';

export type HardcoreMode = 'NONE' | 'NO_BACKSPACE' | 'SUDDEN_DEATH' | 'STOP_ON_ERROR';

export interface ExamEvaluation {
  kdph: number;
  totalKeyDepressions: number;
  fullMistakes: number;
  halfMistakes: number;
  totalPenaltyWords: number;
  netWpm: number;
  accuracy: number;
  errorPercentage: number;
  maxAllowedError: number;
  status: 'QUALIFIED' | 'DISQUALIFIED';
}

export type GhostPacerMode = 'OFF' | '30_WPM' | '35_WPM' | '40_WPM' | '50_WPM' | 'PERSONAL_BEST';

export type HindiKeyboardMode = 'ENGLISH' | 'MANGAL_INSCRIPT' | 'KRUTIDEV';

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
  // Gamification result display
  badgesUnlocked?: Badge[];
  xpGained?: number;
  // SSC Mode Specifics & Exam Evaluation
  isSSC?: boolean;
  sscMarks?: number;
  examEval?: ExamEvaluation;
  kdph?: number;
  hardcoreMode?: HardcoreMode;
  // Ghost Pacer & Metronome
  pacerMode?: GhostPacerMode;
  ghostWpm?: number;
  metronomeBpm?: number;
  // Latency & Biomechanics
  avgLatencyMs?: number;
  keyLatencies?: Record<string, number>; // key -> avg ms
  fingerLatencies?: Record<string, number>; // finger -> avg ms
  // Language Mode
  hindiMode?: HindiKeyboardMode;
  // Source saved-test or lesson id
  testId?: string;
  lessonId?: string;
}

export interface StoredResult {
  id: string;
  timestamp: number;
  netWpm: number;
  accuracy: number;
  mode: GameMode;
  testId?: string;
  kdph?: number;
  hardcoreMode?: HardcoreMode;
  avgLatencyMs?: number;
}

export interface SavedTest {
  id: string;
  title: string;
  text: string;
  imageSrc: string | null;
  createdAt: number;
  gameMode: GameMode;
  hindiMode?: HindiKeyboardMode;
}

export interface ExtractedContent {
  text: string;
}

export type TimeLimit = 0 | 60 | 120 | 300 | 600; // 0 means "Finish Text"

// --- Typing Master Lesson Types ---

export interface LessonExercise {
  id: string;
  title: string;
  type: 'drill' | 'words' | 'sentences';
  targetKeys: string[];
  text: string;
}

export interface Lesson {
  id: string;
  stage: number;
  stageTitle: string;
  title: string;
  description: string;
  targetKeys: string[];
  minAccuracy: number;
  minWpm: number;
  exercises: LessonExercise[];
  hindiMode?: HindiKeyboardMode;
}

export interface LessonProgress {
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
  stars: number; // 1 to 3
  lastAttempt: number;
}

export type LessonProgressMap = Record<string, LessonProgress>;

// --- Practice Passage Types ---

export type PassageCategory = 'legal' | 'ssc' | 'literature' | 'tech' | 'numbers' | 'hindi' | 'collision';

export interface PracticePassage {
  id: string;
  title: string;
  category: PassageCategory;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Exam';
  wordCount: number;
  estimatedMinutes: number;
  description: string;
  text: string;
  hindiMode?: HindiKeyboardMode;
}

// --- Gamification Types ---

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: UserStats, lastResult: TestResults) => boolean;
}

export interface UserStats {
  totalTests: number;
  totalTimeSeconds: number;
  currentStreak: number;
  lastLoginDate: string; // YYYY-MM-DD
  bestWpm: number;
  unlockedBadges: string[];
  xp: number;
}

// --- Adaptive Learning & Biomechanical Collision Types ---

export type FingerId =
  | 'lp' | 'lr' | 'lm' | 'li'
  | 'ri' | 'rm' | 'rr' | 'rp'
  | 'thumb';

export type FingerCollisionType = 'SAME_FINGER_REACH' | 'ADJACENT_NEIGHBOR' | 'OPPOSITE_HAND' | 'OTHER';

export interface CollisionPairStat {
  expected: string;
  typed: string;
  count: number;
  type: FingerCollisionType;
  fingerA: FingerId;
  fingerB: FingerId;
}

export interface FingerCollisionSummary {
  sameFingerErrors: number;
  neighborErrors: number;
  totalErrors: number;
  sameFingerRatio: number; // 0 - 100 percentage
  neighborRatio: number;   // 0 - 100 percentage
  topConflicts: CollisionPairStat[];
}

export interface KeyStats {
  totalAttempts: number;
  totalErrors: number;
  lastErrorRate: number; // exponential moving average 0–1
  avgLatencyMs?: number;  // average reaction time in ms
}

export interface FingerStatsEntry {
  totalAttempts: number;
  totalErrors: number;
  errorRate: number; // 0–1
  weakKeys: string[]; // top 3 weakest keys for this finger
  avgLatencyMs?: number; // average reaction time in ms
}

export interface DailyEntry {
  date: string;        // YYYY-MM-DD
  day: number;         // 1–10
  sessionsCompleted: number;
  avgWpm: number;
  avgAccuracy: number;
  targetWpm: number;
  targetMet: boolean;
}

export interface AdaptiveProfile {
  keyStats: Record<string, KeyStats>;
  fingerStats: Record<string, FingerStatsEntry>;
  dailyLog: DailyEntry[];
  currentDay: number;            // 1–10
  totalSessionsToday: number;
  lastSessionDate: string;       // YYYY-MM-DD
  weakestFingers: FingerId[];    // sorted worst-first
  weakestKeys: string[];         // sorted worst-first (top 10)
  recommendedLessonId: string | null;
  overallAvgLatencyMs?: number;
  collisionStats?: FingerCollisionSummary;
}

