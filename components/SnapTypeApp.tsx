import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './Button';
import { extractTextFromImage } from '../services/geminiService';
import { deleteSavedTest, getHistory, getSavedTests, getUserStats, saveLessonProgress, saveResult, saveTest, updateAdaptiveProfile } from '../services/storageService';
import { Theme } from '../services/themeService';
import { GameMode, GameState, HardcoreMode, PracticePassage, SavedTest, StoredResult, TestResults, TimeLimit, UserStats } from '../types';
import { LESSONS, getNextLessonTarget } from '../data/lessonsData';

interface SnapTypeAppProps {
  theme: Theme;
  onToggleTheme: () => void;
  onSwitchToSpellingApp: () => void;
}

type HomeTab = 'HOME' | 'PRACTICE' | 'FINGER_TRAINING' | 'ACCURACY_LAB' | 'SPEED_LAB' | 'ASSESSMENT' | 'PROGRESS' | 'INSIGHTS' | 'SETTINGS';
type AppHistoryState = {
  __snaptype: true;
  gameState: GameState;
  homeTab: HomeTab;
};

const HOME_TABS: { id: HomeTab; label: string; icon: string }[] = [
  { id: 'HOME', label: 'Home', icon: '🏠' },
  { id: 'PRACTICE', label: 'Practice', icon: '⌨️' },
  { id: 'FINGER_TRAINING', label: 'Finger Motor', icon: '🖐️' },
  { id: 'ACCURACY_LAB', label: 'Accuracy Lab', icon: '🎯' },
  { id: 'SPEED_LAB', label: 'Speed Lab', icon: '⚡' },
  { id: 'ASSESSMENT', label: 'Assessment', icon: '📋' },
  { id: 'PROGRESS', label: 'Progress', icon: '📈' },
  { id: 'INSIGHTS', label: 'Insights', icon: '🧠' },
  { id: 'SETTINGS', label: 'Settings', icon: '⚙️' },
];

const getRouteKey = (nextGameState: GameState, nextHomeTab: HomeTab) =>
  nextGameState === GameState.UPLOAD ? `${nextGameState}:${nextHomeTab}` : nextGameState;

const normalizeHardKey = (key: string) => {
  if (key === '\n' || key === 'Enter') return 'Enter';
  if (key === ' ' || key === 'Space') return 'Space';
  return key;
};

