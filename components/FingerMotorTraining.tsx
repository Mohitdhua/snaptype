import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { HandsGuide, FingerId, FINGER_NAMES } from './HandsGuide';
import { TimeLimit } from '../types';
import {
  FINGER_MOTOR_MODULES,
  FingerMotorModule,
  MotorDrillTier,
  MotorCategory,
  generateCustomFingerPairDrill,
  CUSTOM_FINGER_WORD_BANK
} from '../data/fingerMotorData';

interface FingerMotorTrainingProps {
  onStartDrill: (text: string, title: string, timeLimit?: TimeLimit) => void;
  theme: string;
}

const CATEGORIES: { id: MotorCategory; label: string }[] = [
  { id: 'all', label: 'All Modules' },
  { id: 'coupled', label: 'Digit Decoupling' },
  { id: 'index', label: 'Index Extension' },
  { id: 'cascades', label: 'Motor Cascades' },
  { id: 'bilateral', label: 'Bilateral Rhythm' },
  { id: 'perimeter', label: 'Perimeter Range' }
];

const TIME_OPTIONS: { label: string; value: TimeLimit }[] = [
  { label: '30s Sprint', value: 30 },
  { label: '60s Standard', value: 60 },
  { label: 'Full Passage', value: 0 }
];

const FINGER_SELECT_OPTIONS: { id: FingerId; label: string }[] = [
  { id: 'lp', label: 'Left Pinky (A, Q, Z)' },
  { id: 'lr', label: 'Left Ring (S, W, X)' },
  { id: 'lm', label: 'Left Middle (D, E, C)' },
  { id: 'li', label: 'Left Index (F, R, V, G, T, B)' },
  { id: 'ri', label: 'Right Index (J, U, M, H, Y, N)' },
  { id: 'rm', label: 'Right Middle (K, I, ,)' },
  { id: 'rr', label: 'Right Ring (L, O, .)' },
  { id: 'rp', label: 'Right Pinky (P, ;, /, [)' }
];

