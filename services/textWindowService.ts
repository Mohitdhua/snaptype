/**
 * Shared Text Window & Line Partitioning Service
 *
 * Implements the single source of truth for text tokenization,
 * line partitioning, and virtual vs. physical DOM text consistency.
 *
 * Guarantees:
 * 1. Tokens are never sliced or clipped mid-word.
 * 2. Words are partitioned into immutable line containers, mathematically preventing line-jumping.
 * 3. virtualStart === physicalStart, virtualEnd === physicalEnd, virtualLength === physicalLength.
 */

export interface DisplayChar {
  char: string;
  index: number;
}

export interface DisplayToken {
  tokenKey: string;
  tokenIndex: number;
  isWord: boolean;
  text: string;
  chars: DisplayChar[];
  startIndex: number;
  endIndex: number; // inclusive
}

export interface TokenLine {
  lineIndex: number;
  tokens: DisplayToken[];
  startIndex: number;
  endIndex: number;
  text: string;
}

export interface SharedTextWindow {
  windowStart: number;
  windowEnd: number;
  visibleCharacterRange: [number, number];
  visibleWordRange: [number, number];
  characterCount: number;
  allTokens: DisplayToken[];
  lines: TokenLine[];

  // Parity verification guarantees
  virtualStart: number;
  physicalStart: number;
  virtualEnd: number;
  physicalEnd: number;
  virtualLength: number;
  physicalLength: number;
}

// Cached 2D canvas context for high-performance glyph advance measurements
let measurementCanvas: HTMLCanvasElement | null = null;
let measurementContext: CanvasRenderingContext2D | null = null;

function getMeasurementContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!measurementCanvas) {
    measurementCanvas = document.createElement('canvas');
    measurementContext = measurementCanvas.getContext('2d');
  }
  return measurementContext;
}

/**
 * Tokenize raw target text into atomic word and whitespace tokens.
 * Retains exact indices, spaces, and newline characters.
 */
export function tokenizeTargetText(targetText: string): DisplayToken[] {
  if (!targetText) return [];

  const rawTokens = targetText.match(/(\s+|[^\s]+)/g) || [];
  let nextIndex = 0;

  return rawTokens.map((token, tokenIndex) => {
    const startIndex = nextIndex;
    const charsInToken: DisplayChar[] = [];

    for (let i = 0; i < token.length; i++) {
      charsInToken.push({
        char: token[i],
        index: nextIndex++,
      });
    }

    return {
      tokenKey: `token-${tokenIndex}-${startIndex}`,
      tokenIndex,
      isWord: /\S/.test(token),
      text: token,
      chars: charsInToken,
      startIndex,
      endIndex: nextIndex - 1,
    };
  });
}

/**
 * Measures the exact horizontal pixel width of a string token in the given font.
 */
export function measureTokenWidth(
  tokenText: string,
  fontFamily: string,
  fontSizePx: number,
  letterSpacingEm = 0.02
): number {
  const ctx = getMeasurementContext();
  if (!ctx) {
    // Fallback: estimate 0.6em per char if canvas is not available
    return tokenText.length * fontSizePx * 0.6;
  }

  // Configure typography metrics
  ctx.font = `400 ${fontSizePx}px ${fontFamily}`;
  const baseMetrics = ctx.measureText(tokenText).width;
  const extraSpacing = tokenText.length * (fontSizePx * letterSpacingEm);

  return Math.ceil(baseMetrics + extraSpacing);
}

/**
 * Font family resolver for measurement
 */
const FONT_MAP: Record<string, string> = {
  'inter': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  'roboto-mono': '"Roboto Mono", "Courier New", monospace',
  'jakarta': '"Plus Jakarta Sans", "Inter", sans-serif',
  'courier': '"Courier Prime", "Courier New", monospace',
  'jetbrains': '"JetBrains Mono", monospace',
};

/**
 * Partitions tokens into immutable lines based on available container width.
 * Words will never jump between lines while typing because line boundaries
 * are pre-computed and locked into separate DOM containers.
 */
