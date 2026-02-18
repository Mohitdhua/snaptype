
import { StoredResult, TestResults, GameMode, UserStats, Badge, SavedTest } from '../types';
import { BADGES } from './badgeRules'; // We will define this next

const STORAGE_KEY = 'snaptype_history_v1';
const STATS_KEY = 'snaptype_stats_v1';
const SAVED_TESTS_KEY = 'snaptype_saved_tests_v1';

export const saveResult = (results: TestResults, mode: GameMode): { updatedHistory: StoredResult[], newBadges: Badge[], xpGained: number } => {
  // 1. Save History
  const newEntry: StoredResult = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    netWpm: results.netWpm,
    accuracy: results.accuracy,
    mode: mode
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
  const today = new Date().toISOString().split('T')[0];
  
  let newStreak = stats.currentStreak;
  if (stats.lastLoginDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
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
      unlockedBadges: stats.unlockedBadges,
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
  
  return { updatedHistory, newBadges, xpGained };
};

export const getHistory = (): StoredResult[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const getUserStats = (): UserStats => {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error("Failed to load stats", e);
    }
    
    // Default stats
    return {
        totalTests: 0,
        totalTimeSeconds: 0,
        currentStreak: 0,
        lastLoginDate: '',
        bestWpm: 0,
        unlockedBadges: [],
        xp: 0
    };
};

// --- Saved Tests Logic ---

export const getSavedTests = (): SavedTest[] => {
    try {
        const raw = localStorage.getItem(SAVED_TESTS_KEY);
        return raw ? JSON.parse(raw) : [];
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
        const updated = { ...existing, createdAt: Date.now() };
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