const CourtExamScreenTest = lazy(() => import('./CourtExamScreenTest').then(module => ({ default: module.CourtExamScreenTest })));
const PracticeLibraryView = lazy(() => import('./PracticeLibraryView').then(module => ({ default: module.PracticeLibraryView })));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard })));

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
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(600);
  const [history, setHistory] = useState<StoredResult[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [savedTests, setSavedTests] = useState<SavedTest[]>([]);
  const [isSSCMode, setIsSSCMode] = useState(false);
  const [hardcoreMode, setHardcoreMode] = useState<HardcoreMode>('NONE');
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);

  const [tabHistory, setTabHistory] = useState<HomeTab[]>(['HOME']);

  const navigateToTab = (nextTab: HomeTab) => {
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
      setGameState(state.gameState);
      if (state.gameState === GameState.UPLOAD) {
        setHomeTab(state.homeTab || 'HOME');
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
    selectedTimeLimit: TimeLimit;
    sscEnabled: boolean;
    testId: string | null;
    lessonId?: string | null;
    hardcore?: HardcoreMode;
  }) => {
    const gameText = prepareTextForGame(rawText, selectedTimeLimit);
    setOriginalText(rawText);
    setText(gameText);
    setImagePreview(imageSrc);
    setTimeLimit(selectedTimeLimit);
    setGameMode(mode);
    setIsSSCMode(sscEnabled);
    setActiveTestId(testId);
    setActiveLessonId(lessonId || null);
    setHardcoreMode(hardcore);
    setGameState(GameState.PLAYING);
  };

  const goHomeCreate = () => {
    setGameState(GameState.UPLOAD);
    setIsProcessing(false);
    setResults(null);
    setTimeLimit(600);
    setText('');
    setOriginalText('');
    setImagePreview(null);
    setIsSSCMode(false);
    setHardcoreMode('NONE');
    setActiveTestId(null);
    setActiveLessonId(null);
    setActiveExerciseIndex(0);
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
      selectedTimeLimit: 600,
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
    const finalTimeLimit = selectedTimeLimit || 600;
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
          <HomeDashboard stats={userStats} onNavigateTab={navigateToTab} onStartDrill={(t, title, limit) => startGame({rawText: t, imageSrc: null, mode: 'DIGITAL', selectedTimeLimit: limit, sscEnabled: false, testId: null})} />
        </Suspense>
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
          <FingerMotorTraining theme={theme} onStartDrill={(t, title, limit) => startGame({rawText: t, imageSrc: null, mode: 'DIGITAL', selectedTimeLimit: limit, sscEnabled: false, testId: null})} />
        </Suspense>
      );
    }
    if (homeTab === 'ACCURACY_LAB') {
      return (
        <Suspense fallback={<SectionLoader />}>
          <AccuracyLab onStartDrill={(t, title, limit) => startGame({rawText: t, imageSrc: null, mode: 'DIGITAL', selectedTimeLimit: limit, sscEnabled: false, testId: null})} />
        </Suspense>
      );
    }
    if (homeTab === 'SPEED_LAB') {
      return (
        <Suspense fallback={<SectionLoader />}>
          <SpeedLab onStartDrill={(t, title, limit) => startGame({rawText: t, imageSrc: null, mode: 'DIGITAL', selectedTimeLimit: limit, sscEnabled: false, testId: null})} />
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
    if (homeTab === 'SETTINGS' || homeTab === 'ASSESSMENT') {
       return (
        <div className="w-full max-w-5xl animate-fade-in text-center flex flex-col items-center pt-8">
          <div className="w-full max-w-md p-6 flex flex-col items-center justify-center min-h-[200px] rounded-2xl bg-white dark:bg-[#0f131a] border border-slate-200 dark:border-white/10 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">{homeTab}</h2>
            <p className="text-sm text-slate-500 font-medium mb-6">Module Under Construction.</p>
            <div className="flex flex-col gap-3 w-full">
              <Button onClick={onToggleTheme} className="w-full bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 font-bold px-4 py-2 text-sm rounded-xl">
                Toggle Theme
              </Button>
              <Button onClick={onSwitchToSpellingApp} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-bold px-4 py-2 text-sm rounded-xl">
                SnapSpell Mode
              </Button>
            </div>
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
        <aside className={`hidden md:flex flex-col w-[260px] fixed top-0 left-0 bottom-0 z-50 border-r py-6 px-4 transition-all ${theme === 'light' ? 'bg-[#f8fafc] border-slate-200 shadow-sm' : 'bg-[#0a0d14] border-white/10'}`}>
          <button className="flex items-center gap-2.5 hover:opacity-85 transition-opacity text-left mb-8 w-full" onClick={goHomeCreate}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shrink-0">
              <span className="text-white font-black text-xl leading-none keep-white">S</span>
            </div>
            <div>
              <div className={`text-base font-extrabold tracking-tight leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>SnapType</div>
              <div className="text-[10px] font-mono text-indigo-500 font-semibold leading-none mt-0.5">Blind Typing Pro</div>
            </div>
          </button>

          {userStats && (
            <div className={`mb-6 p-3 rounded-xl border flex flex-col gap-2 shadow-sm ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="opacity-60 uppercase font-bold tracking-widest text-[10px]">Streak</span>
                <span className="text-amber-500 font-bold">{userStats.currentStreak}d 🔥</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="opacity-60 uppercase font-bold tracking-widest text-[10px]">XP</span>
                <span className="font-bold">{userStats.xp} ⭐</span>
              </div>
            </div>
          )}

          <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {HOME_TABS.map(tab => {
              const isActive = homeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateToTab(tab.id)}
                  className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 w-full text-left ${
                    isActive
                      ? (theme === 'light' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'bg-indigo-500/20 text-indigo-300 shadow-sm')
                      : (theme === 'light' ? 'text-slate-600 hover:bg-slate-200/50' : 'text-neutral-400 hover:bg-white/5 hover:text-white')
                  }`}
                >
                  <span className="text-base opacity-90">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className={`flex flex-col gap-2 mt-4 pt-4 border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
            <button onClick={onSwitchToSpellingApp} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all w-full text-left ${theme === 'light' ? 'text-violet-600 hover:bg-violet-50' : 'text-violet-400 hover:bg-violet-500/10'}`}>
              <span className="text-sm">🗣️</span> SnapSpell
            </button>
            <button onClick={onToggleTheme} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all w-full text-left ${theme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}>
              <span className="text-sm">{theme === 'dark' ? '☀️' : '🌙'}</span> Theme
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Top Bar */}
      {gameState !== GameState.PLAYING && (
        <header className={`md:hidden flex items-center justify-between p-3 border-b fixed top-0 left-0 right-0 z-50 shadow-sm ${theme === 'light' ? 'bg-[#f8fafc] border-slate-200' : 'bg-[#0c1017] border-white/10'}`}>
          <button className="flex items-center gap-2.5 text-left" onClick={goHomeCreate}>
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white font-black text-base leading-none keep-white">S</span>
            </div>
            <div className={`text-sm font-extrabold tracking-tight leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>SnapType</div>
          </button>
          <div className="flex gap-2">
            <button onClick={onSwitchToSpellingApp} className="p-2 rounded-xl bg-violet-500/10 text-violet-500 text-lg">🗣️</button>
            <button onClick={onToggleTheme} className={`p-2 rounded-xl ${theme === 'light' ? 'bg-slate-200/50' : 'bg-white/10'} text-lg`}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          </div>
        </header>
      )}

      {/* Mobile Bottom Nav */}
      {gameState !== GameState.PLAYING && (
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 p-2 border-t flex items-center gap-2 overflow-x-auto z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] scrollbar-none pb-safe ${theme === 'light' ? 'bg-[#f8fafc] border-slate-200' : 'bg-[#0c1017] border-white/10'}`}>
          {HOME_TABS.map(tab => (
            <button key={tab.id} onClick={() => navigateToTab(tab.id)} className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl min-w-[72px] transition-colors ${homeTab === tab.id ? (theme === 'light' ? 'text-indigo-600 bg-indigo-50' : 'text-indigo-400 bg-indigo-500/20') : 'text-slate-500 hover:bg-slate-500/5'}`}>
              <span className="text-xl leading-none mb-0.5">{tab.icon}</span>
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
