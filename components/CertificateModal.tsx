import React, { useState } from 'react';
import { TestResults } from '../types';

interface CertificateModalProps {
  results: TestResults;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ results, onClose }) => {
  const [candidateName, setCandidateName] = useState('Mohit Kumar');
  const [isEditingName, setIsEditingName] = useState(false);

  const kdph = results.kdph || Math.round((results.totalChars / Math.max(0.1, results.timeElapsed / 60)) * 60);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const certificateId = `ST-${Math.abs(results.timeElapsed * 1000 + results.netWpm).toString(36).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const getGrade = (wpm: number, accuracy: number) => {
    if (wpm >= 60 && accuracy >= 97) return { label: 'Elite Master Typist', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' };
    if (wpm >= 45 && accuracy >= 95) return { label: 'Professional Grade (Gold)', color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' };
    if (wpm >= 35 && accuracy >= 92) return { label: 'Court & SSC Qualified (Silver)', color: 'text-slate-300 border-slate-400/40 bg-slate-400/10' };
    return { label: 'Certified Typist (Standard)', color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10' };
  };

  const grade = getGrade(results.netWpm, results.accuracy);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl flex flex-col gap-4 my-8">
        {/* Print & Action Controls (Hidden when printing) */}
        <div className="flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingName(!isEditingName)}
              className="text-xs font-mono text-neutral-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10"
            >
              {isEditingName ? 'Done Editing Name' : 'Edit Candidate Name'}
            </button>
            {isEditingName && (
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="text-xs font-mono px-3 py-1.5 rounded-xl bg-neutral-900 border border-indigo-500 text-white focus:outline-none"
                placeholder="Enter Full Name"
                autoFocus
              />
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Certificate Canvas */}
        <div
          id="printable-certificate"
          className="relative w-full rounded-3xl p-8 md:p-12 border-2 border-amber-500/40 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white shadow-2xl overflow-hidden print:border-black print:text-black print:bg-white"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06),transparent_65%)] pointer-events-none" />

          {/* Certificate Inner Border */}
          <div className="border border-amber-500/20 rounded-2xl p-6 md:p-8 flex flex-col items-center text-center relative z-10">
            {/* Header / Logo */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center">
                <span className="text-amber-300 font-bold text-xl">S</span>
              </div>
              <span className="text-sm font-mono tracking-widest text-amber-300 uppercase font-bold">
                SnapType Pro Typing Academy
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-wide mt-2">
              Certificate of Competency
            </h1>
            <p className="text-xs md:text-sm font-mono text-neutral-400 uppercase tracking-widest mt-1">
              Touch Typing Speed & Accuracy Verification
            </p>

            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent my-6" />

            <p className="text-xs text-neutral-400 italic">This is officially awarded to</p>

            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight my-2 border-b border-white/20 pb-1 px-4 min-w-[280px]">
              {candidateName}
            </h2>

            <p className="text-xs md:text-sm text-neutral-300 max-w-xl my-4 leading-relaxed font-sans">
              for successfully completing the touch-typing proficiency evaluation and demonstrating exemplary keystroke dexterity, motor discipline, and professional typing speed under timed conditions.
            </p>

            {/* Performance Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl my-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Net Speed</div>
                <div className="text-2xl font-mono font-black text-amber-400">{results.netWpm} WPM</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Accuracy</div>
                <div className="text-2xl font-mono font-black text-emerald-400">{results.accuracy}%</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Rate (KDPH)</div>
                <div className="text-2xl font-mono font-black text-indigo-400">{kdph}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Errors</div>
                <div className="text-2xl font-mono font-black text-rose-400">{results.incorrectChars}</div>
              </div>
            </div>

            {/* Grade Badge */}
            <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider my-2 ${grade.color}`}>
              {grade.label}
            </div>

            {/* Official Gold Seal & QR Security Section */}
            <div className="flex flex-col sm:flex-row items-center justify-around w-full max-w-xl my-4 py-3 border-y border-white/10 gap-4">
              {/* QR Verification Simulation */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white p-1 rounded-lg shadow-md flex items-center justify-center shrink-0">
                  {/* SVG QR Code Simulation */}
                  <svg className="w-full h-full text-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 2h7v7H2V2zm2 2v3h3V4H4zm5 0h1v2h-1V4zm-7 7h2v1H2v-1zm4 0h3v1H6v-1zm-4 2h1v3H2v-3zm3 0h1v1H5v-1zm2 0h2v2H7v-2zm-5 4h7v1H2v-1zm13-15h7v7h-7V2zm2 2v3h3V4h-3zm-2 7h1v2h-1v-2zm2 0h2v1h-2v-1zm3 0h2v2h-2v-2zm-3 2h2v1h-2v-1zm4 0h1v1h-1v-1zm-4 2h1v2h-1v-2zm2 0h3v1h-3v-1zm-2 2h3v1h-3v-1zm4 0h1v1h-1v-1zm-4 2h1v1h-1v-1zm2 0h2v1h-2v-1z"/>
                  </svg>
                </div>
                <div className="text-left font-mono text-[10px] text-neutral-400">
                  <div className="text-white font-bold">Tamper-Proof ID</div>
                  <div className="text-amber-400">{certificateId.slice(0, 16)}...</div>
                  <div className="text-[9px] text-neutral-500">Scan to authenticate</div>
                </div>
              </div>

              {/* Ornate Gold Seal Medal */}
              <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-300 to-amber-500 border-2 border-yellow-200 shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center relative">
                  <div className="w-12 h-12 rounded-full border border-amber-800/40 flex flex-col items-center justify-center text-center">
                    <span className="text-black font-black text-[9px] leading-tight uppercase tracking-wider">OFFICIAL</span>
                    <span className="text-black font-extrabold text-[8px] leading-tight">SEAL</span>
                  </div>
                  <div className="absolute -bottom-2.5 left-2 w-3.5 h-5 bg-gradient-to-b from-amber-600 to-amber-800 -rotate-12 rounded-b shadow -z-10" />
                  <div className="absolute -bottom-2.5 right-2 w-3.5 h-5 bg-gradient-to-b from-amber-600 to-amber-800 rotate-12 rounded-b shadow -z-10" />
                </div>
              </div>
            </div>

            {/* Footer Signatures & Verification */}
            <div className="grid grid-cols-3 items-end w-full mt-6 pt-4 border-t border-white/10 text-[11px] font-mono text-neutral-400">
              <div className="text-left">
                <div className="border-b border-neutral-600/80 pb-1 mb-1 max-w-[140px] italic text-neutral-300 font-serif">
                  Examination Board
                </div>
                <div>Director of Testing</div>
                <div className="text-[9px] text-neutral-500">{dateStr}</div>
              </div>

              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-full border border-dashed border-amber-400/60 flex items-center justify-center text-[8px] text-amber-300 font-bold uppercase">
                  VERIFIED
                </div>
              </div>

              <div className="text-right">
                <div className="border-b border-neutral-600/80 pb-1 mb-1 max-w-[140px] ml-auto italic text-neutral-300 font-serif">
                  Registrar Audit
                </div>
                <div>ID: {certificateId}</div>
                <div className="text-[9px] text-emerald-400">Status: QUALIFIED</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