export const FingerMotorTraining: React.FC<FingerMotorTrainingProps> = ({ onStartDrill }) => {
  const [selectedCategory, setSelectedCategory] = useState<MotorCategory>('all');
  const [selectedModuleId, setSelectedModuleId] = useState<string>(FINGER_MOTOR_MODULES[0].id);
  const [activeTier, setActiveTier] = useState<MotorDrillTier>('patterns');
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<TimeLimit>(60);

  // Custom Pair Lab state
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customFinger1, setCustomFinger1] = useState<FingerId>('lp');
  const [customFinger2, setCustomFinger2] = useState<FingerId>('lr');

  const filteredModules = useMemo(() => {
    if (selectedCategory === 'all') return FINGER_MOTOR_MODULES;
    return FINGER_MOTOR_MODULES.filter(m => m.category === selectedCategory);
  }, [selectedCategory]);

  const activeModule = useMemo(() => {
    return FINGER_MOTOR_MODULES.find(m => m.id === selectedModuleId) || FINGER_MOTOR_MODULES[0];
  }, [selectedModuleId]);

  const customDrill = useMemo(() => {
    return generateCustomFingerPairDrill(customFinger1, customFinger2);
  }, [customFinger1, customFinger2]);

  const activeText = useMemo(() => {
    if (isCustomMode) {
      return customDrill.text;
    }
    return activeModule.modes[activeTier].text;
  }, [isCustomMode, customDrill, activeModule, activeTier]);

  const activeTitle = useMemo(() => {
    if (isCustomMode) {
      return customDrill.title;
    }
    const tierName = activeTier === 'patterns' ? 'Targeted Patterns' : activeTier === 'words' ? 'Vocabulary Fluency' : 'Fluent Context';
    return `Motor Training: ${activeModule.title} (${tierName})`;
  }, [isCustomMode, customDrill, activeModule, activeTier]);

  const handleStart = () => {
    onStartDrill(activeText, activeTitle, selectedTimeLimit);
  };

  const handleFingerClickOnDiagram = (fingerId: FingerId) => {
    if (isCustomMode) {
      // Toggle custom selection
      if (customFinger1 === fingerId) {
        // do nothing
      } else {
        setCustomFinger2(fingerId);
      }
    } else {
      // Find a module that features this finger
      const matchingModule = FINGER_MOTOR_MODULES.find(m => m.fingerIds.includes(fingerId));
      if (matchingModule) {
        setSelectedModuleId(matchingModule.id);
      }
    }
  };

  const displayedHighlightedFingers = isCustomMode ? [customFinger1, customFinger2] : activeModule.fingerIds;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center animate-fade-in text-center px-4 py-2">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>⚡ Sensorimotor Neuromuscular Training</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          Finger Motor Training
        </h1>
        <p className="text-sm md:text-base opacity-75 max-w-2xl leading-relaxed">
          Evidence-based neuromuscular calibration. Practice targeted tendon independence, eliminate co-activation, and build natural finger dexterity with verified phonemic transitions and realistic prose—no meaningless repetitive column slides.
        </p>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row w-full gap-6 text-left items-start">
        {/* Left Column: Visualizer & Biomechanics Rationale */}
        <div className="w-full lg:w-5/12 flex flex-col gap-4">
          {/* Hands Anatomical Visualizer */}
          <div className="bento-card p-5 flex flex-col items-center justify-center bg-neutral-900/60 border border-neutral-800 shadow-xl backdrop-blur-md">
            <div className="w-full flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-neutral-300">Anatomical Focus</span>
              <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {isCustomMode
                  ? `${FINGER_NAMES[customFinger1]} & ${FINGER_NAMES[customFinger2]}`
                  : activeModule.anatomicalDigits}
              </span>
            </div>

            <HandsGuide
              highlightFingers={displayedHighlightedFingers}
              onSelectFinger={handleFingerClickOnDiagram}
              customLabel={
                isCustomMode
                  ? `${FINGER_NAMES[customFinger1]} ↔ ${FINGER_NAMES[customFinger2]}`
                  : activeModule.anatomicalDigits
              }
            />

            <div className="flex flex-wrap justify-center items-center gap-1.5 mt-4 pt-3 border-t border-neutral-800/80 w-full text-[11px]">
              <span className="text-neutral-400 mr-1">Target Keys:</span>
              {(isCustomMode
                ? Array.from(new Set([...(CUSTOM_FINGER_WORD_BANK[customFinger1] || []).join('').slice(0, 8), ...(CUSTOM_FINGER_WORD_BANK[customFinger2] || []).join('').slice(0, 8)]))
                : activeModule.targetKeys
              ).slice(0, 10).map(key => (
                <span
                  key={key}
                  className="px-2 py-0.5 rounded bg-neutral-800/80 border border-neutral-700/80 text-neutral-200 font-mono font-bold uppercase shadow-sm"
                >
                  {key}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-neutral-500 mt-2 text-center">
              Click any finger on the diagram to inspect or calibrate.
            </p>
          </div>

          {/* Biomechanical Mechanism Card */}
          {!isCustomMode ? (
            <div className="bento-card p-5 bg-gradient-to-br from-neutral-900/80 to-indigo-950/20 border border-neutral-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-bold text-neutral-400">
                  Neuromuscular Rationale
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-mono border border-indigo-500/30">
                  {activeModule.biomechanicalFocus}
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {activeModule.clinicalRationale}
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-neutral-800/60 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  Natural Lexical Context
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"></span>
                  Zero Co-Activation
                </span>
              </div>
            </div>
          ) : (
            <div className="bento-card p-5 bg-gradient-to-br from-neutral-900/80 to-indigo-950/20 border border-neutral-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-bold text-neutral-400">
                  Custom Diagnostic Mode
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono border border-amber-500/30">
                  Adaptive Word Interleave
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Generates a targeted 35-word calibration set composed strictly of verified English words exercising the micro-transitions between your two selected fingers.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                    Finger 1
                  </label>
                  <select
                    value={customFinger1}
                    onChange={(e) => setCustomFinger1(e.target.value as FingerId)}
                    className="w-full bg-neutral-800 text-xs text-neutral-200 rounded p-2 border border-neutral-700 outline-none focus:border-indigo-500"
                  >
                    {FINGER_SELECT_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                    Finger 2
                  </label>
                  <select
                    value={customFinger2}
                    onChange={(e) => setCustomFinger2(e.target.value as FingerId)}
                    className="w-full bg-neutral-800 text-xs text-neutral-200 rounded p-2 border border-neutral-700 outline-none focus:border-indigo-500"
                  >
                    {FINGER_SELECT_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Quick Launch Panel */}
          <div className="bento-card p-5 bg-neutral-900/70 border border-neutral-800 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300">Session Duration</span>
              <div className="inline-flex rounded-lg bg-neutral-950 p-1 border border-neutral-800">
                {TIME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedTimeLimit(opt.value)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors ${
                      selectedTimeLimit === opt.value
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drill Preview Box */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Text Preview</span>
                <span className="font-mono">{activeText.split(' ').length} words</span>
              </div>
              <div className="p-3 bg-neutral-950/80 rounded-lg border border-neutral-800/80 font-mono text-xs text-neutral-300 leading-relaxed max-h-24 overflow-y-auto select-none">
                {activeText}
              </div>
            </div>

            <Button
              onClick={handleStart}
              className="w-full py-3.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all rounded-xl"
            >
              Start Motor Training Drill →
            </Button>
          </div>
        </div>

        {/* Right Column: Module Library & Tier Selection */}
        <div className="w-full lg:w-7/12 flex flex-col gap-4">
          {/* Navigation & Mode Toggle Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setIsCustomMode(false);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    !isCustomMode && selectedCategory === cat.id
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Custom Mode Toggle Button */}
            <button
              onClick={() => setIsCustomMode(!isCustomMode)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${
                isCustomMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 border-neutral-800 hover:bg-neutral-800/50'
              }`}
            >
              🛠️ Custom Pair Lab
            </button>
          </div>

          {/* If NOT custom mode: Tier Switcher */}
          {!isCustomMode && (
            <div className="bento-card p-4 bg-neutral-900/60 border border-neutral-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">
                  Select Training Tier
                </span>
                <span className="text-[11px] text-neutral-400">
                  No repetitive column loops — 100% natural mechanics
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['patterns', 'words', 'sentences'] as MotorDrillTier[]).map(tier => {
                  const isActive = activeTier === tier;
                  const tierData = activeModule.modes[tier];
                  const title =
                    tier === 'patterns'
                      ? 'Targeted Patterns'
                      : tier === 'words'
                      ? 'Vocabulary Fluency'
                      : 'Fluent Context';
                  const subtitle =
                    tier === 'patterns'
                      ? 'Phonemic n-grams'
                      : tier === 'words'
                      ? 'Real English words'
                      : 'Natural prose sentences';

                  return (
                    <button
                      key={tier}
                      onClick={() => setActiveTier(tier)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        isActive
                          ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-md'
                          : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-neutral-100">{title}</span>
                        {isActive && <span className="text-indigo-400 text-xs">✓</span>}
                      </div>
                      <span className="text-[10px] text-neutral-400">{subtitle}</span>
                      <p className="text-[10px] opacity-75 mt-1 line-clamp-2 leading-relaxed">
                        {tierData.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Module Cards Grid */}
          {!isCustomMode ? (
            <div className="flex flex-col gap-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredModules.map(module => {
                const isSelected = activeModule.id === module.id;
                return (
                  <div
                    key={module.id}
                    onClick={() => setSelectedModuleId(module.id)}
                    className={`bento-card p-4.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-950/40 via-neutral-900 to-neutral-900 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-indigo-400 animate-pulse' : 'bg-neutral-600'}`}></span>
                        <h3 className="font-semibold text-sm text-neutral-100">
                          {module.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {module.hand === 'both' ? 'Both Hands' : module.hand === 'left' ? 'Left Hand' : 'Right Hand'}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          {module.categoryLabel}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {module.clinicalRationale}
                    </p>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-neutral-800/70 gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                        <span>Anatomy:</span>
                        <span className="text-neutral-300 font-mono">{module.anatomicalDigits}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedModuleId(module.id);
                            onStartDrill(module.modes[activeTier].text, `Motor Training: ${module.title}`, selectedTimeLimit);
                          }}
                          className="text-xs py-1.5 px-4 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-lg shadow-sm"
                        >
                          Launch Drill
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bento-card p-6 bg-neutral-900/50 border border-neutral-800 flex flex-col gap-4 text-center items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl mb-1">
                ⚙️
              </div>
              <h3 className="text-lg font-bold text-neutral-100">
                Custom Finger Calibration Lab
              </h3>
              <p className="text-xs text-neutral-400 max-w-md leading-relaxed">
                Select any pair of fingers in the left panel to synthesize a customized 35-word calibration drill. The algorithm selects verified words with concentrated transitions between your chosen digits.
              </p>
              <div className="flex items-center gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-300">
                <span className="font-bold text-indigo-400">{FINGER_NAMES[customFinger1]}</span>
                <span className="text-neutral-500">↔</span>
                <span className="font-bold text-cyan-400">{FINGER_NAMES[customFinger2]}</span>
              </div>
              <Button
                onClick={handleStart}
                className="mt-2 text-xs py-2 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg"
              >
                Start Custom Drill →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
