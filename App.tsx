
import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { TypingTest } from './components/TypingTest';
import { PhysicalTypingTest } from './components/PhysicalTypingTest';
import { Results } from './components/Results';
import { ProgressChart } from './components/ProgressChart';
import { SavedTestsList } from './components/SavedTestsList';
import { GameState, TestResults, TimeLimit, GameMode, StoredResult, UserStats, SavedTest } from './types';
import { extractTextFromImage } from './services/geminiService';
import { saveResult, getHistory, getUserStats, getSavedTests, saveTest, deleteSavedTest } from './services/storageService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.UPLOAD);
  const [gameMode, setGameMode] = useState<GameMode>('DIGITAL');
  const [text, setText] = useState<string>("");
  const [originalText, setOriginalText] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [results, setResults] = useState<TestResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(0);
  const [history, setHistory] = useState<StoredResult[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [savedTests, setSavedTests] = useState<SavedTest[]>([]);
  const [isSSCMode, setIsSSCMode] = useState(false);

  useEffect(() => {
    // Load data when app starts or when game state changes (e.g. back to home)
    setHistory(getHistory());
    setUserStats(getUserStats());
    setSavedTests(getSavedTests());
  }, [gameState]);

  const prepareTextForGame = (rawText: string, limit: TimeLimit): string => {
      let gameText = rawText;
      // If a time limit is set, we ensure the text is long enough for the user to type continuously
      if (limit > 0) {
          const targetLength = limit * 20; // Rough estimate: 20 chars per second max speed buffer
          while (gameText.length < targetLength) {
              gameText += "\n\n" + rawText;
          }
      }
      return gameText;
  };

  const handleImageSelect = async (base64: string, mimeType: string, selectedTimeLimit: TimeLimit, mode: GameMode, isSSC: boolean) => {
    setIsProcessing(true);
    try {
      const extractedText = await extractTextFromImage(base64, mimeType);
      
      // If SSC Mode is active, we don't necessarily need to loop the text if it's already 400 words (approx 2000 chars)
      // But prepending helps ensure they don't run out.
      const gameText = prepareTextForGame(extractedText, selectedTimeLimit);

      // Auto-save the generated test
      const title = extractedText.split(' ').slice(0, 6).join(' ') + '...';
      saveTest({
          title,
          text: extractedText,
          imageSrc: base64,
          gameMode: mode
      });
      setSavedTests(getSavedTests());

      setOriginalText(extractedText); // Store original for resetting
      setText(gameText);
      setImagePreview(base64);
      setTimeLimit(selectedTimeLimit);
      setGameMode(mode);
      setIsSSCMode(isSSC);
      setGameState(GameState.PLAYING);
    } catch (error) {
      alert("Failed to read image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSelect = (inputText: string, selectedTimeLimit: TimeLimit, isSSC: boolean) => {
      const gameText = prepareTextForGame(inputText, selectedTimeLimit);
      
      // Auto-save the pasted text
      const title = inputText.split(' ').slice(0, 6).join(' ') + '...';
      saveTest({
          title,
          text: inputText,
          imageSrc: null,
          gameMode: 'DIGITAL'
      });
      setSavedTests(getSavedTests());

      setOriginalText(inputText);
      setText(gameText);
      setImagePreview(null);
      setTimeLimit(selectedTimeLimit);
      setGameMode('DIGITAL'); // Paste text always defaults to digital mode
      setIsSSCMode(isSSC);
      setGameState(GameState.PLAYING);
  };

  const handleComplete = (res: TestResults) => {
    const { newBadges, xpGained } = saveResult(res, gameMode); 
    
    // Inject gamification results into the result object so Results component can display them
    const enhancedResults = {
        ...res,
        badgesUnlocked: newBadges,
        xpGained: xpGained
    };
    
    setResults(enhancedResults);
    setGameState(GameState.RESULTS);
  };

  const handleRestart = () => {
    setGameState(GameState.UPLOAD);
    setText("");
    setImagePreview(null);
    setResults(null);
    setIsSSCMode(false);
  };
  
  const handleRetry = () => {
      const gameText = prepareTextForGame(originalText, timeLimit);
      setText(gameText);
      setGameState(GameState.PLAYING);
      setResults(null);
  };

  const handlePlaySavedTest = (test: SavedTest, selectedTimeLimit: TimeLimit) => {
      const gameText = prepareTextForGame(test.text, selectedTimeLimit);
      setOriginalText(test.text);
      setText(gameText);
      setImagePreview(test.imageSrc);
      setTimeLimit(selectedTimeLimit);
      setGameMode(test.gameMode || 'DIGITAL');
      setGameState(GameState.PLAYING);
  };

  const handleDeleteSavedTest = (id: string) => {
      if (window.confirm("Are you sure you want to delete this test?")) {
          const updatedTests = deleteSavedTest(id);
          setSavedTests(updatedTests);
      }
  };

  // --- Practice Logic ---

  const handlePractice = (type: 'words' | 'keys') => {
    if (!results) return;

    let practiceText = "";

    if (type === 'words') {
        const words = Object.entries(results.missedWords)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .map(entry => entry[0]);
        
        if (words.length === 0) return;

        // Create a sequence of missed words
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
        // Keys practice
        const hardKeys = Object.entries(results.hardKeys)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .map(entry => entry[0])
            .slice(0, 5); // Focus on top 5
        
        if (hardKeys.length === 0) return;

        // Find words in original text containing these keys
        const allWords = originalText.split(/\s+/);
        const relevantWords = allWords.filter(word => 
            hardKeys.some(k => word.includes(k))
        );

        const sourceWords = relevantWords.length > 5 ? relevantWords : allWords;
        
        const practiceWords: string[] = [];
        for (let i = 0; i < 30; i++) {
            const randomWord = sourceWords[Math.floor(Math.random() * sourceWords.length)];
            practiceWords.push(randomWord);
        }
        practiceText = practiceWords.join(' ');
    }

    if (practiceText.trim().length > 0) {
        setText(practiceText);
        setTimeLimit(0); // Practice is untimed
        setResults(null);
        setGameMode('DIGITAL'); // Practice is always digital
        setIsSSCMode(false); // Practice is standard mode
        setGameState(GameState.PLAYING);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/30">
      <header className="fixed top-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center pointer-events-auto">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setGameState(GameState.UPLOAD)}
            title="Go to Home"
          >
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-mono font-bold text-white text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">SnapType</h1>
          </div>
          {userStats && (
              <div className="flex gap-4 text-xs font-bold text-slate-400 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700 backdrop-blur-sm">
                  <div className="flex items-center gap-1" title="Daily Streak">
                      <span>🔥</span>
                      <span className="text-orange-400">{userStats.currentStreak}</span>
                  </div>
                   <div className="flex items-center gap-1" title="Total XP">
                      <span>⭐</span>
                      <span className="text-yellow-400">{userStats.xp}</span>
                  </div>
              </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-12 min-h-screen flex flex-col items-center justify-center">
        {gameState === GameState.UPLOAD && (
            <div className="text-center w-full flex flex-col items-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-6 pb-2">
                    Test Speed on Your Terms
                </h1>
                <p className="text-lg text-slate-400 mb-12 max-w-xl mx-auto">
                    Upload an image or paste your own text. <br/>
                    Our AI will convert images into your personal typing test.
                </p>
                
                <ImageUploader 
                    onImageSelect={handleImageSelect} 
                    onTextSelect={handleTextSelect}
                    isProcessing={isProcessing} 
                />
                
                <SavedTestsList 
                    tests={savedTests} 
                    onPlay={handlePlaySavedTest} 
                    onDelete={handleDeleteSavedTest} 
                />

                {history.length > 0 && (
                  <div className="w-full max-w-2xl mt-12 animate-fade-in delay-200">
                    <ProgressChart history={history} />
                  </div>
                )}
            </div>
        )}

        {gameState === GameState.PLAYING && (
            gameMode === 'DIGITAL' ? (
                <TypingTest 
                    text={text} 
                    timeLimit={timeLimit}
                    onComplete={handleComplete} 
                    onRestart={handleRestart}
                    isSSC={isSSCMode}
                />
            ) : (
                <PhysicalTypingTest
                    ocrText={text}
                    imageSrc={imagePreview}
                    timeLimit={timeLimit}
                    onComplete={handleComplete}
                    onRestart={handleRestart}
                />
            )
        )}

        {gameState === GameState.RESULTS && results && (
            <Results 
                results={results} 
                mode={gameMode}
                onReset={handleRetry} 
                onNewImage={handleRestart}
                onPractice={handlePractice}
            />
        )}
      </main>
      
      <footer className="fixed bottom-4 right-4 text-xs text-slate-600 pointer-events-none">
        Powered by Gemini
      </footer>
    </div>
  );
};

export default App;
