
import { StoredResult, TestResults, GameMode, UserStats, Badge, SavedTest } from '../types';
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
    testId: context?.testId
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
        testId: typeof entry.testId === 'string' ? entry.testId : undefined
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