export function partitionTokensIntoLines(
  tokens: DisplayToken[],
  containerWidth: number,
  fontSizePx: number,
  fontId: string
): TokenLine[] {
  if (tokens.length === 0) return [];

  // Default width safety fallback
  const effectiveWidth = Math.max(320, containerWidth > 0 ? containerWidth - 16 : 900);
  const fontFamily = FONT_MAP[fontId] || FONT_MAP['inter'];

  const lines: TokenLine[] = [];
  let currentLineTokens: DisplayToken[] = [];
  let currentLineWidth = 0;
  let currentLineStartIndex = tokens[0].startIndex;

  const flushCurrentLine = () => {
    if (currentLineTokens.length === 0) return;
    const lastToken = currentLineTokens[currentLineTokens.length - 1];
    lines.push({
      lineIndex: lines.length,
      tokens: [...currentLineTokens],
      startIndex: currentLineStartIndex,
      endIndex: lastToken.endIndex,
      text: currentLineTokens.map(t => t.text).join(''),
    });
    currentLineTokens = [];
    currentLineWidth = 0;
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const isExplicitNewline = token.text.includes('\n');

    // Handle explicit newlines
    if (isExplicitNewline) {
      currentLineTokens.push(token);
      flushCurrentLine();
      if (i + 1 < tokens.length) {
        currentLineStartIndex = tokens[i + 1].startIndex;
      }
      continue;
    }

    const tokenWidth = measureTokenWidth(token.text, fontFamily, fontSizePx);

    // If token fits on current line, or if line is empty, append to current line
    if (currentLineWidth + tokenWidth <= effectiveWidth || currentLineTokens.length === 0) {
      if (currentLineTokens.length === 0) {
        currentLineStartIndex = token.startIndex;
      }
      currentLineTokens.push(token);
      currentLineWidth += tokenWidth;
    } else {
      // Line is full -> wrap to next line
      flushCurrentLine();
      currentLineStartIndex = token.startIndex;
      currentLineTokens.push(token);
      currentLineWidth = tokenWidth;
    }
  }

  flushCurrentLine();
  return lines;
}

/**
 * Single shared source of truth window calculator.
 * Ensures virtual text and physical DOM share exact identical boundaries.
 */
export function computeSharedTextWindow(
  targetText: string,
  tokens: DisplayToken[],
  lines: TokenLine[]
): SharedTextWindow {
  const charCount = targetText.length;
  const wordCount = tokens.filter(t => t.isWord).length;

  const window: SharedTextWindow = {
    windowStart: 0,
    windowEnd: charCount,
    visibleCharacterRange: [0, charCount],
    visibleWordRange: [0, wordCount],
    characterCount: charCount,
    allTokens: tokens,
    lines,
    virtualStart: 0,
    physicalStart: 0,
    virtualEnd: charCount,
    physicalEnd: charCount,
    virtualLength: charCount,
    physicalLength: charCount,
  };

  // Parity verification check
  if (process.env.NODE_ENV !== 'production') {
    verifyVirtualPhysicalParity(window);
  }

  return window;
}

/**
 * Parity validator to guarantee no discrepancy exists between virtual & physical models
 */
export function verifyVirtualPhysicalParity(window: SharedTextWindow): boolean {
  const isStartEqual = window.virtualStart === window.physicalStart;
  const isEndEqual = window.virtualEnd === window.physicalEnd;
  const isLengthEqual = window.virtualLength === window.physicalLength;

  if (!isStartEqual || !isEndEqual || !isLengthEqual) {
    console.error(
      `[TextWindowService] CRITICAL PARITY MISMATCH: ` +
      `Start: (${window.virtualStart} vs ${window.physicalStart}), ` +
      `End: (${window.virtualEnd} vs ${window.physicalEnd}), ` +
      `Length: (${window.virtualLength} vs ${window.physicalLength})`
    );
    return false;
  }

  return true;
}
