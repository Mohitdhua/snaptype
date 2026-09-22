import { CourtExamEvaluation, CourtWordMistake } from '../types';

/**
 * Tokenizes text into word tokens preserving punctuation attached to words.
 */
export function tokenizeWords(text: string): string[] {
  if (!text) return [];
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Aligns typed words against original words using dynamic programming (Wagner-Fischer).
 * Allows free-end gaps on original text so unattempted text at the end of the passage
 * is NOT counted as omissions.
 */
export function alignCourtPassage(
  originalWords: string[],
  typedWords: string[]
): {
  omissions: string[];
  substitutions: { expected: string; typed: string }[];
  additions: string[];
  mistakesList: CourtWordMistake[];
} {
  const n = originalWords.length;
  const m = typedWords.length;

  if (m === 0) {
    return { omissions: [], substitutions: [], additions: [], mistakesList: [] };
  }

  if (n === 0) {
    const additions = [...typedWords];
    const mistakesList: CourtWordMistake[] = typedWords.map((w, idx) => ({
      type: 'addition',
      wordIndex: idx,
      typed: w,
    }));
    return { omissions: [], substitutions: [], additions, mistakesList };
  }

  // DP table: dp[i][j] where i in [0..n], j in [0..m]
  // dp[i][j] stores the minimum penalty to align originalWords[0..i-1] with typedWords[0..j-1]
  // Flattened 1D array for high performance
  const cols = m + 1;
  const dp = new Int32Array((n + 1) * cols);

  // Base cases:
  // j typed words against 0 original words = j additions
  for (let j = 0; j <= m; j++) {
    dp[j] = j;
  }
  // i original words against 0 typed words = i omissions
  for (let i = 1; i <= n; i++) {
    dp[i * cols] = i;
  }

  for (let i = 1; i <= n; i++) {
    const origWord = originalWords[i - 1];
    const rowOffset = i * cols;
    const prevRowOffset = (i - 1) * cols;

    for (let j = 1; j <= m; j++) {
      const typedWord = typedWords[j - 1];
      const matchCost = origWord === typedWord ? 0 : 1;

      const subCost = dp[prevRowOffset + (j - 1)] + matchCost;
      const delCost = dp[prevRowOffset + j] + 1; // omission from original
      const insCost = dp[rowOffset + (j - 1)] + 1; // addition in typed

      let minVal = subCost;
      if (delCost < minVal) minVal = delCost;
      if (insCost < minVal) minVal = insCost;

      dp[rowOffset + j] = minVal;
    }
  }

  // Find the optimal end row i* that aligns all m typed words.
  // In typing tests, candidate attempts a prefix of the passage.
  // We search for the lowest cost endpoint in column m within a sensible window around m.
  let bestI = Math.min(n, m);
  let minPenalty = dp[bestI * cols + m];

  const minSearchI = Math.max(1, Math.floor(m * 0.7));
  const maxSearchI = Math.min(n, Math.ceil(m * 1.3) + 20);

  for (let i = minSearchI; i <= maxSearchI; i++) {
    const cost = dp[i * cols + m];
    if (cost < minPenalty) {
      minPenalty = cost;
      bestI = i;
    }
  }

  // Backtrack from (bestI, m) to (0, 0)
  const omissions: string[] = [];
  const substitutions: { expected: string; typed: string }[] = [];
  const additions: string[] = [];
  const mistakesList: CourtWordMistake[] = [];

  let curI = bestI;
  let curJ = m;

  while (curI > 0 || curJ > 0) {
    if (curI > 0 && curJ > 0) {
      const origWord = originalWords[curI - 1];
      const typedWord = typedWords[curJ - 1];
      const matchCost = origWord === typedWord ? 0 : 1;
      const currentVal = dp[curI * cols + curJ];

      if (currentVal === dp[(curI - 1) * cols + (curJ - 1)] + matchCost) {
        if (matchCost === 1) {
          substitutions.unshift({ expected: origWord, typed: typedWord });
          mistakesList.unshift({
            type: 'substitution',
            wordIndex: curJ - 1,
            expected: origWord,
            typed: typedWord,
          });
        }
        curI--;
        curJ--;
        continue;
      }
    }

    if (curJ > 0 && dp[curI * cols + curJ] === dp[curI * cols + (curJ - 1)] + 1) {
      const typedWord = typedWords[curJ - 1];
      additions.unshift(typedWord);
      mistakesList.unshift({
        type: 'addition',
        wordIndex: curJ - 1,
        typed: typedWord,
      });
      curJ--;
      continue;
    }

    if (curI > 0 && dp[curI * cols + curJ] === dp[(curI - 1) * cols + curJ] + 1) {
      const origWord = originalWords[curI - 1];
      omissions.unshift(origWord);
      mistakesList.unshift({
        type: 'omission',
        wordIndex: curJ,
        expected: origWord,
      });
      curI--;
      continue;
    }

    // Fallback safeguard
    if (curI > 0) curI--;
    else if (curJ > 0) curJ--;
  }

  return { omissions, substitutions, additions, mistakesList };
}

/**
 * Evaluates typing test according to the official High Court of Punjab & Haryana
 * and S.S.S.C. (Subordinate Courts of Punjab & Haryana) Clerk Examination rules.
 *
 * Official Rules:
 * 1. Duration: 10 minutes (or actual minutes elapsed if stopped)
 * 2. 5 key depressions / strokes = 1 standard word
 * 3. Gross Words = Total Key Depressions / 5
 * 4. Gross Speed (WPM) = Gross Words / Test Duration (min)
 * 5. Mistakes = Omissions + Substitutions + Additions
 * 6. Penalty = 1 word per mistake
 * 7. Net Words = Gross Words - Mistakes
 * 8. Net Speed (WPM) = (Gross Words - Mistakes) / Test Duration (min)
 * 9. Error % = (Mistakes / Gross Words) * 100
 * 10. Qualifying criteria: Net Speed >= 30.00 WPM AND Error % <= 10.00%
 */
export function evaluateCourtTypingTest(
  originalText: string,
  typedText: string,
  elapsedSeconds: number,
  totalKeystrokes?: number
): CourtExamEvaluation {
  const origTokens = tokenizeWords(originalText);
  const typedTokens = tokenizeWords(typedText);

  // Total key depressions: strokes including space, punctuation, symbols.
  // Use tracked totalKeystrokes if provided, fallback to raw typed text character count.
  const strokes = Math.max(typedText.length, totalKeystrokes || 0);

  // Minutes elapsed (for full official exam, standard is 10 min)
  const durationMinutes = Math.max(0.1, Number((elapsedSeconds / 60).toFixed(2)));

  // Standard word conversion: 5 strokes = 1 word
  const grossWords = Number((strokes / 5).toFixed(2));
  const grossWpm = Number((grossWords / durationMinutes).toFixed(2));

  // Align words to calculate omissions, substitutions, and additions
  const { omissions, substitutions, additions, mistakesList } = alignCourtPassage(origTokens, typedTokens);

  const omissionsCount = omissions.length;
  const substitutionsCount = substitutions.length;
  const additionsCount = additions.length;
  const totalMistakes = omissionsCount + substitutionsCount + additionsCount;

  // Each mistake deducts 1 full word from gross words
  const netWords = Math.max(0, Number((grossWords - totalMistakes).toFixed(2)));
  const netWpm = Math.max(0, Number((netWords / durationMinutes).toFixed(2)));

  // Error percentage: (Total Mistakes / Gross Words) * 100
  const errorPercentage = grossWords > 0
    ? Number(((totalMistakes / grossWords) * 100).toFixed(2))
    : 0;

  const accuracy = Math.max(0, Number((100 - errorPercentage).toFixed(2)));

  // Qualifying rules:
  // 1. Net Speed >= 30.00 WPM
  // 2. Error % <= 10.00%
  const isSpeedQualified = netWpm >= 30.0;
  const isAccuracyQualified = errorPercentage <= 10.0;
  const status = isSpeedQualified && isAccuracyQualified ? 'QUALIFIED' : 'DISQUALIFIED';

  const disqualificationReasons: string[] = [];
  if (!isSpeedQualified) {
    disqualificationReasons.push(
      `Net typing speed of ${netWpm.toFixed(2)} WPM is below the minimum qualifying speed of 30.00 WPM.`
    );
  }
  if (!isAccuracyQualified) {
    disqualificationReasons.push(
      `Total error rate of ${errorPercentage.toFixed(2)}% (${totalMistakes} mistakes) exceeds the permissible limit of 10.00%.`
    );
  }

  const spreadsheetNotice =
    'Note: As per High Court / S.S.S.C. recruitment guidelines, typing qualification is subject to securing minimum 40% (4 out of 10 marks) in the Spreadsheet (MS Excel) test.';

  return {
    examName: 'High Court of Punjab & Haryana / S.S.S.C. Clerk Computer Proficiency Test',
    durationMinutes: 10,
    totalKeyDepressions: strokes,
    grossWords,
    grossWpm,
    totalMistakes,
    omissionsCount,
    substitutionsCount,
    additionsCount,
    mistakesList,
    netWords,
    netWpm,
    errorPercentage,
    accuracy,
    isSpeedQualified,
    isAccuracyQualified,
    status,
    disqualificationReasons,
    spreadsheetNotice,
  };
}
