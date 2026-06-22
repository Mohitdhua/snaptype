import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './components/Button';
import { extractTextFromImage } from './services/geminiService';
import { deleteSavedTest, getHistory, getSavedTests, getUserStats, saveResult, saveTest } from './services/storageService';
import { GameMode, GameState, SavedTest, StoredResult, TestResults, TimeLimit, UserStats } from './types';

type HomeTab = 'CREATE' | 'SAVED' | 'PROGRESS';
type AppHistoryState = {
  __snaptype: true;
  gameState: GameState;
  homeTab: HomeTab;
};

const HOME_TABS: { id: HomeTab; label: string }[] = [
  { id: 'CREATE', label: 'Create' },
  { id: 'SAVED', label: 'Library' },
  { id: 'PROGRESS', label: 'Progress' },
];

const getRouteKey = (nextGameState: GameState, nextHomeTab: HomeTab) =>
  nextGameState === GameState.UPLOAD ? `${nextGameState}:${nextHomeTab}` : nextGameState;

const normalizeHardKey = (key: string) => {
  if (key === '\n' || key === 'Enter') return 'Enter';
  if (key === ' ' || key === 'Space') return 'Space';
  return key;
};

const ImageUploader = lazy(() => import('./components/ImageUploader').then(module => ({ default: module.ImageUploader })));
const PhysicalTypingTest = lazy(() => import('./components/PhysicalTypingTest').then(module => ({ default: module.PhysicalTypingTest })));
const ProgressChart = lazy(() => import('./components/ProgressChart').then(module => ({ default: module.ProgressChart })));
const Results = lazy(() => import('./components/Results').then(module => ({ default: module.Results })));
const SavedTestsList = lazy(() => import('./components/SavedTestsList').then(module => ({ default: module.SavedTestsList })));
const TypingTest = lazy(() => import('./components/TypingTest').then(module => ({ default: module.TypingTest })));

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SectionLoader: React.FC = () => (
  <div className="w-full max-w-5xl rounded-2xl border border-slate-700/70 bg-slate-900/45 p-6 text-center text-slate-300">
    Loading...
  </div>
);

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.UPLOAD);
  const [homeTab, setHomeTab] = useState<HomeTab>('CREATE');
  const [gameMode, setGameMode] = useState<GameMode>('DIGITAL');
  const [text, setText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [results, setResults] = useState<TestResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(0);
  const [history, setHistory] = useState<StoredResult[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [savedTests, setSavedTests] = useState<SavedTest[]>([]);
  const [isSSCMode, setIsSSCMode] = useState(false);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
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
        setHomeTab(state.homeTab || 'CREATE');
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
  }: {
    rawText: string;
    imageSrc: string | null;
    mode: GameMode;
    selectedTimeLimit: TimeLimit;
    sscEnabled: boolean;
    testId: string | null;
  }) => {
    const gameText = prepareTextForGame(rawText, selectedTimeLimit);
    setOriginalText(rawText);
    setText(gameText);
    setImagePreview(imageSrc);
    setTimeLimit(selectedTimeLimit);
    setGameMode(mode);
    setIsSSCMode(sscEnabled);
    setActiveTestId(testId);
    setGameState(GameState.PLAYING);
  };

  const goHomeCreate = () => {
    setGameState(GameState.UPLOAD);
    setHomeTab('CREATE');
    setIsProcessing(false);
    setResults(null);
    setTimeLimit(0);
    setText('');
    setOriginalText('');
    setImagePreview(null);
    setIsSSCMode(false);
    setActiveTestId(null);
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
    });
    setGameState(GameState.RESULTS);
  };

  const handleRetry = () => {
    const gameText = prepareTextForGame(originalText, timeLimit);
    setText(gameText);
    setResults(null);
    setGameState(GameState.PLAYING);
  };

  const handlePlaySavedTest = (test: SavedTest, selectedTimeLimit: TimeLimit, selectedMode: GameMode, isSSC: boolean) => {
    const finalMode: GameMode = selectedMode;
    const finalTimeLimit: TimeLimit = isSSC ? 600 : selectedTimeLimit;
    const gameText = prepareTextForGame(test.text, finalTimeLimit);
    setOriginalText(test.text);
    setText(gameText);
    setImagePreview(test.imageSrc);
    setTimeLimit(finalTimeLimit);
    setGameMode(finalMode);
    setIsSSCMode(isSSC);
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

  const averageWpm = useMemo(() => {
    if (history.length === 0) return 0;
    const total = history.reduce((sum, item) => sum + item.netWpm, 0);
    return Math.round(total / history.length);
  }, [history]);

  const renderUploadTab = () => {
    if (homeTab === 'CREATE') {
      return (
        <div className="text-center w-full flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-stitch-accent mb-6 pb-2">
            Train Faster, Type Smarter
          </h1>
          <p className="text-lg text-stitch-muted mb-10 max-w-xl mx-auto">
            Upload an image or paste your own text.
            <br />
            Turn any content into a guided typing session.
          </p>

          <div className="w-full max-w-5xl bento-card p-4 md:p-8">
            <Suspense fallback={<SectionLoader />}>
              <ImageUploader onImageSelect={handleImageSelect} onTextSelect={handleTextSelect} isProcessing={isProcessing} />
            </Suspense>
          </div>
        </div>
      );
    }

    if (homeTab === 'SAVED') {
      return (
        <div className="w-full max-w-5xl animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-stitch-accent">Saved Test Library</h2>
            <p className="text-stitch-muted mt-2">Choose mode and timer per test, then launch instantly.</p>
          </div>
          {savedTests.length > 0 ? (
            <div className="bento-card p-4 md:p-6">
              <Suspense fallback={<SectionLoader />}>
                <SavedTestsList tests={savedTests} onPlay={handlePlaySavedTest} onDelete={handleDeleteSavedTest} />
              </Suspense>
            </div>
          ) : (
            <div className="bento-card p-8 text-center flex flex-col items-center">
              <p className="text-stitch-muted mb-4">No saved tests yet. Create one from image or text.</p>
              <Button onClick={() => setHomeTab('CREATE')}>Create First Test</Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="w-full max-w-5xl animate-fade-in space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-stitch-accent">Performance Dashboard</h2>
          <p className="text-stitch-muted mt-2">Track speed, accuracy, and consistency over time.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bento-card p-5">
            <div className="text-xs uppercase tracking-wider text-stitch-muted mb-1">Tests</div>
            <div className="text-3xl font-mono text-stitch-accent">{history.length}</div>
          </div>
          <div className="bento-card p-5">
            <div className="text-xs uppercase tracking-wider text-stitch-muted mb-1">Average WPM</div>
            <div className="text-3xl font-mono text-stitch-accent">{averageWpm}</div>
          </div>
          <div className="bento-card p-5">
            <div className="text-xs uppercase tracking-wider text-stitch-muted mb-1">Best WPM</div>
            <div className="text-3xl font-mono text-stitch-accent">{userStats?.bestWpm || 0}</div>
          </div>
        </div>

        {history.length > 0 ? (
          <Suspense fallback={<SectionLoader />}>
            <ProgressChart history={history} className="h-80" />
          </Suspense>
        ) : (
          <div className="bento-card p-8 text-center flex flex-col items-center">
            <p className="text-stitch-muted mb-4">No attempts yet. Complete one session to populate charts.</p>
            <Button onClick={() => setHomeTab('CREATE')}>Start a Session</Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stitch-dark text-stitch-accent font-sans relative overflow-hidden">
      <div className="mesh-bg" />

      <header className="fixed top-0 left-0 right-0 p-4 md:p-6 z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 pointer-events-auto items-center">

          {/* Main Top Nav */}
          <div className="flex items-center justify-between w-full max-w-3xl px-6 py-3 rounded-full bento-card">
            <button
              type="button"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={goHomeCreate}
              title="Go to Home"
            >
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <span className="text-black font-bold text-lg leading-none">S</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-stitch-accent">SnapType</h1>
            </button>

            {gameState === GameState.UPLOAD && (
              <nav className="hidden sm:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
                {HOME_TABS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHomeTab(tab.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      homeTab === tab.id ? 'bg-white text-black shadow-md' : 'text-stitch-muted hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            )}

            <div className="flex items-center gap-3">
              {gameState !== GameState.UPLOAD && (
                <button
                  type="button"
                  onClick={goHomeCreate}
                  className="text-xs font-semibold px-4 py-2 rounded-full bento-card hover:bg-white/10 transition-colors text-stitch-accent"
                >
                  Close
                </button>
              )}
              {userStats && (
                <div className="flex items-center gap-3 text-xs font-medium text-stitch-muted">
                  <div className="flex items-center gap-1.5" title="Daily Streak">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
                    <span className="text-stitch-accent">{userStats.currentStreak}</span>
                  </div>
                  <div className="w-px h-3 bg-white/20"></div>
                  <div className="flex items-center gap-1.5" title="Total XP">
                    <span>XP</span>
                    <span className="text-stitch-accent font-bold">{userStats.xp}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Nav */}
          {gameState === GameState.UPLOAD && (
             <nav className="flex sm:hidden items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10 w-fit">
              {HOME_TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHomeTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    homeTab === tab.id ? 'bg-white text-black shadow-md' : 'text-stitch-muted hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}

        </div>
      </header>

      <main
        className={
          gameState === GameState.PLAYING
            ? 'container relative z-10 mx-auto px-3 md:px-4 pt-20 pb-3 h-screen overflow-hidden flex flex-col items-center'
            : `container mx-auto px-4 pb-12 min-h-screen flex flex-col items-center justify-center ${
                gameState === GameState.UPLOAD ? 'pt-40 md:pt-44 relative z-10' : 'pt-24 relative z-10'
              }`
        }
      >
        {gameState === GameState.UPLOAD && renderUploadTab()}

        <Suspense fallback={<SectionLoader />}>
          {gameState === GameState.PLAYING &&
            (gameMode === 'DIGITAL' ? (
              <TypingTest text={text} timeLimit={timeLimit} onComplete={handleComplete} onRestart={goHomeCreate} isSSC={isSSCMode} />
            ) : (
              <PhysicalTypingTest
                ocrText={text}
                imageSrc={imagePreview}
                referenceText={imagePreview ? null : text}
                timeLimit={timeLimit}
                isSSC={isSSCMode}
                onComplete={handleComplete}
                onRestart={goHomeCreate}
              />
            ))}

          {gameState === GameState.RESULTS && results && (
            <Results results={results} onReset={handleRetry} onNewImage={goHomeCreate} onPractice={handlePractice} />
          )}
        </Suspense>
      </main>

      <footer className="fixed bottom-4 right-4 text-xs text-slate-500 pointer-events-none">Powered by Gemini</footer>
    </div>
  );
};

export default App;
