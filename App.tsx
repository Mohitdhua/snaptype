import React, { useEffect, useMemo, useState } from 'react';
import { Button } from './components/Button';
import { ImageUploader } from './components/ImageUploader';
import { PhysicalTypingTest } from './components/PhysicalTypingTest';
import { ProgressChart } from './components/ProgressChart';
import { Results } from './components/Results';
import { SavedTestsList } from './components/SavedTestsList';
import { TypingTest } from './components/TypingTest';
import { extractTextFromImage } from './services/geminiService';
import { deleteSavedTest, getHistory, getSavedTests, getUserStats, saveResult, saveTest } from './services/storageService';
import { GameMode, GameState, SavedTest, StoredResult, TestResults, TimeLimit, UserStats } from './types';

type HomeTab = 'CREATE' | 'SAVED' | 'PROGRESS';

const HOME_TABS: { id: HomeTab; label: string }[] = [
  { id: 'CREATE', label: 'Create Test' },
  { id: 'SAVED', label: 'Saved Tests' },
  { id: 'PROGRESS', label: 'Progress' },
];

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

  const refreshHomeData = () => {
    setHistory(getHistory());
    setUserStats(getUserStats());
    setSavedTests(getSavedTests());
  };

  useEffect(() => {
    refreshHomeData();
  }, [gameState]);

  const prepareTextForGame = (rawText: string, limit: TimeLimit): string => {
    let gameText = rawText;
    if (limit > 0) {
      const targetLength = limit * 20;
      while (gameText.length < targetLength) {
        gameText += '\n\n' + rawText;
      }
    }
    return gameText;
  };

  const startGame = ({
    rawText,
    imageSrc,
    mode,
    selectedTimeLimit,
    sscEnabled,
  }: {
    rawText: string;
    imageSrc: string | null;
    mode: GameMode;
    selectedTimeLimit: TimeLimit;
    sscEnabled: boolean;
  }) => {
    const gameText = prepareTextForGame(rawText, selectedTimeLimit);
    setOriginalText(rawText);
    setText(gameText);
    setImagePreview(imageSrc);
    setTimeLimit(selectedTimeLimit);
    setGameMode(mode);
    setIsSSCMode(sscEnabled);
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
      saveTest({
        title,
        text: extractedText,
        imageSrc: base64,
        gameMode: mode,
      });
      setSavedTests(getSavedTests());

      startGame({
        rawText: extractedText,
        imageSrc: base64,
        mode,
        selectedTimeLimit,
        sscEnabled: isSSC,
      });
    } catch (error) {
      alert('Failed to read image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSelect = (inputText: string, selectedTimeLimit: TimeLimit, mode: GameMode, isSSC: boolean) => {
    const normalizedText = inputText.trim();
    if (!normalizedText) return;
    const title = normalizedText.split(' ').slice(0, 6).join(' ') + '...';
    saveTest({
      title,
      text: normalizedText,
      imageSrc: null,
      gameMode: mode,
    });
    setSavedTests(getSavedTests());

    startGame({
      rawText: normalizedText,
      imageSrc: null,
      mode,
      selectedTimeLimit,
      sscEnabled: isSSC,
    });
  };

  const handleComplete = (res: TestResults) => {
    const { newBadges, xpGained } = saveResult(res, gameMode);
    setResults({
      ...res,
      badgesUnlocked: newBadges,
      xpGained,
    });
    setGameState(GameState.RESULTS);
  };

  const handleRetry = () => {
    const gameText = prepareTextForGame(originalText, timeLimit);
    setText(gameText);
    setResults(null);
    setGameState(GameState.PLAYING);
  };

  const handlePlaySavedTest = (test: SavedTest, selectedTimeLimit: TimeLimit, selectedMode: GameMode) => {
    const gameText = prepareTextForGame(test.text, selectedTimeLimit);
    setOriginalText(test.text);
    setText(gameText);
    setImagePreview(test.imageSrc);
    setTimeLimit(selectedTimeLimit);
    setGameMode(selectedMode);
    setIsSSCMode(false);
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
      const hardKeys = Object.entries(results.hardKeys)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(entry => entry[0])
        .slice(0, 5);

      if (hardKeys.length === 0) return;

      const allWords = originalText.split(/\s+/);
      const relevantWords = allWords.filter(word => hardKeys.some(k => word.includes(k)));
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
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-6 pb-2">
            Test Speed on Your Terms
          </h1>
          <p className="text-lg text-slate-400 mb-12 max-w-xl mx-auto">
            Upload an image or paste your own text.
            <br />
            AI converts your content into a flexible typing test.
          </p>

          <ImageUploader onImageSelect={handleImageSelect} onTextSelect={handleTextSelect} isProcessing={isProcessing} />
        </div>
      );
    }

    if (homeTab === 'SAVED') {
      return (
        <div className="w-full max-w-5xl animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">Saved Test Library</h2>
            <p className="text-slate-400 mt-2">Choose mode and timer per test, then launch instantly.</p>
          </div>
          {savedTests.length > 0 ? (
            <SavedTestsList tests={savedTests} onPlay={handlePlaySavedTest} onDelete={handleDeleteSavedTest} />
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
              <p className="text-slate-300 mb-4">No saved tests yet. Create one from image or text.</p>
              <Button onClick={() => setHomeTab('CREATE')}>Create First Test</Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="w-full max-w-5xl animate-fade-in space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Performance Dashboard</h2>
          <p className="text-slate-400 mt-2">Track your speed, accuracy, and consistency over time.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Tests</div>
            <div className="text-3xl font-mono text-indigo-300">{history.length}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Average WPM</div>
            <div className="text-3xl font-mono text-cyan-300">{averageWpm}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Best WPM</div>
            <div className="text-3xl font-mono text-emerald-300">{userStats?.bestWpm || 0}</div>
          </div>
        </div>

        {history.length > 0 ? (
          <ProgressChart history={history} className="h-80" />
        ) : (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
            <p className="text-slate-300 mb-4">No attempts yet. Complete one session to populate charts.</p>
            <Button onClick={() => setHomeTab('CREATE')}>Start a Session</Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/30">
      <header className="fixed top-0 left-0 right-0 p-4 md:p-6 z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 pointer-events-auto">
          <div className="flex justify-between items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={goHomeCreate}
              title="Go to Home"
            >
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="font-mono font-bold text-white text-lg">S</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">SnapType</h1>
            </button>
            <div className="flex items-center gap-2">
              {gameState !== GameState.UPLOAD && (
                <button
                  type="button"
                  onClick={goHomeCreate}
                  className="text-xs font-semibold bg-slate-800/90 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-700 transition-colors"
                >
                  Home
                </button>
              )}
              {userStats && (
              <div className="flex gap-4 text-xs font-bold text-slate-400 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700 backdrop-blur-sm">
                <div className="flex items-center gap-1" title="Daily Streak">
                  <span className="text-orange-400">Streak</span>
                  <span className="text-white">{userStats.currentStreak}</span>
                </div>
                <div className="flex items-center gap-1" title="Total XP">
                  <span className="text-yellow-400">XP</span>
                  <span className="text-white">{userStats.xp}</span>
                </div>
              </div>
              )}
            </div>
          </div>

          {gameState === GameState.UPLOAD && (
            <nav className="bg-slate-800/70 border border-slate-700 rounded-xl p-1 flex gap-1 w-full sm:w-fit overflow-x-auto">
              {HOME_TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHomeTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                    homeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
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
            ? 'container mx-auto px-4 pt-20 pb-3 h-screen overflow-hidden flex flex-col items-center'
            : `container mx-auto px-4 pb-12 min-h-screen flex flex-col items-center justify-center ${
                gameState === GameState.UPLOAD ? 'pt-40 md:pt-44' : 'pt-24'
              }`
        }
      >
        {gameState === GameState.UPLOAD && renderUploadTab()}

        {gameState === GameState.PLAYING &&
          (gameMode === 'DIGITAL' ? (
            <TypingTest text={text} timeLimit={timeLimit} onComplete={handleComplete} onRestart={goHomeCreate} isSSC={isSSCMode} />
          ) : (
            <PhysicalTypingTest
              ocrText={text}
              imageSrc={imagePreview}
              referenceText={imagePreview ? null : text}
              timeLimit={timeLimit}
              onComplete={handleComplete}
              onRestart={goHomeCreate}
            />
          ))}

        {gameState === GameState.RESULTS && results && (
          <Results results={results} mode={gameMode} onReset={handleRetry} onNewImage={goHomeCreate} onPractice={handlePractice} />
        )}
      </main>

      <footer className="fixed bottom-4 right-4 text-xs text-slate-600 pointer-events-none">Powered by Gemini</footer>
    </div>
  );
};

export default App;
