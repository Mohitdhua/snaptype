## 2026-06-29 - High-Frequency Re-rendering in Typing Loops

**Learning:** The `TypingTest` component experiences severe rendering overhead because it recalculates a sliding token window (O(N) operation over thousands of tokens) and updates a 1-second interval state *at the top level of the component*. This forces the entire massive text DOM tree to re-render every second and on every keypress.

**Action:** When building live-typing or real-time progress components, strictly isolate high-frequency state updates (like timers or mismatch counters) into small child components or use refs/direct DOM manipulation to prevent full tree re-renders.
