
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
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 animate-fade-in">
      
      {/* Input Source Switcher */}
      <div className="bg-white/5 p-1 rounded-full flex gap-1 border border-white/10">
        <button
            onClick={() => setInputMode('image')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                inputMode === 'image' 
                ? 'bg-white text-black shadow-md'
                : 'text-stitch-muted hover:text-white'
            }`}
        >
            Upload Image
        </button>
        <button
            onClick={() => setInputMode('text')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                inputMode === 'text' 
                ? 'bg-white text-black shadow-md'
                : 'text-stitch-muted hover:text-white'
            }`}
        >
            Paste Text
        </button>
      </div>

      <div className="w-full relative">
        {inputMode === 'image' ? (
            <div 
                className={`w-full h-80 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${preview ? 'border-white/20 bg-white/5' : 'border-white/10 hover:border-white/30 bg-transparent'}`}
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
                <div className="text-center p-6 pointer-events-none flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-stitch-muted border border-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-stitch-accent">Drop your image here</h3>
                      <p className="text-sm text-stitch-muted mt-1">or click to browse files</p>
                    </div>
                </div>
                )}
            </div>
        ) : (
            <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Paste your text here to create a custom typing test..."
                className="w-full h-80 bg-white/5 border border-white/10 rounded-[2rem] p-6 text-stitch-accent placeholder-stitch-muted focus:border-white/30 focus:outline-none resize-none transition-colors scrollbar-thin scrollbar-thumb-slate-600"
            />
        )}
      </div>

      {error && inputMode === 'image' && <p className="text-red-400 font-medium">{error}</p>}

      {hasContent && (
        <div className="w-full space-y-4 animate-fade-in flex flex-col gap-2">
             
             {/* SSC Mode Toggle */}
             <div
                 role="switch"
                 aria-checked={isSSCMode}
                 tabIndex={0}
                 className="w-full bento-card p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                 onClick={toggleSSC}
                 onKeyDown={(e) => {
                     if (e.key === 'Enter' || e.key === ' ') {
                         e.preventDefault();
                         toggleSSC();
                     }
                 }}
             >
                 <div className="flex flex-col">
                     <span className="text-stitch-accent font-medium flex items-center gap-2">
                        SSC Exam Mode
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide border border-red-500/30">Strict</span>
                     </span>
                     <span className="text-xs text-stitch-muted mt-1">10 min duration. 1 WPM penalty per mistake.</span>
                 </div>
                 <div className={`w-11 h-6 rounded-full p-1 transition-colors ${isSSCMode ? 'bg-white' : 'bg-white/10 border border-white/20'}`}>
                     <div className={`w-4 h-4 bg-black rounded-full shadow-md transform transition-transform ${isSSCMode ? 'translate-x-5' : 'translate-x-0 bg-stitch-muted'}`}></div>
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bento-card p-4 flex flex-col gap-3">
                     <label className="text-xs font-bold uppercase tracking-wider text-stitch-muted">Typing Mode</label>
                     <div className="flex flex-col gap-2">
                         <button
                             onClick={() => setGameMode('DIGITAL')}
                             className={`p-3 rounded-xl border text-left transition-all ${
                                 gameMode === 'DIGITAL'
                                 ? 'border-white bg-white text-black'
                                 : 'border-white/10 hover:border-white/30 text-stitch-muted hover:text-stitch-accent'
                             }`}
                         >
                             <div className="font-medium text-sm">Digital Mode</div>
                         </button>

                         <button
                             onClick={() => setGameMode('PHYSICAL')}
                             className={`p-3 rounded-xl border text-left transition-all ${
                                 gameMode === 'PHYSICAL'
                                 ? 'border-white bg-white text-black'
                                 : 'border-white/10 hover:border-white/30 text-stitch-muted hover:text-stitch-accent'
                             }`}
                         >
                             <div className="font-medium text-sm">Paper Mode</div>
                         </button>
                     </div>
                 </div>

                 <div className="bento-card p-4 flex flex-col gap-3">
                     <label className="text-xs font-bold uppercase tracking-wider text-stitch-muted">
                       Time Limit {isSSCMode ? '(Fixed 10m)' : ''}
                     </label>
                     <div className="flex flex-wrap gap-2">
                         {timeOptions.map((option) => (
                         <button
                             key={option.value}
                             onClick={() => {
                               if (!isSSCMode) setTimeLimit(option.value);
                             }}
                             disabled={isSSCMode}
                             className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex-1 text-center border ${
                             activeTimeLimit === option.value
                                 ? 'bg-white text-black border-white'
                                 : 'bg-transparent text-stitch-muted border-white/10 hover:border-white/30 hover:text-stitch-accent'
                             } ${isSSCMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                         >
                             {option.label}
                         </button>
                         ))}
                     </div>
                 </div>
             </div>
        </div>
      )}

      <Button 
        onClick={handleStart} 
        disabled={!hasContent || isProcessing}
        isLoading={isProcessing && inputMode === 'image'}
        className="w-full"
      >
        {isSSCMode ? 'Start SSC Exam (10 Min)' : (inputMode === 'image' ? 'Generate Test with AI' : 'Start Typing Test')}
      </Button>
    </div>
  );
};
