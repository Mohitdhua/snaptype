
import { Badge } from '../types';

export const BADGES: Badge[] = [
    {
        id: 'novice',
        name: 'Novice Typist',
        description: 'Completed your first test',
        icon: '🥚',
        condition: (stats) => stats.totalTests >= 1
    },
    {
        id: 'speed_30',
        name: 'Cruising',
        description: 'Reached 30 WPM',
        icon: '🛴',
        condition: (_, res) => res.netWpm >= 30
    },
    {
        id: 'speed_60',
        name: 'Speedster',
        description: 'Reached 60 WPM',
        icon: '🚀',
        condition: (_, res) => res.netWpm >= 60
    },
    {
        id: 'speed_100',
        name: 'Typing God',
        description: 'Reached 100 WPM',
        icon: '⚡',
        condition: (_, res) => res.netWpm >= 100
    },
    {
        id: 'accuracy_master',
        name: 'Sharpshooter',
        description: '100% Accuracy on a test',
        icon: '🎯',
        condition: (_, res) => res.accuracy === 100 && res.totalChars > 50
    },
    {
        id: 'streak_3',
        name: 'Consistency',
        description: '3 Day Streak',
        icon: '🔥',
        condition: (stats) => stats.currentStreak >= 3
    },
    {
        id: 'streak_7',
        name: 'Unstoppable',
        description: '7 Day Streak',
        icon: '📅',
        condition: (stats) => stats.currentStreak >= 7
    },
    {
        id: 'marathon',
        name: 'Marathoner',
        description: 'Typed for over 1 hour total',
        icon: '⏳',
        condition: (stats) => stats.totalTimeSeconds >= 3600
    }
];
