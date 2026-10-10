import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './Button';
import { extractTextFromImage } from '../services/geminiService';
import { deleteSavedTest, getHistory, getSavedTests, getUserStats, saveLessonProgress, saveResult, saveTest, updateAdaptiveProfile, getDefaultTimeLimit, setDefaultTimeLimit } from '../services/storageService';
import { Theme } from '../services/themeService';
import { GameMode, GameState, HardcoreMode, PracticePassage, SavedTest, StoredResult, TestResults, TimeLimit, UserStats } from '../types';
import { LESSONS, getNextLessonTarget } from '../data/lessonsData';

interface SnapTypeAppProps {
  theme: Theme;
  onToggleTheme: () => void;
  onSwitchToSpellingApp: () => void;
}

type HomeTab = 'HOME' | 'LESSONS' | 'FINGER_TRAINING' | 'ACCURACY_LAB' | 'SPEED_LAB' | 'PRACTICE' | 'ASSESSMENT' | 'PROGRESS' | 'SETTINGS';
type AppHistoryState = {
  __snaptype: true;
  gameState: GameState;
  homeTab: HomeTab;
};

const TabIcon: React.FC<{ id: HomeTab; className?: string }> = ({ id, className = "w-4 h-4" }) => {
  switch (id) {
    case 'HOME':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'LESSONS':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
        </svg>
      );
    case 'PRACTICE':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="4" rx="2" />
          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M18 12h.01M8 16h8" />
        </svg>
      );
    case 'FINGER_TRAINING':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 0 1 2 2v4a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      );
    case 'ACCURACY_LAB':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case 'SPEED_LAB':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case 'ASSESSMENT':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      );
    case 'PROGRESS':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      );
    case 'SETTINGS':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    default:
      return null;
  }
};

interface NavSection {
  title: string;
  items: { id: HomeTab; label: string }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Core Hubs',
    items: [
      { id: 'HOME', label: 'Dashboard' },
      { id: 'LESSONS', label: 'Lessons Suite' },
      { id: 'PRACTICE', label: 'Practice Library' },
    ],
  },
  {
    title: 'Training Labs',
    items: [
      { id: 'FINGER_TRAINING', label: 'Finger Motor' },
      { id: 'ACCURACY_LAB', label: 'Accuracy Lab' },
      { id: 'SPEED_LAB', label: 'Speed Lab' },
    ],
  },
  {
    title: 'System & Insights',
    items: [
      { id: 'ASSESSMENT', label: 'Assessment' },
      { id: 'PROGRESS', label: 'Analytics' },
      { id: 'SETTINGS', label: 'Settings' },
    ],
  },
];

const HOME_TABS: { id: HomeTab; label: string }[] = NAV_SECTIONS.flatMap(section => section.items);

const getRouteKey = (nextGameState: GameState, nextHomeTab: HomeTab) =>
  nextGameState === GameState.UPLOAD ? `${nextGameState}:${nextHomeTab}` : nextGameState;

const normalizeHardKey = (key: string) => {
  if (key === '\n' || key === 'Enter') return 'Enter';
  if (key === ' ' || key === 'Space') return 'Space';
  return key;
};

const CourtExamScreenTest = lazy(() => import('./CourtExamScreenTest').then(module => ({ default: module.CourtExamScreenTest })));
const LessonsView = lazy(() => import('./LessonsView').then(module => ({ default: module.LessonsView })));
const PracticeLibraryView = lazy(() => import('./PracticeLibraryView').then(module => ({ default: module.PracticeLibraryView })));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard })));
const SettingsView = lazy(() => import('./SettingsView').then(module => ({ default: module.SettingsView })));

const HomeDashboard = lazy(() => import('./HomeDashboard').then(module => ({ default: module.HomeDashboard })));
const FingerMotorTraining = lazy(() => import('./FingerMotorTraining').then(module => ({ default: module.FingerMotorTraining })));
const AccuracyLab = lazy(() => import('./Labs').then(module => ({ default: module.AccuracyLab })));
const SpeedLab = lazy(() => import('./Labs').then(module => ({ default: module.SpeedLab })));

