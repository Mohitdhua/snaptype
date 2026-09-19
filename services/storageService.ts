
import { StoredResult, TestResults, GameMode, UserStats, Badge, SavedTest, FingerId, AdaptiveProfile } from '../types';
import { BADGES } from './badgeRules'; // We will define this next

const STORAGE_KEY = 'snaptype_history_v1';
const STATS_KEY = 'snaptype_stats_v1';
const SAVED_TESTS_KEY = 'snaptype_saved_tests_v1';

const DEFAULT_STATS: UserStats = {
  totalTests: 0,
  totalTimeSeconds: 0,
  currentStreak: 0,
  lastLoginDate: '',
  bestWpm: 0,
  unlockedBadges: [],
  xp: 0
};

const isGameMode = (mode: unknown): mode is GameMode => mode === 'DIGITAL' || mode === 'PHYSICAL';

const toLocalIsoDate = (dateLike: Date | number = new Date()) => {
  const date = typeof dateLike === 'number' ? new Date(dateLike) : dateLike;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const saveResult = (
  results: TestResults,
  mode: GameMode,
  context?: { testId?: string }
): { updatedHistory: StoredResult[]; newBadges: Badge[]; xpGained: number; updatedStats: UserStats } => {
  // 1. Save History
  const newEntry: StoredResult = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    netWpm: results.netWpm,
    accuracy: results.accuracy,
    mode: mode,
    testId: context?.testId,
    avgLatencyMs: results.avgLatencyMs
  };

  const existing = getHistory();
  const updatedHistory = [...existing, newEntry].slice(-50);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Failed to save history", e);
  }

  // 2. Update Stats & Check Gamification
  const stats = getUserStats();
  const today = toLocalIsoDate();
  
  let newStreak = stats.currentStreak;
  if (stats.lastLoginDate !== today) {
      const yesterday = toLocalIsoDate(Date.now() - 86400000);
      if (stats.lastLoginDate === yesterday) {
          newStreak += 1;
      } else {
          newStreak = 1; // Reset if missed a day, or 1 if new
      }
  }

  // Simple XP formula: 10 XP base + WPM
  const xpGained = 10 + results.netWpm;

  const updatedStats: UserStats = {
      totalTests: stats.totalTests + 1,
      totalTimeSeconds: stats.totalTimeSeconds + results.timeElapsed,
      currentStreak: newStreak,
      lastLoginDate: today,
      bestWpm: Math.max(stats.bestWpm, results.netWpm),
      unlockedBadges: [...stats.unlockedBadges],
      xp: stats.xp + xpGained
  };

  // Check for new badges
  const newBadges: Badge[] = [];
  BADGES.forEach(badge => {
      if (!updatedStats.unlockedBadges.includes(badge.id)) {
          if (badge.condition(updatedStats, results)) {
              newBadges.push(badge);
              updatedStats.unlockedBadges.push(badge.id);
          }
      }
  });

  try {
      localStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
  } catch (e) {
      console.error("Failed to save stats", e);
  }
  
  return { updatedHistory, newBadges, xpGained, updatedStats };
};

export const getHistory = (): StoredResult[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is Partial<StoredResult> => !!entry && typeof entry === 'object')
      .map(entry => ({
        id: String(entry.id ?? Date.now()),
        timestamp: Number(entry.timestamp ?? Date.now()),
        netWpm: Number(entry.netWpm ?? 0),
        accuracy: Number(entry.accuracy ?? 0),
        mode: isGameMode(entry.mode) ? entry.mode : 'DIGITAL',
        testId: typeof entry.testId === 'string' ? entry.testId : undefined,
        avgLatencyMs: typeof entry.avgLatencyMs === 'number' ? entry.avgLatencyMs : undefined
      }));
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const getUserStats = (): UserStats => {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<UserStats>;
            return {
                ...DEFAULT_STATS,
                ...parsed,
                totalTests: Number(parsed.totalTests ?? 0),
                totalTimeSeconds: Number(parsed.totalTimeSeconds ?? 0),
                currentStreak: Number(parsed.currentStreak ?? 0),
                bestWpm: Number(parsed.bestWpm ?? 0),
                xp: Number(parsed.xp ?? 0),
                lastLoginDate: typeof parsed.lastLoginDate === 'string' ? parsed.lastLoginDate : '',
                unlockedBadges: Array.isArray(parsed.unlockedBadges) ? parsed.unlockedBadges.map(String) : []
            };
        }
    } catch (e) {
        console.error("Failed to load stats", e);
    }
    
    return DEFAULT_STATS;
};

// --- Saved Tests Logic ---

