
import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { TimeLimit, GameMode } from '../types';

interface ImageUploaderProps {
  onImageSelect: (base64: string, mimeType: string, timeLimit: TimeLimit, mode: GameMode, isSSC: boolean) => void;
  onTextSelect: (text: string, timeLimit: TimeLimit, mode: GameMode, isSSC: boolean) => void;
  isProcessing: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, onTextSelect, isProcessing }) => {
  const [inputMode, setInputMode] = useState<'image' | 'text'>('image');
  const [gameMode, setGameMode] = useState<GameMode>('DIGITAL');
  const [preview, setPreview] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(0);
  const [isSSCMode, setIsSSCMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supportedImageTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!supportedImageTypes.has(file.type)) {
      setError('Please upload PNG, JPG, or WEBP images only.');
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleStart = () => {
    // If SSC Mode is enabled, force 10 minutes (600 seconds)
    const finalTimeLimit = isSSCMode ? 600 : timeLimit;

    if (inputMode === 'image' && preview && fileInputRef.current?.files?.[0]) {
       const file = fileInputRef.current.files[0];
       onImageSelect(preview, file.type, finalTimeLimit, gameMode, isSSCMode);
    } else if (inputMode === 'text' && customText.trim()) {
       onTextSelect(customText, finalTimeLimit, gameMode, isSSCMode);
    }
  };

  const toggleSSC = () => {
      setIsSSCMode(prev => !prev);
  };

  const timeOptions: { label: string; value: TimeLimit }[] = [
    { label: 'Endless / Finish Text', value: 0 },
    { label: '1 Min', value: 60 },
    { label: '2 Min', value: 120 },
    { label: '5 Min', value: 300 },
    { label: '10 Min', value: 600 },
  ];

  const hasContent = inputMode === 'image' ? !!preview : !!customText.trim();
  const activeTimeLimit = isSSCMode ? 600 : timeLimit;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
      
      {/* Input Source Switcher */}
      <div className="bg-slate-800 p-1 rounded-xl flex gap-1 shadow-lg border border-slate-700">
        <button
            onClick={() => setInputMode('image')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                inputMode === 'image' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
        >
            Upload Image
        </button>
        <button
            onClick={() => setInputMode('text')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                inputMode === 'text' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
        >
            Paste Text
        </button>
      </div>

      <div className="w-full relative">
        {inputMode === 'image' ? (
            <div 
                className={`w-full h-80 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-colors ${preview ? 'border-indigo-500/50 bg-slate-800/50' : 'border-slate-600 hover:border-slate-400 bg-slate-800'}`}
            >
                <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isProcessing}
                aria-label="Upload image file"
                title="Upload image file"
                />
                
                {preview ? (
                <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full h-full object-contain p-4"
                />
                ) : (
                <div className="text-center p-6 pointer-events-none">
                    <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">Drop your image here</h3>
                    <p className="text-slate-400">or click to browse</p>
                </div>
                )}
            </div>
        ) : (
            <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Paste your text here to create a custom typing test..."
                className="w-full h-80 bg-slate-800 border-2 border-slate-700 rounded-3xl p-6 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none transition-colors scrollbar-thin scrollbar-thumb-slate-600"
            />
        )}
      </div>

      {error && inputMode === 'image' && <p className="text-rose-400 font-medium">{error}</p>}

      {hasContent && (
        <div className="w-full space-y-4 animate-fade-in">
             
             {/* SSC Mode Toggle */}
             <div className="w-full bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors" onClick={toggleSSC}>
                 <div className="flex flex-col">
                     <span className="text-white font-bold flex items-center gap-2">
                        SSC Exam Mode
                        <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase">Strict</span>
                     </span>
                     <span className="text-xs text-slate-400 mt-1">10 min duration. 1 WPM penalty per mistake.</span>
                 </div>
                 <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isSSCMode ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                     <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isSSCMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                 </div>
             </div>

             <div className="w-full bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                 <label className="block text-slate-400 text-sm font-bold mb-3 uppercase tracking-wider text-center">Typing Mode</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <button
                         onClick={() => setGameMode('DIGITAL')}
                         className={`p-4 rounded-xl border-2 text-left transition-all ${
                             gameMode === 'DIGITAL'
                             ? 'border-indigo-500 bg-indigo-500/10'
                             : 'border-slate-700 hover:border-slate-600 bg-slate-800'
                         }`}
                     >
                         <div className={`font-bold mb-1 ${gameMode === 'DIGITAL' ? 'text-indigo-400' : 'text-slate-300'}`}>Digital Mode</div>
                         <div className="text-xs text-slate-500">Type while reading on-screen text.</div>
                     </button>

                     <button
                         onClick={() => setGameMode('PHYSICAL')}
                         className={`p-4 rounded-xl border-2 text-left transition-all ${
                             gameMode === 'PHYSICAL'
                             ? 'border-indigo-500 bg-indigo-500/10'
                             : 'border-slate-700 hover:border-slate-600 bg-slate-800'
                         }`}
                     >
                         <div className={`font-bold mb-1 ${gameMode === 'PHYSICAL' ? 'text-indigo-400' : 'text-slate-300'}`}>Paper Mode</div>
                         <div className="text-xs text-slate-500">Type in a separate panel and analyze after finishing.</div>
                     </button>
                 </div>
             </div>

             <div className="w-full bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                 <label className="block text-slate-400 text-sm font-bold mb-3 uppercase tracking-wider text-center">
                   Time Limit {isSSCMode ? '(Fixed 10m)' : ''}
                 </label>
                 <div className="flex flex-wrap gap-2 justify-center">
                     {timeOptions.map((option) => (
                     <button
                         key={option.value}
                         onClick={() => {
                           if (!isSSCMode) setTimeLimit(option.value);
                         }}
                         disabled={isSSCMode}
                         className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                         activeTimeLimit === option.value
                             ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                             : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                         } ${isSSCMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                     >
                         {option.label}
                     </button>
                     ))}
                 </div>
             </div>
        </div>
      )}

      <Button 
        onClick={handleStart} 
        disabled={!hasContent || isProcessing}
        isLoading={isProcessing && inputMode === 'image'}
        className="w-full sm:w-auto min-w-[200px]"
      >
        {isSSCMode ? 'Start SSC Exam (10 Min)' : (inputMode === 'image' ? 'Generate Test with AI' : 'Start Typing Test')}
      </Button>
    </div>
  );
};