const ImageUploader = lazy(() => import('./ImageUploader').then(module => ({ default: module.ImageUploader })));
const PhysicalTypingTest = lazy(() => import('./PhysicalTypingTest').then(module => ({ default: module.PhysicalTypingTest })));
const ProgressChart = lazy(() => import('./ProgressChart').then(module => ({ default: module.ProgressChart })));
const Results = lazy(() => import('./Results').then(module => ({ default: module.Results })));
const SavedTestsList = lazy(() => import('./SavedTestsList').then(module => ({ default: module.SavedTestsList })));
const TypingTest = lazy(() => import('./TypingTest').then(module => ({ default: module.TypingTest })));

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SectionLoader: React.FC = () => (
  <div className="w-full max-w-5xl rounded-2xl border border-slate-700/70 bg-slate-900/45 p-6 text-center text-slate-300">
    Loading...
  </div>
);

export const SnapTypeApp: React.FC<SnapTypeAppProps> = ({
  theme,
  onToggleTheme,
  onSwitchToSpellingApp
}) => {
  const [gameState, setGameState] = useState<GameState>(GameState.UPLOAD);
  const [homeTab, setHomeTab] = useState<HomeTab>('HOME');
  const [gameMode, setGameMode] = useState<GameMode>('DIGITAL');
  const [text, setText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [results, setResults] = useState<TestResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(() => getDefaultTimeLimit());
  const [history, setHistory] = useState<StoredResult[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [savedTests, setSavedTests] = useState<SavedTest[]>([]);
  const [isSSCMode, setIsSSCMode] = useState(false);
  const [hardcoreMode, setHardcoreMode] = useState<HardcoreMode>('NONE');
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);

  const [tabHistory, setTabHistory] = useState<HomeTab[]>(['HOME']);

  const goHomeCreate = (targetTab?: HomeTab) => {
    setGameState(GameState.UPLOAD);
    setIsProcessing(false);
    setResults(null);
    setTimeLimit(getDefaultTimeLimit());
    setText('');
    setOriginalText('');
    setImagePreview(null);
    setIsSSCMode(false);
    setHardcoreMode('NONE');
    setActiveTestId(null);
    setActiveLessonId(null);
    setActiveExerciseIndex(0);
    if (targetTab && targetTab !== homeTab) {
      setTabHistory(prev => [...prev, targetTab]);
      setHomeTab(targetTab);
    }
  };

  const navigateToTab = (nextTab: HomeTab) => {
    if (gameState !== GameState.UPLOAD) {
      goHomeCreate(nextTab);
      return;
    }
    if (nextTab !== homeTab) {
      setTabHistory(prev => [...prev, nextTab]);
      setHomeTab(nextTab);
    }
  };

  const handleInAppBack = () => {
    if (gameState === GameState.PLAYING || gameState === GameState.RESULTS) {
      goHomeCreate();
    } else if (tabHistory.length > 1) {
      const nextHistory = [...tabHistory];
      nextHistory.pop(); // remove current tab
      const previousTab = nextHistory[nextHistory.length - 1] || 'HOME';
      setTabHistory(nextHistory);
      setHomeTab(previousTab);
    }
  };

  const canGoBack = gameState !== GameState.UPLOAD || tabHistory.length > 1;

  const isRestoringFromHistoryRef = useRef(false);
  const hasInitializedHistoryRef = useRef(false);
  const lastRouteKeyRef = useRef('');
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const textRef = useRef(text);
  textRef.current = text;

  const loadInitialHomeData = () => {
    setHistory(getHistory());
    setUserStats(getUserStats());
    setSavedTests(getSavedTests());
  };

  useEffect(() => {
    loadInitialHomeData();
  }, []);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const state = event.state as AppHistoryState | null;
      if (!state || state.__snaptype !== true) return;

      isRestoringFromHistoryRef.current = true;
      if (state.gameState === GameState.RESULTS && !resultsRef.current) {
        setGameState(GameState.UPLOAD);
        setHomeTab(state.homeTab || 'HOME');
      } else if (state.gameState === GameState.PLAYING && !textRef.current) {
        setGameState(GameState.UPLOAD);
        setHomeTab(state.homeTab || 'HOME');
      } else {
        setGameState(state.gameState);
        if (state.gameState === GameState.UPLOAD) {
          setHomeTab(state.homeTab || 'HOME');
        }
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const routeKey = getRouteKey(gameState, homeTab);
    const historyState: AppHistoryState = {
      __snaptype: true,
      gameState,
      homeTab,
    };

    if (!hasInitializedHistoryRef.current) {
      window.history.replaceState(historyState, '');
      hasInitializedHistoryRef.current = true;
      lastRouteKeyRef.current = routeKey;
      return;
    }

    if (isRestoringFromHistoryRef.current) {
      isRestoringFromHistoryRef.current = false;
      lastRouteKeyRef.current = routeKey;
      return;
    }

    if (routeKey !== lastRouteKeyRef.current) {
      window.history.pushState(historyState, '');
      lastRouteKeyRef.current = routeKey;
    }
  }, [gameState, homeTab]);

  const upsertSavedTest = (nextTest: SavedTest) => {
    setSavedTests(prev => [nextTest, ...prev.filter(test => test.id !== nextTest.id)].slice(0, 20));
  };

  const prepareTextForGame = (rawText: string, limit: TimeLimit): string => {
    if (limit <= 0 || rawText.length === 0) return rawText;
    const targetLength = limit * 20;
    if (rawText.length >= targetLength) return rawText;

    const joiner = '\n\n';
    const appendChunk = `${joiner}${rawText}`;
    const missingChars = targetLength - rawText.length;
    const repeats = Math.ceil(missingChars / appendChunk.length);
    return rawText + appendChunk.repeat(repeats);
  };

  const startGame = ({
    rawText,
    imageSrc,
    mode,
    selectedTimeLimit,
    sscEnabled,
    testId,
    lessonId,
    hardcore = 'NONE',
  }: {
    rawText: string;
    imageSrc: string | null;
    mode: GameMode;
    selectedTimeLimit?: TimeLimit;
    sscEnabled: boolean;
    testId: string | null;
    lessonId?: string | null;
    hardcore?: HardcoreMode;
  }) => {
    const globalDefault = getDefaultTimeLimit();
    const effectiveTimeLimit: TimeLimit = (sscEnabled || mode === 'EXAM_SCREEN')
      ? 600
      : (selectedTimeLimit !== undefined && selectedTimeLimit !== null ? selectedTimeLimit : (timeLimit || globalDefault));

    const gameText = prepareTextForGame(rawText, effectiveTimeLimit);
    setOriginalText(rawText);
    setText(gameText);
    setImagePreview(imageSrc);
    setTimeLimit(effectiveTimeLimit);
    setGameMode(mode);
    setIsSSCMode(sscEnabled);
    setActiveTestId(testId);
    setActiveLessonId(lessonId || null);
    setHardcoreMode(hardcore);
    setGameState(GameState.PLAYING);
  };

  const handleImageSelect = async (
    base64: string,
    mimeType: string,
    selectedTimeLimit: TimeLimit,
    mode: GameMode,
    isSSC: boolean
  ) => {
    setIsProcessing(true);
    try {
      const extractedText = await extractTextFromImage(base64, mimeType);
      if (!extractedText.trim()) {
        throw new Error('Empty OCR result');
      }
      const title = extractedText.split(' ').slice(0, 6).join(' ') + '...';
      const savedTest = saveTest({
        title,
        text: extractedText,
        imageSrc: base64,
        gameMode: mode,
      });
      upsertSavedTest(savedTest);

      startGame({
        rawText: extractedText,
        imageSrc: base64,
        mode,
        selectedTimeLimit,
        sscEnabled: isSSC,
        testId: savedTest.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to read image. Please try again.';
      alert(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSelect = (inputText: string, selectedTimeLimit: TimeLimit, mode: GameMode, isSSC: boolean) => {
    const normalizedText = inputText.trim();
    if (!normalizedText) return;
    const title = normalizedText.split(' ').slice(0, 6).join(' ') + '...';
    const savedTest = saveTest({
      title,
      text: normalizedText,
      imageSrc: null,
      gameMode: mode,
    });
    upsertSavedTest(savedTest);

    startGame({
      rawText: normalizedText,
      imageSrc: null,
      mode,
      selectedTimeLimit,
      sscEnabled: isSSC,
      testId: savedTest.id,
    });
  };

  const handleComplete = (res: TestResults) => {
    if (activeLessonId) {
      const lesson = LESSONS.find(l => l.id === activeLessonId);
      const minAcc = lesson?.minAccuracy ?? 90;
      const minWpm = lesson?.minWpm ?? 15;

      let stars = 1;
      if (res.accuracy >= minAcc + 4 && res.netWpm >= minWpm + 5) {
        stars = 3;
      } else if (res.accuracy >= minAcc && res.netWpm >= minWpm) {
        stars = 2;
      }
      saveLessonProgress(activeLessonId, res.netWpm, res.accuracy, stars);
    }

    // Update adaptive learning algorithm profile across all sessions
    updateAdaptiveProfile(res);

    const { updatedHistory, updatedStats, newBadges, xpGained } = saveResult(res, gameMode, {
      testId: activeTestId ?? undefined,
    });
    setHistory(updatedHistory);
    setUserStats(updatedStats);
    setResults({
      ...res,
      badgesUnlocked: newBadges,
      xpGained,
      testId: activeTestId ?? undefined,
      lessonId: activeLessonId ?? undefined,
    });
    setGameState(GameState.RESULTS);
  };

  const handleSelectLessonExercise = (
    exerciseText: string,
    lessonId: string,
    title: string,
    hardcore: HardcoreMode = 'NONE',
    exerciseIndex: number = 0
  ) => {
    setActiveExerciseIndex(exerciseIndex);
    startGame({
      rawText: exerciseText,
      imageSrc: null,
      mode: 'DIGITAL',
      selectedTimeLimit: timeLimit || getDefaultTimeLimit(),
      sscEnabled: false,
      testId: null,
      lessonId,
      hardcore,
    });
  };

  const nextLessonTarget = useMemo(() => {
    if (!activeLessonId) return null;
    return getNextLessonTarget(activeLessonId, activeExerciseIndex);
  }, [activeLessonId, activeExerciseIndex]);

  const handleNextLesson = () => {
    if (!nextLessonTarget) return;
    handleSelectLessonExercise(
      nextLessonTarget.text,
      nextLessonTarget.lessonId,
      `${nextLessonTarget.lessonTitle} - ${nextLessonTarget.exerciseTitle}`,
      hardcoreMode,
      nextLessonTarget.exerciseIndex
    );
  };

  const handleStartPassage = (
    passage: PracticePassage,
    mode: GameMode,
    selectedTimeLimit: TimeLimit,
    hardcore: HardcoreMode = 'NONE'
  ) => {
    const isCourtClerk = passage.category === 'court-clerk';
    const isSSC = isCourtClerk || passage.category === 'ssc' || passage.category === 'legal';
    const finalTimeLimit = isSSC ? 600 : (selectedTimeLimit !== undefined ? selectedTimeLimit : (timeLimit || getDefaultTimeLimit()));
    startGame({
      rawText: passage.text,
      imageSrc: null,
      mode,
      selectedTimeLimit: finalTimeLimit,
      sscEnabled: isSSC,
      testId: passage.id,
      lessonId: null,
      hardcore,
    });
  };

  const handleLaunchBooster = (
    boosterText: string,
    title: string,
    hardcore: HardcoreMode = 'NO_BACKSPACE'
  ) => {
    startGame({
      rawText: boosterText,
      imageSrc: null,
      mode: 'DIGITAL',
      selectedTimeLimit: 0,
      sscEnabled: false,
      testId: null,
      lessonId: null,
      hardcore,
    });
  };

  const handleRetry = () => {
    const gameText = prepareTextForGame(originalText, timeLimit);
    setText(gameText);
    setResults(null);
    setGameState(GameState.PLAYING);
  };

  const handlePlaySavedTest = (test: SavedTest, selectedTimeLimit: TimeLimit, selectedMode: GameMode, isSSC: boolean) => {
    const finalMode: GameMode = selectedMode;
    const finalTimeLimit: TimeLimit = (isSSC || finalMode === 'EXAM_SCREEN') ? 600 : selectedTimeLimit;
    const gameText = prepareTextForGame(test.text, finalTimeLimit);
    setOriginalText(test.text);
    setText(gameText);
    setImagePreview(test.imageSrc);
    setTimeLimit(finalTimeLimit);
    setGameMode(finalMode);
    setIsSSCMode(isSSC || finalMode === 'EXAM_SCREEN');
    setActiveTestId(test.id);
    setGameState(GameState.PLAYING);
  };

  const handleDeleteSavedTest = (id: string) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      setSavedTests(deleteSavedTest(id));
    }
  };

  const handlePractice = (type: 'words' | 'keys') => {
    if (!results) return;

    let practiceText = '';

    if (type === 'words') {
      const words = Object.entries(results.missedWords)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(entry => entry[0]);

      if (words.length === 0) return;

      const repeatedWords: string[] = [];
      let count = 0;
      while (count < 30) {
        for (const word of words) {
          if (count >= 30) break;
          repeatedWords.push(word);
          count++;
        }
      }
      practiceText = repeatedWords.join(' ');
    } else {
      const normalizedHardKeys: Record<string, number> = {};
      for (const [key, count] of Object.entries(results.hardKeys)) {
        const normalizedKey = normalizeHardKey(key);
        normalizedHardKeys[normalizedKey] = (normalizedHardKeys[normalizedKey] || 0) + (count as number);
      }

      const hardKeys = Object.entries(normalizedHardKeys)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(entry => entry[0])
        .slice(0, 5);

      if (hardKeys.length === 0) return;

      const allWords = originalText.split(/\s+/);
      const searchableKeys = hardKeys
        .filter(key => key !== 'Space' && key !== 'Enter')
        .map(escapeRegExp);
      const hardKeyRegex = searchableKeys.length > 0 ? new RegExp(searchableKeys.join('|')) : null;
      const relevantWords = hardKeyRegex ? allWords.filter(word => hardKeyRegex.test(word)) : allWords;
      const sourceWords = relevantWords.length > 5 ? relevantWords : allWords;

      const practiceWords: string[] = [];
      for (let i = 0; i < 30; i++) {
        practiceWords.push(sourceWords[Math.floor(Math.random() * sourceWords.length)]);
      }
      practiceText = practiceWords.join(' ');
    }

    if (practiceText.trim().length > 0) {
      setText(practiceText);
      setTimeLimit(0);
      setResults(null);
      setGameMode('DIGITAL');
      setIsSSCMode(false);
      setActiveTestId(null);
      setGameState(GameState.PLAYING);
    }
  };

  const renderUploadTab = () => {
    if (homeTab === 'HOME') {
      return (
        <Suspense fallback={<SectionLoader />}>
          <HomeDashboard stats={userStats} onNavigateTab={navigateToTab} onStartDrill={(t, title, limit) => startGame({rawText: t, imageSrc: null, mode: 'DIGITAL', selectedTimeLimit: limit ?? timeLimit ?? getDefaultTimeLimit(), sscEnabled: false, testId: null})} />
        </Suspense>
      );
    }
    if (homeTab === 'LESSONS') {
      return (
        <div className="w-full max-w-6xl animate-fade-in">
          <Suspense fallback={<SectionLoader />}>
            <LessonsView onSelectExercise={handleSelectLessonExercise} />
          </Suspense>
        </div>
      );
    }
    if (homeTab === 'PRACTICE') {
      return (
        <div className="w-full max-w-5xl animate-fade-in">
          <Suspense fallback={<SectionLoader />}>
            <PracticeLibraryView onStartPassage={handleStartPassage} />
          </Suspense>
        </div>
      );
    }
    if (homeTab === 'FINGER_TRAINING') {
      return (
        <Suspense fallback={<SectionLoader />}>
          <FingerMotorTraining theme={theme} onStartDrill={(t, title, limit) => startGame({rawText: t, imageSrc: null, mode: 'DIGITAL', selectedTimeLimit: limit ?? timeLimit ?? getDefaultTimeLimit(), sscEnabled: false, testId: null})} />
        </Suspense>
      );
    }
    if (homeTab === 'ACCURACY_LAB') {
      return (
        <Suspense fallback={<SectionLoader />}>
          <AccuracyLab onStartDrill={(t, title, limit) => startGame({rawText: t, imageSrc: null, mode: 'DIGITAL', selectedTimeLimit: limit ?? timeLimit ?? getDefaultTimeLimit(), sscEnabled: false, testId: null})} />
        </Suspense>
      );
    }
    if (homeTab === 'SPEED_LAB') {
      return (
        <Suspense fallback={<SectionLoader />}>
          <SpeedLab onStartDrill={(t, title, limit) => startGame({rawText: t, imageSrc: null, mode: 'DIGITAL', selectedTimeLimit: limit ?? timeLimit ?? getDefaultTimeLimit(), sscEnabled: false, testId: null})} />
        </Suspense>
      );
    }
    if (homeTab === 'PROGRESS' || homeTab === 'INSIGHTS') {
      return (
        <div className="w-full max-w-5xl animate-fade-in">
          <Suspense fallback={<SectionLoader />}>
            <AnalyticsDashboard
              history={history}
              stats={userStats}
              onLaunchDrill={handleSelectLessonExercise}
              onNavigateTab={(tab) => navigateToTab(tab)}
            />
          </Suspense>
        </div>
      );
    }
    if (homeTab === 'SETTINGS') {
      return (
        <Suspense fallback={<SectionLoader />}>
          <SettingsView
            theme={theme}
            onToggleTheme={onToggleTheme}
            onSwitchToSpellingApp={onSwitchToSpellingApp}
            currentHardcoreMode={hardcoreMode}
            onSetHardcoreMode={setHardcoreMode}
            onDefaultTimeLimitChange={(val) => setTimeLimit(val)}
          />
        </Suspense>
      );
    }
    if (homeTab === 'ASSESSMENT') {
      return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in text-center flex flex-col items-center pt-8 px-4">
          <div className="w-full p-8 md:p-10 flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 shadow-sm">
            <span className="text-3xl mb-3">📋</span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Standard Benchmarking Assessment</h2>
            <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-lg mb-6 leading-relaxed">
              Official 10-Minute Typing Test modeled after SSC CGL/CHSL & High Court recruitment standards. Calculates Gross WPM, Net WPM, Accuracy, and KDPH with mistake penalty auditing.
            </p>
            <Button
              onClick={() => startGame({
                rawText: "The administration of justice requires punctuality, unwavering diligence, and precision in clerical transcription. In official court proceedings, each record must reflect the exact statements presented without omission, substitution, or typographical variation. Modern court reporters and administrative assistants must possess superior keyboard dexterity, allowing them to transcribe verbal testimony and legal documentation with minimal latency and maximal accuracy. Through structured deliberate practice, a typist achieves motor automaticity, minimizing neuromuscular fatigue and ensuring sustained typing flow during lengthy hearings.",
                imageSrc: null,
                mode: 'EXAM_SCREEN',
                selectedTimeLimit: 600,
                sscEnabled: true,
                testId: null
              })}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md keep-white"
            >
              Start 10-Minute Official Assessment →
            </Button>
          </div>
        </div>
      );
    }
    return null;
  };


  return (
    <div className={`font-sans relative transition-colors duration-200 flex ${
      gameState === GameState.PLAYING ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen overflow-x-hidden'
    } ${
      theme === 'light' ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0c1017] text-slate-100'
    }`}>
      <div className="mesh-bg" />

      {/* Desktop Sidebar */}
      {gameState !== GameState.PLAYING && (
        <aside className={`hidden md:flex flex-col w-[240px] fixed top-0 left-0 bottom-0 z-50 border-r py-5 px-3.5 transition-all select-none ${
          theme === 'light' ? 'bg-[#fafafa] border-slate-200/80 shadow-xs' : 'bg-[#0a0d14] border-white/10'
        }`}>
          {/* Logo Header */}
          <button className="flex items-center gap-3 hover:opacity-90 transition-opacity text-left mb-5 px-1 w-full" onClick={() => navigateToTab('HOME')}>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs shrink-0">
              <span className="text-white font-black text-base leading-none keep-white">S</span>
            </div>
            <div>
              <div className={`text-sm font-extrabold tracking-tight leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>SnapType</div>
              <div className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 font-semibold tracking-wider uppercase leading-none mt-0.5">Blind Typing</div>
            </div>
          </button>

          {/* User Stats Pill */}
          {userStats && (
            <div className={`mb-4 px-3 py-2 rounded-xl border flex items-center justify-between transition-colors ${
              theme === 'light' ? 'bg-slate-100/70 border-slate-200/80 text-slate-700' : 'bg-white/[0.04] border-white/[0.08] text-slate-300'
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span className="text-amber-500 text-sm">🔥</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">{userStats.currentStreak}d</span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">streak</span>
              </div>
              <div className="h-3 w-[1px] bg-slate-300 dark:bg-white/10" />
              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400">⚡</span>
                <span>{Math.round(userStats.xp)} XP</span>
              </div>
            </div>
          )}

          {/* Nav Links Grouped by Section */}
          <nav className="flex-1 space-y-3.5 overflow-y-auto scrollbar-none pr-0.5">
            {NAV_SECTIONS.map(section => (
              <div key={section.title}>
                <div className="px-2 mb-1 text-[10px] font-bold font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 opacity-70">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {section.items.map(tab => {
                    const isActive = homeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => navigateToTab(tab.id)}
                        className={`group px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center justify-between w-full text-left ${
                          isActive
                            ? (theme === 'light'
                                ? 'bg-indigo-50/90 text-indigo-700 font-semibold shadow-xs'
                                : 'bg-indigo-500/15 text-indigo-300 font-semibold shadow-xs')
                            : (theme === 'light'
                                ? 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100')
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <TabIcon id={tab.id} className={`w-4 h-4 transition-colors ${
                            isActive
                              ? (theme === 'light' ? 'text-indigo-600' : 'text-indigo-400')
                              : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                          }`} />
                          <span>{tab.label}</span>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer Actions */}
          <div className={`flex flex-col gap-1 mt-3 pt-3 border-t ${theme === 'light' ? 'border-slate-200/80' : 'border-white/10'}`}>
            <button
              onClick={() => {
                if (gameState !== GameState.UPLOAD) {
                  goHomeCreate();
                }
                onSwitchToSpellingApp();
              }}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all w-full text-left ${
                theme === 'light' ? 'text-violet-700 hover:bg-violet-50' : 'text-violet-400 hover:bg-violet-500/10'
              }`}
            >
              <svg className="w-4 h-4 text-violet-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
              </svg>
              <span>SnapSpell</span>
            </button>
            <button
              onClick={onToggleTheme}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all w-full text-left ${
                theme === 'light' ? 'text-slate-600 hover:bg-slate-200/50' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
              )}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Top Bar */}
      {gameState !== GameState.PLAYING && (
        <header className={`md:hidden flex items-center justify-between p-3 border-b fixed top-0 left-0 right-0 z-50 shadow-sm ${theme === 'light' ? 'bg-[#fafafa] border-slate-200' : 'bg-[#0c1017] border-white/10'}`}>
          <button className="flex items-center gap-2.5 text-left" onClick={() => navigateToTab('HOME')}>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white font-black text-base leading-none keep-white">S</span>
            </div>
            <div className={`text-sm font-extrabold tracking-tight leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>SnapType</div>
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (gameState !== GameState.UPLOAD) {
                  goHomeCreate();
                }
                onSwitchToSpellingApp();
              }}
              className="p-2 rounded-xl bg-violet-500/10 text-violet-500 text-lg"
              aria-label="Switch to SnapSpell"
              title="Switch to SnapSpell"
            >
              🗣️
            </button>
            <button onClick={onToggleTheme} className={`p-2 rounded-xl ${theme === 'light' ? 'bg-slate-200/50' : 'bg-white/10'} text-lg`} aria-label="Toggle Light/Dark Theme" title="Toggle Light/Dark Theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
          </div>
        </header>
      )}

      {/* Mobile Bottom Nav */}
      {gameState !== GameState.PLAYING && (
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 p-1.5 border-t flex items-center gap-1 overflow-x-auto z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] scrollbar-none pb-safe ${
          theme === 'light' ? 'bg-[#fafafa] border-slate-200' : 'bg-[#0c1017] border-white/10'
        }`}>
          {HOME_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => navigateToTab(tab.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg min-w-[64px] transition-colors ${
                homeTab === tab.id
                  ? (theme === 'light' ? 'text-indigo-600 bg-indigo-50' : 'text-indigo-400 bg-indigo-500/20')
                  : 'text-slate-500 hover:bg-slate-500/5'
              }`}
            >
              <TabIcon id={tab.id} className="w-4 h-4" />
              <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

      <main
        className={
          gameState === GameState.PLAYING
            ? 'w-full max-w-7xl mx-auto px-2 md:px-4 pt-2 md:pt-3 pb-2 h-full flex-1 min-h-0 overflow-hidden flex flex-col items-center justify-start'
            : `flex-1 w-full px-4 pb-20 pt-20 md:pt-12 md:pl-[280px] min-h-screen flex flex-col items-center justify-start relative z-10`
        }
      >
        {gameState === GameState.UPLOAD && renderUploadTab()}

        <Suspense fallback={<SectionLoader />}>
          {gameState === GameState.PLAYING &&
            (gameMode === 'EXAM_SCREEN' ? (
              <CourtExamScreenTest
                passageText={text}
                timeLimit={timeLimit}
                onComplete={handleComplete}
                onRestart={goHomeCreate}
                theme={theme}
                onToggleTheme={onToggleTheme}
              />
            ) : gameMode === 'DIGITAL' ? (
              <TypingTest
                text={text}
                timeLimit={timeLimit}
                onComplete={handleComplete}
                onRestart={goHomeCreate}
                isSSC={isSSCMode}
                isCourtExam={isSSCMode}
                lessonId={activeLessonId || undefined}
                initialHardcoreMode={hardcoreMode}
                theme={theme}
                onToggleTheme={onToggleTheme}
                onNextLesson={nextLessonTarget ? handleNextLesson : undefined}
                nextLessonLabel={nextLessonTarget?.label}
                onTimeLimitChange={(newLimit) => {
                  setTimeLimit(newLimit);
                  setDefaultTimeLimit(newLimit);
                }}
              />
            ) : (
              <PhysicalTypingTest
                ocrText={text}
                imageSrc={imagePreview}
                referenceText={imagePreview ? null : text}
                timeLimit={timeLimit}
                isSSC={isSSCMode}
                isCourtExam={isSSCMode}
                onComplete={handleComplete}
                onRestart={goHomeCreate}
              />
            ))}

          {gameState === GameState.RESULTS && results && (
            <Results
              results={results}
              onReset={handleRetry}
              onNewImage={goHomeCreate}
              onPractice={handlePractice}
              onLaunchBooster={handleLaunchBooster}
              onNextLesson={nextLessonTarget ? handleNextLesson : undefined}
              nextLessonLabel={nextLessonTarget?.label}
            />
          )}
        </Suspense>
      </main>

      {gameState !== GameState.PLAYING && (
        <footer className="fixed bottom-3 right-4 text-[10px] font-mono text-neutral-500 pointer-events-none">
          SnapType Touch Typing Engine • AI Calibrated
        </footer>
      )}
    </div>
  );
};
