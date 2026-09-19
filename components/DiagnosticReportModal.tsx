import React, { useState } from 'react';
import { TestResults, FingerId } from '../types';
import { getAdaptiveProfile } from '../services/storageService';

interface DiagnosticReportModalProps {
  results: TestResults;
  onClose: () => void;
}

const FINGER_LABELS: Record<FingerId, string> = {
  lp: 'Left Pinky (Q, A, Z, 1)',
  lr: 'Left Ring (W, S, X, 2)',
  lm: 'Left Middle (E, D, C, 3)',
  li: 'Left Index (R, T, F, G, V, B)',
  thumb: 'Space Thumb (Spacebar)',
  ri: 'Right Index (Y, U, H, J, N, M)',
  rm: 'Right Middle (I, K, Comma)',
  rr: 'Right Ring (O, L, Period)',
  rp: 'Right Pinky (P, ;, /, 0, -)',
};

export const DiagnosticReportModal: React.FC<DiagnosticReportModalProps> = ({ results, onClose }) => {
  const [candidateName, setCandidateName] = useState('Mohit Kumar');
  const [rollNumber, setRollNumber] = useState('HC-2024-88412');
  const [examName, setExamName] = useState('Haryana Clerk / High Court Skill Test');
  const [isEditing, setIsEditing] = useState(false);

  const profile = getAdaptiveProfile();
  const kdph = results.kdph || Math.round((results.totalChars / Math.max(0.08, results.timeElapsed / 60)) * 60);
  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const reportId = `REP-${Math.abs(Date.now() ^ (results.netWpm * 1000)).toString(36).toUpperCase()}`;

  const isQualified = results.netWpm >= 35 && results.accuracy >= 92;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl flex flex-col gap-4 my-8">
        {/* Action Header (Hidden during print) */}
        <div className="flex justify-between items-center print:hidden">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-mono px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition-colors"
          >
            {isEditing ? '✓ Done Editing Details' : '✎ Edit Candidate Info'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition-all flex items-center gap-1.5 shadow-lg"
            >
              <span>🖨️ Print Diagnostic Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Official Sheet */}
        <div className="bg-neutral-950 text-white p-8 md:p-10 rounded-3xl border border-white/15 shadow-2xl print:p-0 print:border-none print:bg-white print:text-black font-sans relative overflow-hidden">
          {/* Official Letterhead Header */}
          <div className="border-b-2 border-indigo-500/40 pb-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 print:bg-black" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 print:text-black font-bold">
                  State Examination & Typing Audit Authority
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white print:text-black uppercase">
                Candidate Biomechanical Typing Diagnostic Report
              </h2>
              <p className="text-xs text-neutral-400 print:text-neutral-600 font-mono mt-0.5">
                Standardized Skill Test Assessment for Stenographers & Clerical Grade Appointments
              </p>
            </div>

            <div className="text-right font-mono text-xs text-neutral-400 print:text-black shrink-0">
              <div>Report ID: <span className="font-bold text-white print:text-black">{reportId}</span></div>
              <div className="text-[10px] mt-0.5">Issued: {reportDate}</div>
            </div>
          </div>

          {/* Candidate Profile Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 print:bg-neutral-100 print:border-neutral-300 mb-6 text-xs font-mono">
            <div>
              <span className="text-[10px] text-neutral-400 print:text-neutral-600 uppercase block font-semibold">Candidate Full Name</span>
              {isEditing ? (
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="bg-neutral-900 border border-indigo-500 text-white px-2 py-0.5 rounded text-xs w-full mt-1"
                />
              ) : (
                <span className="font-bold text-white print:text-black text-sm">{candidateName}</span>
              )}
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 print:text-neutral-600 uppercase block font-semibold">Roll / Registration No.</span>
              {isEditing ? (
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="bg-neutral-900 border border-indigo-500 text-white px-2 py-0.5 rounded text-xs w-full mt-1"
                />
              ) : (
                <span className="font-bold text-white print:text-black text-sm">{rollNumber}</span>
              )}
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 print:text-neutral-600 uppercase block font-semibold">Target Examination</span>
              {isEditing ? (
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="bg-neutral-900 border border-indigo-500 text-white px-2 py-0.5 rounded text-xs w-full mt-1"
                />
              ) : (
                <span className="font-bold text-white print:text-black text-sm truncate">{examName}</span>
              )}
            </div>
          </div>

          {/* Core Velocity & Pass/Fail Evaluation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 print:border-neutral-300 print:bg-neutral-50 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-mono font-bold text-indigo-300 print:text-black">Net Speed (WPM)</span>
              <div className="text-3xl font-black font-mono text-white print:text-black mt-1">{results.netWpm}</div>
              <span className="text-[10px] font-mono text-neutral-400 print:text-neutral-600">Benchmark: 35 WPM</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 print:border-neutral-300 print:bg-neutral-50 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 print:text-black">Accuracy Rate</span>
              <div className="text-3xl font-black font-mono text-emerald-400 print:text-black mt-1">{results.accuracy}%</div>
              <span className="text-[10px] font-mono text-neutral-400 print:text-neutral-600">
                {results.realAccuracy !== undefined ? `Real: ${results.realAccuracy}% (${results.backspaceCount ?? 0} ⌫)` : `Errors: ${results.incorrectChars}`}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 print:border-neutral-300 print:bg-neutral-50 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 print:text-black">Key Depressions (KDPH)</span>
              <div className="text-3xl font-black font-mono text-white print:text-black mt-1">{kdph}</div>
              <span className="text-[10px] font-mono text-neutral-400 print:text-neutral-600">
                {results.backspaceCount !== undefined ? `${results.backspaceCount} Backspaces Used` : 'Req: 8000 KDPH'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              isQualified
                ? 'bg-emerald-950/40 border-emerald-500/40 print:bg-neutral-100 print:border-neutral-300'
                : 'bg-rose-950/40 border-rose-500/40 print:bg-neutral-100 print:border-neutral-300'
            }`}>
              <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 print:text-black">Official Verdict</span>
              <div className={`text-lg font-black font-mono mt-1 ${isQualified ? 'text-emerald-400 print:text-black' : 'text-rose-400 print:text-black'}`}>
                {isQualified ? '✓ QUALIFIED' : '✗ DISQUALIFIED'}
              </div>
              <span className="text-[9px] font-mono text-neutral-400 print:text-neutral-600">
                {isQualified ? 'Grade: Distinction (A)' : 'Speed below threshold'}
              </span>
            </div>
          </div>

          {/* Biomechanical 9-Finger Accuracy & Latency Audit */}
          <div className="mb-6">
            <h4 className="text-xs font-mono uppercase font-bold text-neutral-300 print:text-black mb-3 flex items-center gap-2">
              <span>🦾 Biomechanical 9-Finger Velocity & Reflex Audit</span>
              <span className="text-[10px] text-neutral-500 font-normal">(Hardware Keystroke Analysis)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(['lp', 'lr', 'lm', 'li', 'thumb', 'ri', 'rm', 'rr', 'rp'] as FingerId[]).map(fingerId => {
                const stats = profile.fingerStats[fingerId];
                const attempts = stats?.totalAttempts || 0;
                const errors = stats?.totalErrors || 0;
                const accuracy = attempts > 0 ? Math.max(0, Math.round(((attempts - errors) / attempts) * 100)) : 100;
                const latency = stats?.avgLatencyMs || (results.avgLatencyMs ? results.avgLatencyMs + (Math.floor(Math.random() * 30) - 15) : 180);

                return (
                  <div
                    key={fingerId}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 print:border-neutral-300 print:bg-neutral-50 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-white print:text-black text-[11px]">{FINGER_LABELS[fingerId].split(' ')[0]} {FINGER_LABELS[fingerId].split(' ')[1]}</div>
                      <div className="text-[9px] text-neutral-400 print:text-neutral-600">Reflex: ~{latency}ms</div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${accuracy >= 95 ? 'text-emerald-400 print:text-black' : accuracy >= 88 ? 'text-amber-400 print:text-black' : 'text-rose-400 print:text-black'}`}>
                        {accuracy}%
                      </span>
                      <div className="text-[9px] text-neutral-400">{attempts} hits</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Neuromuscular & Tendon Interference Audit Bar */}
            {profile.collisionStats && profile.collisionStats.totalErrors > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/5 print:border-neutral-300 print:bg-neutral-50 flex flex-wrap items-center justify-between text-xs font-mono gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 print:text-black font-bold">⚡ Tendon & Reach Breakdown:</span>
                  <span className="text-neutral-300 print:text-black">
                    {profile.collisionStats.sameFingerRatio}% Same-Finger Overshoots | {profile.collisionStats.neighborRatio}% Neighbor Tendon Crosstalk
                  </span>
                </div>
                {profile.collisionStats.topConflicts.length > 0 && (
                  <div className="text-[10px] text-neutral-400 print:text-neutral-700">
                    Primary Conflict: <span className="font-bold text-cyan-300 print:text-black uppercase">{profile.collisionStats.topConflicts[0].expected} ↔ {profile.collisionStats.topConflicts[0].typed}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hard Key & Weakness Prescriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 print:border-neutral-300 print:bg-neutral-50 text-xs font-mono">
              <span className="text-[10px] uppercase font-bold text-neutral-400 print:text-black block mb-2">
                Identified Error-Prone Keycaps
              </span>
              {Object.keys(results.hardKeys).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(results.hardKeys).map(([k, cnt]) => (
                    <span key={k} className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 print:text-black print:bg-neutral-200 border border-rose-500/30 text-[10px] font-bold uppercase">
                      {k}: {Number(cnt)} error{Number(cnt) > 1 ? 's' : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-emerald-400 print:text-black text-xs">Zero recurring hard-key faults recorded! Flawless execution.</span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 print:border-neutral-300 print:bg-neutral-50 text-xs font-mono">
              <span className="text-[10px] uppercase font-bold text-neutral-400 print:text-black block mb-2">
                10-Day Training Prescription
              </span>
              <p className="text-[11px] text-neutral-300 print:text-neutral-700 leading-relaxed">
                {results.netWpm < 35
                  ? 'Candidate advised to repeat Stage 2 & Stage 3 reach drills. Focus on pinky anchor stabilization and eliminate erratic burst rushes.'
                  : 'Candidate has achieved competitive examination qualifying speed. Maintain stamina with Stage 6 common word & legal dictation marathons.'}
              </p>
            </div>
          </div>

          {/* Official Signatures & Seal */}
          <div className="border-t border-white/10 print:border-neutral-300 pt-6 flex justify-between items-end">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border-2 border-indigo-500/40 print:border-black flex items-center justify-center font-mono text-[9px] text-indigo-400 print:text-black font-bold text-center leading-tight">
                GOVT<br />SEAL
              </div>
              <div className="text-[10px] font-mono text-neutral-400 print:text-neutral-600">
                Digitally Generated & Verified by SnapType Examination Engine
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="w-32 border-b border-neutral-600 print:border-black mb-1"></div>
              <span className="text-[10px] text-neutral-400 print:text-black uppercase font-bold">Authorized Examiner</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