export const getSavedTests = (): SavedTest[] => {
    try {
        const raw = localStorage.getItem(SAVED_TESTS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((test): test is Partial<SavedTest> => !!test && typeof test === 'object')
            .map(test => ({
                id: String(test.id ?? Date.now()),
                title: typeof test.title === 'string' ? test.title : 'Untitled Test',
                text: typeof test.text === 'string' ? test.text : '',
                imageSrc: typeof test.imageSrc === 'string' ? test.imageSrc : null,
                createdAt: Number(test.createdAt ?? Date.now()),
                gameMode: isGameMode(test.gameMode) ? test.gameMode : 'DIGITAL'
            }))
            .filter(test => test.text.trim().length > 0);
    } catch (e) {
        console.error("Failed to load saved tests", e);
        return [];
    }
};

export const saveTest = (testData: Omit<SavedTest, 'id' | 'createdAt'>): SavedTest => {
    let savedTests = getSavedTests();
    
    // Check for duplicates to avoid spamming the same content
    const existingIndex = savedTests.findIndex(t => t.text === testData.text);
    if (existingIndex !== -1) {
        // Move to top if exists
        const existing = savedTests[existingIndex];
        savedTests.splice(existingIndex, 1);
        const updated = { ...existing, ...testData, createdAt: Date.now() };
        savedTests.unshift(updated);
        try {
            localStorage.setItem(SAVED_TESTS_KEY, JSON.stringify(savedTests));
        } catch (e) { console.error("Failed to update test timestamp", e); }
        return updated;
    }

    // Auto-rotation: if limit reached, remove oldest (last element)
    if (savedTests.length >= 20) {
        savedTests.pop();
    }

    const newTest: SavedTest = {
        ...testData,
        id: Date.now().toString(),
        createdAt: Date.now()
    };

    const updatedTests = [newTest, ...savedTests];

    try {
        localStorage.setItem(SAVED_TESTS_KEY, JSON.stringify(updatedTests));
    } catch (e) {
        console.error("Failed to save test", e);
        // Fallback: Try removing one more if quota is tight
        if (updatedTests.length > 1) {
             updatedTests.pop();
             try {
                localStorage.setItem(SAVED_TESTS_KEY, JSON.stringify(updatedTests));
             } catch (retryErr) {
                 console.error("Failed to save test even after rotation", retryErr);
             }
        }
    }
    return newTest;
};

export const deleteSavedTest = (id: string): SavedTest[] => {
    const savedTests = getSavedTests();
    const updatedTests = savedTests.filter(t => t.id !== id);
    try {
        localStorage.setItem(SAVED_TESTS_KEY, JSON.stringify(updatedTests));
    } catch (e) {
        console.error("Failed to delete saved test", e);
    }
    return updatedTests;
};

// --- Typing Master Lesson Progress & Exam Grading ---

const LESSON_PROGRESS_KEY = 'snaptype_lesson_progress_v1';

export const getLessonProgress = (): Record<string, { completed: boolean; bestWpm: number; bestAccuracy: number; stars: number; lastAttempt: number }> => {
  try {
    const raw = localStorage.getItem(LESSON_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveLessonProgress = (
  lessonId: string,
  wpm: number,
  accuracy: number,
  stars: number
) => {
  const current = getLessonProgress();
  const prev = current[lessonId];
  current[lessonId] = {
    completed: true,
    bestWpm: Math.max(prev?.bestWpm || 0, wpm),
    bestAccuracy: Math.max(prev?.bestAccuracy || 0, accuracy),
    stars: Math.max(prev?.stars || 0, stars),
    lastAttempt: Date.now(),
  };
  try {
    localStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save lesson progress', e);
  }
  return current;
};

export const calculateExamEvaluation = (
  results: TestResults,
  category: 'UR' | 'OBC_SC_ST' = 'UR'
) => {
  const minutes = Math.max(0.1, results.timeElapsed / 60);
  const totalKeyDepressions = results.totalChars;
  const kdph = Math.round((totalKeyDepressions / minutes) * 60);

  const missedWordsCount = Object.values(results.missedWords || {}).reduce((a, b) => a + b, 0);
  const fullMistakes = missedWordsCount;
  const halfMistakes = Math.max(0, Math.round(results.incorrectChars / 3));

  const totalMistakeCount = fullMistakes + (halfMistakes * 0.5);
  const totalWords = Math.max(1, Math.round(results.totalChars / 5));
  const errorPercentage = Math.round((totalMistakeCount / totalWords) * 100 * 10) / 10;

  const maxAllowedError = category === 'UR' ? 5 : 7;
  const status: 'QUALIFIED' | 'DISQUALIFIED' =
    errorPercentage <= maxAllowedError && results.netWpm >= 35 ? 'QUALIFIED' : 'DISQUALIFIED';

  return {
    kdph,
    totalKeyDepressions,
    fullMistakes,
    halfMistakes,
    totalPenaltyWords: Math.round(totalMistakeCount),
    netWpm: results.netWpm,
    accuracy: results.accuracy,
    errorPercentage,
    maxAllowedError,
    status
  };
};

// ======== Adaptive Learning System ========

const ADAPTIVE_KEY = 'snaptype_adaptive_v1';

// Finger map (same as HandsGuide but standalone for service layer)
export const FINGER_MAP_SERVICE: Record<string, FingerId> = {
  '`': 'lp', '~': 'lp', '1': 'lp', '!': 'lp', 'q': 'lp', 'a': 'lp', 'z': 'lp',
  '2': 'lr', '@': 'lr', 'w': 'lr', 's': 'lr', 'x': 'lr',
  '3': 'lm', '#': 'lm', 'e': 'lm', 'd': 'lm', 'c': 'lm',
  '4': 'li', '$': 'li', '5': 'li', '%': 'li', 'r': 'li', 't': 'li', 'f': 'li', 'g': 'li', 'v': 'li', 'b': 'li',
  ' ': 'thumb',
  '6': 'ri', '^': 'ri', '7': 'ri', '&': 'ri', 'y': 'ri', 'u': 'ri', 'h': 'ri', 'j': 'ri', 'n': 'ri', 'm': 'ri',
  '8': 'rm', '*': 'rm', 'i': 'rm', 'k': 'rm', ',': 'rm', '<': 'rm',
  '9': 'rr', '(': 'rr', 'o': 'rr', 'l': 'rr', '.': 'rr', '>': 'rr',
  '0': 'rp', ')': 'rp', '-': 'rp', '_': 'rp', '=': 'rp', '+': 'rp',
  'p': 'rp', '[': 'rp', '{': 'rp', ']': 'rp', '}': 'rp', '\\': 'rp', '|': 'rp',
  ';': 'rp', ':': 'rp', "'": 'rp', '"': 'rp', '/': 'rp', '?': 'rp',
};

export const FINGER_COLUMN_INDEX: Record<FingerId, number> = {
  lp: 0,
  lr: 1,
  lm: 2,
  li: 3,
  thumb: 4,
  ri: 5,
  rm: 6,
  rr: 7,
  rp: 8,
};

export const getFingerForKey = (key: string): FingerId => {
  return FINGER_MAP_SERVICE[key.toLowerCase()] || FINGER_MAP_SERVICE[key] || 'thumb';
};

/** Classify typos into intra-finger reach errors vs adjacent-finger neighbor collisions */
export const classifyTypo = (
  expectedChar: string,
  typedChar: string
): { type: 'SAME_FINGER_REACH' | 'ADJACENT_NEIGHBOR' | 'OPPOSITE_HAND' | 'OTHER'; fingerA: FingerId; fingerB: FingerId } => {
  const fingerA = getFingerForKey(expectedChar);
  const fingerB = getFingerForKey(typedChar);

  if (fingerA === fingerB) {
    return { type: 'SAME_FINGER_REACH', fingerA, fingerB };
  }

  const colA = FINGER_COLUMN_INDEX[fingerA];
  const colB = FINGER_COLUMN_INDEX[fingerB];

  const isLeftA = colA <= 3;
  const isLeftB = colB <= 3;
  const isRightA = colA >= 5;
  const isRightB = colB >= 5;

  if ((isLeftA && isLeftB) || (isRightA && isRightB)) {
    if (Math.abs(colA - colB) === 1) {
      return { type: 'ADJACENT_NEIGHBOR', fingerA, fingerB };
    }
  }

  if ((isLeftA && isRightB) || (isRightA && isLeftB)) {
    return { type: 'OPPOSITE_HAND', fingerA, fingerB };
  }

  return { type: 'OTHER', fingerA, fingerB };
};

const toLocalDate = (d: Date | number = new Date()) => {
  const date = typeof d === 'number' ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const EMA_ALPHA = 0.3; // exponential moving average weight for recent sessions

const DEFAULT_ADAPTIVE: AdaptiveProfile = {
  keyStats: {},
  fingerStats: {},
  dailyLog: [],
  currentDay: 1,
  totalSessionsToday: 0,
  lastSessionDate: '',
  weakestFingers: [],
  weakestKeys: [],
  recommendedLessonId: null,
};

export const getAdaptiveProfile = (): AdaptiveProfile => {
  try {
    const raw = localStorage.getItem(ADAPTIVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ADAPTIVE, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_ADAPTIVE };
};

export const updateAdaptiveProfile = (results: TestResults): AdaptiveProfile => {
  const profile = getAdaptiveProfile();
  const originalText = results.originalText || '';
  const typedText = results.typedText || '';

  if (originalText.length === 0 || typedText.length === 0) {
    return profile;
  }

  // 1. Per-key analysis & Collision tracking
  const sessionKeyHits: Record<string, { attempts: number; errors: number }> = {};
  const len = Math.min(originalText.length, typedText.length);
  
  let sessionSameFinger = 0;
  let sessionNeighbor = 0;
  let sessionTotalErrors = 0;
  const sessionConflicts: Record<string, { expected: string; typed: string; count: number; type: 'SAME_FINGER_REACH' | 'ADJACENT_NEIGHBOR' | 'OPPOSITE_HAND' | 'OTHER'; fingerA: FingerId; fingerB: FingerId }> = {};

  for (let i = 0; i < len; i++) {
    const expected = originalText[i].toLowerCase();
    const typed = typedText[i].toLowerCase();
    if (!sessionKeyHits[expected]) {
      sessionKeyHits[expected] = { attempts: 0, errors: 0 };
    }
    sessionKeyHits[expected].attempts++;
    if (typed !== expected) {
      sessionKeyHits[expected].errors++;
      sessionTotalErrors++;

      const cInfo = classifyTypo(expected, typed);
      if (cInfo.type === 'SAME_FINGER_REACH') {
        sessionSameFinger++;
      } else if (cInfo.type === 'ADJACENT_NEIGHBOR') {
        sessionNeighbor++;
      }

      if (expected.trim() && typed.trim()) {
        const pKey = `${expected}→${typed}`;
        if (!sessionConflicts[pKey]) {
          sessionConflicts[pKey] = {
            expected,
            typed,
            count: 0,
            type: cInfo.type,
            fingerA: cInfo.fingerA,
            fingerB: cInfo.fingerB,
          };
        }
        sessionConflicts[pKey].count++;
      }
    }
  }

  // 2. Merge session data into profile keyStats with EMA
  for (const [key, session] of Object.entries(sessionKeyHits)) {
    const prev = profile.keyStats[key] || { totalAttempts: 0, totalErrors: 0, lastErrorRate: 0 };
    const sessionErrorRate = session.errors / Math.max(1, session.attempts);
    const newErrorRate = prev.totalAttempts === 0
      ? sessionErrorRate
      : (EMA_ALPHA * sessionErrorRate) + ((1 - EMA_ALPHA) * prev.lastErrorRate);

    const sessionLatency = results.keyLatencies?.[key];
    const newLatency = sessionLatency
      ? (prev.avgLatencyMs ? Math.round((prev.avgLatencyMs * 0.7) + (sessionLatency * 0.3)) : sessionLatency)
      : prev.avgLatencyMs;

    profile.keyStats[key] = {
      totalAttempts: prev.totalAttempts + session.attempts,
      totalErrors: prev.totalErrors + session.errors,
      lastErrorRate: Math.round(newErrorRate * 1000) / 1000,
      avgLatencyMs: newLatency,
    };
  }

  // 3. Rebuild per-finger stats from aggregated keyStats
  const ALL_FINGERS: FingerId[] = ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'];
  const fingerBuckets: Record<string, { attempts: number; errors: number; keys: { key: string; rate: number }[]; latencies: number[] }> = {};
  for (const f of ALL_FINGERS) {
    fingerBuckets[f] = { attempts: 0, errors: 0, keys: [], latencies: [] };
  }

  for (const [key, stats] of Object.entries(profile.keyStats)) {
    const finger = getFingerForKey(key);
    const bucket = fingerBuckets[finger];
    if (bucket) {
      bucket.attempts += stats.totalAttempts;
      bucket.errors += stats.totalErrors;
      if (stats.avgLatencyMs) {
        bucket.latencies.push(stats.avgLatencyMs);
      }
      if (stats.totalAttempts >= 5) {
        bucket.keys.push({ key, rate: stats.lastErrorRate });
      }
    }
  }

  for (const [finger, bucket] of Object.entries(fingerBuckets)) {
    const errorRate = bucket.attempts > 0 ? bucket.errors / bucket.attempts : 0;
    bucket.keys.sort((a, b) => b.rate - a.rate);
    const fingerAvgLatency = bucket.latencies.length > 0
      ? Math.round(bucket.latencies.reduce((a, b) => a + b, 0) / bucket.latencies.length)
      : undefined;

    profile.fingerStats[finger] = {
      totalAttempts: bucket.attempts,
      totalErrors: bucket.errors,
      errorRate: Math.round(errorRate * 1000) / 1000,
      weakKeys: bucket.keys.slice(0, 3).map(k => k.key),
      avgLatencyMs: fingerAvgLatency,
    };
  }

  // 4. Merge Biomechanical Collision Profiles
  const prevCollisions = profile.collisionStats;
  const prevConflicts = prevCollisions?.topConflicts || [];
  const mergedConflictsMap: Record<string, any> = {};
  for (const c of prevConflicts) {
    mergedConflictsMap[`${c.expected}→${c.typed}`] = { ...c };
  }
  for (const [key, c] of Object.entries(sessionConflicts)) {
    if (!mergedConflictsMap[key]) {
      mergedConflictsMap[key] = { ...c };
    } else {
      mergedConflictsMap[key].count += c.count;
    }
  }

  const topConflicts = Object.values(mergedConflictsMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const cumTotalErrors = (prevCollisions?.totalErrors || 0) + sessionTotalErrors;
  const cumSameFinger = (prevCollisions?.sameFingerErrors || 0) + sessionSameFinger;
  const cumNeighbor = (prevCollisions?.neighborErrors || 0) + sessionNeighbor;

  profile.collisionStats = {
    totalErrors: cumTotalErrors,
    sameFingerErrors: cumSameFinger,
    neighborErrors: cumNeighbor,
    sameFingerRatio: cumTotalErrors > 0 ? Math.round((cumSameFinger / cumTotalErrors) * 100) : 0,
    neighborRatio: cumTotalErrors > 0 ? Math.round((cumNeighbor / cumTotalErrors) * 100) : 0,
    topConflicts,
  };

  if (results.avgLatencyMs) {
    profile.overallAvgLatencyMs = profile.overallAvgLatencyMs
      ? Math.round((profile.overallAvgLatencyMs * 0.7) + (results.avgLatencyMs * 0.3))
      : results.avgLatencyMs;
  }

  // 5. Compute weakest fingers (exclude thumb, sort by error rate desc)
  profile.weakestFingers = ALL_FINGERS
    .filter(f => f !== 'thumb' && (profile.fingerStats[f]?.totalAttempts || 0) >= 10)
    .sort((a, b) => (profile.fingerStats[b]?.errorRate || 0) - (profile.fingerStats[a]?.errorRate || 0))
    .slice(0, 4) as FingerId[];

  // 6. Compute weakest keys (top 10 by error rate, min 5 attempts)
  profile.weakestKeys = Object.entries(profile.keyStats)
    .filter(([, s]) => s.totalAttempts >= 5 && s.lastErrorRate > 0.05)
    .sort((a, b) => b[1].lastErrorRate - a[1].lastErrorRate)
    .slice(0, 10)
    .map(([k]) => k);


  // 6. Daily log tracking
  const today = toLocalDate();
  if (profile.lastSessionDate !== today) {
    // New day — advance currentDay if previous day had sessions
    if (profile.lastSessionDate && profile.totalSessionsToday > 0) {
      profile.currentDay = Math.min(10, profile.currentDay + 1);
    }
    profile.totalSessionsToday = 0;
    profile.lastSessionDate = today;
  }
  profile.totalSessionsToday++;

  // Update or create today's daily log entry
  let todayEntry = profile.dailyLog.find(d => d.date === today);
  if (!todayEntry) {
    todayEntry = {
      date: today,
      day: profile.currentDay,
      sessionsCompleted: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      targetWpm: 0,
      targetMet: false,
    };
    profile.dailyLog.push(todayEntry);
  }
  // Rolling average for today
  const prevSessions = todayEntry.sessionsCompleted;
  todayEntry.sessionsCompleted = prevSessions + 1;
  todayEntry.avgWpm = Math.round(((todayEntry.avgWpm * prevSessions) + results.netWpm) / (prevSessions + 1));
  todayEntry.avgAccuracy = Math.round(((todayEntry.avgAccuracy * prevSessions) + results.accuracy) / (prevSessions + 1));

  // Keep last 30 days of log
  if (profile.dailyLog.length > 30) {
    profile.dailyLog = profile.dailyLog.slice(-30);
  }

  // 7. Find recommended lesson — first incomplete or worst-performing lesson
  const lessonProgress = getLessonProgress();
  // Import LESSONS lazily to avoid circular dependency; use lesson IDs ordered by stage
  const LESSON_ORDER = [
    'lesson-1-1', 'lesson-1-2', 'lesson-1-3', 'lesson-1-4', 'lesson-1-5', 'lesson-1-6',
    'lesson-2-1', 'lesson-2-2', 'lesson-2-3', 'lesson-2-4', 'lesson-2-5',
    'lesson-3-1', 'lesson-3-2', 'lesson-3-3', 'lesson-3-4',
    'lesson-4-1', 'lesson-4-2',
    'lesson-5-1', 'lesson-5-2',
    'lesson-6-1', 'lesson-6-2', 'lesson-6-3', 'lesson-6-4', 'lesson-6-5',
  ];
  // Recommend first uncompleted, or first with < 3 stars
  profile.recommendedLessonId = null;
  for (const id of LESSON_ORDER) {
    const p = lessonProgress[id];
    if (!p || !p.completed) {
      profile.recommendedLessonId = id;
      break;
    }
  }
  if (!profile.recommendedLessonId) {
    // All done — find worst performing
    for (const id of LESSON_ORDER) {
      const p = lessonProgress[id];
      if (p && p.stars < 3) {
        profile.recommendedLessonId = id;
        break;
      }
    }
  }

  // Save
  try {
    localStorage.setItem(ADAPTIVE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save adaptive profile', e);
  }

  return profile;
};

/** Generate a drill text focused on the user's weakest keys */
export const generateWeaknessDrill = (profile: AdaptiveProfile): string => {
  const weakKeys = profile.weakestKeys.filter(k => k !== ' ' && k.length === 1);
  if (weakKeys.length === 0) return '';

  // Common words containing these letters
  const WORD_BANK: Record<string, string[]> = {
    a: ['and', 'are', 'at', 'had', 'has', 'was', 'can', 'all', 'add', 'as', 'an', 'back', 'call', 'about', 'after', 'also', 'may', 'man', 'day'],
    b: ['be', 'but', 'by', 'been', 'both', 'back', 'before', 'big', 'best', 'book', 'between', 'business', 'because'],
    c: ['can', 'come', 'could', 'case', 'call', 'each', 'city', 'close', 'change', 'clear', 'could', 'check', 'country'],
    d: ['do', 'did', 'down', 'day', 'does', 'done', 'during', 'good', 'said', 'could', 'would', 'should', 'end'],
    e: ['be', 'the', 'were', 'we', 'these', 'she', 'here', 'even', 'every', 'end', 'each', 'eye', 'use', 'never', 'else', 'well'],
    f: ['for', 'from', 'find', 'first', 'few', 'far', 'fact', 'feel', 'follow', 'four', 'after', 'before', 'off', 'life'],
    g: ['go', 'get', 'give', 'great', 'good', 'group', 'going', 'large', 'big', 'long', 'thing', 'begin', 'again'],
    h: ['he', 'had', 'has', 'her', 'him', 'his', 'how', 'here', 'high', 'help', 'home', 'hand', 'hard', 'head', 'house'],
    i: ['in', 'is', 'it', 'its', 'if', 'into', 'like', 'will', 'did', 'him', 'his', 'with', 'this', 'which', 'find', 'time'],
    j: ['just', 'job', 'join', 'jump', 'judge', 'just', 'major', 'just', 'jury', 'just', 'joint', 'just'],
    k: ['know', 'keep', 'kind', 'key', 'kid', 'knew', 'work', 'like', 'look', 'make', 'take', 'think', 'book', 'back'],
    l: ['like', 'long', 'look', 'last', 'let', 'life', 'line', 'live', 'little', 'local', 'leave', 'large', 'all', 'will'],
    m: ['me', 'my', 'more', 'make', 'man', 'may', 'much', 'most', 'many', 'must', 'might', 'made', 'from', 'time'],
    n: ['no', 'not', 'new', 'now', 'never', 'next', 'need', 'night', 'name', 'number', 'and', 'one', 'in', 'on', 'than'],
    o: ['of', 'on', 'or', 'one', 'our', 'other', 'out', 'over', 'own', 'only', 'go', 'do', 'to', 'how', 'now', 'good'],
    p: ['put', 'people', 'part', 'place', 'point', 'public', 'program', 'problem', 'power', 'pay', 'play', 'please'],
    q: ['question', 'quite', 'quick', 'quality', 'quarter'],
    r: ['run', 'read', 'right', 'real', 'really', 'room', 'are', 'for', 'or', 'her', 'year', 'after', 'from', 'more', 'work'],
    s: ['so', 'she', 'some', 'same', 'see', 'set', 'say', 'still', 'small', 'show', 'such', 'state', 'start', 'since'],
    t: ['the', 'to', 'that', 'this', 'they', 'than', 'them', 'time', 'then', 'two', 'take', 'tell', 'think', 'thing'],
    u: ['up', 'us', 'use', 'under', 'until', 'unit', 'upon', 'much', 'must', 'just', 'but', 'you', 'your', 'sure', 'run'],
    v: ['very', 'view', 'value', 'voice', 'visit', 'over', 'ever', 'every', 'even', 'give', 'have', 'move', 'live'],
    w: ['we', 'was', 'were', 'with', 'will', 'would', 'way', 'when', 'work', 'world', 'want', 'well', 'where', 'while'],
    x: ['next', 'text', 'box', 'six', 'tax', 'fix', 'mix', 'exact', 'exist', 'extra', 'exam', 'exit', 'example', 'index'],
    y: ['you', 'your', 'year', 'yes', 'yet', 'young', 'may', 'they', 'say', 'day', 'way', 'very', 'only', 'any', 'many'],
    z: ['zero', 'zone', 'size', 'realize', 'organize', 'quiz', 'buzz', 'freeze', 'prize', 'horizon'],
  };

  // Collect words for the weak keys
  const drillWords: string[] = [];
  for (const key of weakKeys) {
    const words = WORD_BANK[key] || [];
    drillWords.push(...words);
  }

  if (drillWords.length === 0) return '';

  // Shuffle and repeat to fill ~400 chars
  const shuffled = [...drillWords].sort(() => Math.random() - 0.5);
  const result: string[] = [];
  let charCount = 0;
  let idx = 0;
  while (charCount < 400) {
    const word = shuffled[idx % shuffled.length];
    result.push(word);
    charCount += word.length + 1;
    idx++;
  }

  return result.join(' ');
};

/** Check if a lesson is unlocked (previous lesson in sequence must be completed with sufficient accuracy) */
export const isLessonUnlocked = (lessonId: string): boolean => {
  const LESSON_ORDER = [
    'lesson-1-1', 'lesson-1-2', 'lesson-1-3', 'lesson-1-4', 'lesson-1-5', 'lesson-1-6',
    'lesson-2-1', 'lesson-2-2', 'lesson-2-3', 'lesson-2-4', 'lesson-2-5',
    'lesson-3-1', 'lesson-3-2', 'lesson-3-3', 'lesson-3-4',
    'lesson-4-1', 'lesson-4-2',
    'lesson-5-1', 'lesson-5-2',
    'lesson-6-1', 'lesson-6-2', 'lesson-6-3', 'lesson-6-4', 'lesson-6-5',
  ];

  const idx = LESSON_ORDER.indexOf(lessonId);
  if (idx <= 0) return true; // First lesson is always unlocked

  const prevId = LESSON_ORDER[idx - 1];
  const progress = getLessonProgress();
  const prev = progress[prevId];

  // Soft gate: previous must be completed with at least 85% accuracy
  return prev?.completed === true && (prev.bestAccuracy || 0) >= 85;
};

/** Get today's day progress against the mastery plan */
export const getDayProgress = (): { currentDay: number; sessionsToday: number; avgWpmToday: number; avgAccuracyToday: number } => {
  const profile = getAdaptiveProfile();
  const today = toLocalDate();
  const todayEntry = profile.dailyLog.find(d => d.date === today);

  return {
    currentDay: profile.currentDay,
    sessionsToday: todayEntry?.sessionsCompleted || 0,
    avgWpmToday: todayEntry?.avgWpm || 0,
    avgAccuracyToday: todayEntry?.avgAccuracy || 0,
  };
};

/** High-density discrimination drill word banks targeting specific intra-finger and adjacent-finger conflicts */
const COLLISION_DRILL_BANKS: Record<string, { patterns: string[]; words: string[]; sentences: string[] }> = {
  'r-t': {
    patterns: ['rt tr rtr trt frt grt vrt brt trf trg trv trb', 'tree rare rate tart rust torn root trap trip rent part start first track'],
    words: ['tree', 'rate', 'rare', 'tart', 'rust', 'torn', 'root', 'trap', 'trip', 'rent', 'part', 'start', 'first', 'track', 'trend', 'trust', 'treat', 'trade', 'train', 'trial'],
    sentences: [
      'trust the true track and start the right trial for every smart trend.',
      'great trainers treat their teams with total respect and rare trust.',
      'the return of the train brought rapid relief throughout the entire territory.'
    ]
  },
  'f-g': {
    patterns: ['fg gf fgf gfg frg grf ftg gtf fvg gvb fbg gbf', 'gift flag frog golf fog fig farm gate graft fight light shift flight'],
    words: ['gift', 'flag', 'frog', 'golf', 'fog', 'fig', 'farm', 'gate', 'graft', 'fight', 'flight', 'front', 'forge', 'forge', 'guard', 'finger', 'figure'],
    sentences: [
      'fast flights from foreign gates bring great gifts for friendly guests.',
      'faithful figures follow formal fighting guidelines with great focus.',
      'giving forward gifts fosters good feelings among firm friends.'
    ]
  },
  'v-b': {
    patterns: ['vb bv vbv bvb fvb gvb fbv gbv rvb tvb bvr bvt', 'brave view vibrant behave verbal vibrant valve verb bevel above vibe'],
    words: ['brave', 'view', 'vibe', 'verb', 'above', 'valve', 'bevel', 'behave', 'verbal', 'vibrant', 'bravo', 'cable', 'beverage', 'viable', 'novel', 'vivid'],
    sentences: [
      'brave viewers observe vibrant debates about viable public benefits.',
      'brief verbal briefings above the vibrant harbor give valuable observations.',
      'better behaviour and bold vision provide viable benefits for all.'
    ]
  },
  'w-e': {
    patterns: ['we ew wew ewe swe dewe qwe rwe sew dew few gew', 'west week weep sweat swear sewer wheat vowel sweet tower power lower'],
    words: ['west', 'week', 'weep', 'sweat', 'swear', 'sewer', 'wheat', 'sweet', 'tower', 'power', 'lower', 'water', 'where', 'wheel', 'jewel', 'screw'],
    sentences: [
      'sweet western winds sweep over wet wheat fields every few weeks.',
      'we will work with great power whenever water flows west into the town.',
      'wise workers welcome sweet rewards whenever well earned wins show.'
    ]
  },
  's-d': {
    patterns: ['sd ds sds dsd asd fsd dsa dsf sed des sid dis', 'said side sand send desk dust dusk shed seed salad slid sod soda'],
    words: ['said', 'side', 'sand', 'send', 'desk', 'dust', 'dusk', 'shed', 'seed', 'salad', 'slid', 'soda', 'stand', 'sound', 'spend', 'speed'],
    sentences: [
      'send standard desks and side stands to students sitting inside.',
      'sound decisions said during sad days send steady signs of speed.',
      'she slid side salads onto solid wooden stands beside the desk.'
    ]
  },
  'u-y': {
    patterns: ['uy yu uyu yuy juy huy muy nuy yuj yuh yum yun', 'your duty ugly ruby busy yarn youth jury unit user young study yummy'],
    words: ['your', 'duty', 'ugly', 'ruby', 'busy', 'yarn', 'youth', 'jury', 'unit', 'user', 'young', 'study', 'yummy', 'buyer', 'fully', 'unify', 'lucky'],
    sentences: [
      'your youthful study of unified duties yields truly unique results.',
      'young buyers usually study dynamic yearly output under busy jury scrutiny.',
      'stay truly loyal during your daily study until your duty yields victory.'
    ]
  },
  'i-o': {
    patterns: ['io oi ioi oio kio lio oik oil oki oli poi iop', 'iron lion coil foil join coin void soil boil point onion option orbit'],
    words: ['iron', 'lion', 'coil', 'foil', 'join', 'coin', 'void', 'soil', 'boil', 'point', 'onion', 'option', 'orbit', 'poison', 'action', 'motion', 'logic'],
    sentences: [
      'join the official mission to inspect important options with iron discipline.',
      'lions roam into moist soil looking for solid points on the horizon.',
      'curious citizens notice optical illusions pointing into outer orbit.'
    ]
  },
  'k-l': {
    patterns: ['kl lk klk lkl jkl lkj kol lok kil lik kal lak', 'look like link lake lock milk silk silk folk kill walk talk calm clerk'],
    words: ['look', 'like', 'link', 'lake', 'lock', 'milk', 'silk', 'folk', 'kill', 'walk', 'talk', 'calm', 'clerk', 'black', 'blank', 'flock', 'lucky'],
    sentences: [
      'skilled clerks look like keen leaders walking slowly along lake locks.',
      'folk like looking into black silk locks with calm and loyal skill.',
      'kind clerks quickly lock all likely links with clear knowledge.'
    ]
  },
  'e-r': {
    patterns: ['er re ere rer der fer red der per rep rev wer', 'ever real rare read free peer deer fear refer reform record refer river'],
    words: ['ever', 'real', 'rare', 'read', 'free', 'peer', 'deer', 'fear', 'refer', 'reform', 'record', 'river', 'order', 'server', 'driver', 'reaper'],
    sentences: [
      'refer every rare report directly to senior leaders for rapid review.',
      'free drivers read clear road records near the river with great care.',
      'reform orders require real energy from every proper worker.'
    ]
  }
};

/** Generate a deep, 1,000–1,500+ character continuous flow repair drill to decouple finger confusion */
export const generateCollisionRepairDrill = (profile: AdaptiveProfile, focusPair?: string): string => {
  let selectedBankKey = focusPair?.toLowerCase();

  // If no pair specified, look up worst conflict from collisionStats
  if (!selectedBankKey || !COLLISION_DRILL_BANKS[selectedBankKey]) {
    const topConflict = profile.collisionStats?.topConflicts?.[0];
    if (topConflict) {
      const p1 = `${topConflict.expected}-${topConflict.typed}`;
      const p2 = `${topConflict.typed}-${topConflict.expected}`;
      if (COLLISION_DRILL_BANKS[p1]) selectedBankKey = p1;
      else if (COLLISION_DRILL_BANKS[p2]) selectedBankKey = p2;
    }
  }

  // Fallback to Left Ring/Middle if still not found
  if (!selectedBankKey || !COLLISION_DRILL_BANKS[selectedBankKey]) {
    selectedBankKey = 'w-e';
  }

  const bank = COLLISION_DRILL_BANKS[selectedBankKey];
  const parts: string[] = [];

  // Stage 1: Key rhythm cadence (250 chars)
  parts.push(bank.patterns.join(' ') + ' ' + bank.patterns.join(' '));

  // Stage 2: Rapid contrast words (450 chars)
  const shuffledWords = [...bank.words, ...bank.words, ...bank.words].sort(() => Math.random() - 0.5);
  parts.push(shuffledWords.slice(0, 35).join(' '));

  // Stage 3: Sentence flow discrimination (500+ chars)
  parts.push(bank.sentences.join(' ') + ' ' + bank.sentences.join(' '));

  // Stage 4: Mastery fusion
  parts.push(shuffledWords.slice(0, 25).join(' ') + '. ' + bank.sentences[0]);

  return parts.join('\n\n');
};

