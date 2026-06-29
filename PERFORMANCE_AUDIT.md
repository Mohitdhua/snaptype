# Executive Summary
The codebase exhibits good overall performance hygiene, particularly after the recent 'Performance Hardening' items from `PERFORMANCE_TODO.md` were addressed. Most components are well-memoized, chart libraries are code-split, and state updates are somewhat optimized. However, given the high-frequency nature of the `TypingTest` component (which handles keystroke-level updates and real-time statistics), there are several critical areas where React rendering and computation overhead can be significantly reduced to ensure a buttery-smooth 60fps experience even on lower-end devices or with large texts.

---

# Top Performance Bottlenecks

| Rank | Area | Severity | Estimated Impact | Difficulty | ROI |
| ---- | ---- | -------- | ---------------- | ---------- | --- |
| 1 | `TypingTest.tsx`: Full-document rendering | High | Render CPU (-80%) | Medium | High |
| 2 | `Results.tsx`: Missing Chart data memoization | Medium | Render CPU (-30%) | Low | High |
| 3 | `PhysicalTypingTest.tsx`: Diff calculation | Medium | CPU spikes during test | Medium | Medium |
| 4 | `App.tsx`: `prepareTextForGame` string manipulation | Low | Memory pressure (-50%) | Low | Medium |
| 5 | `TypingTest.tsx`: Timer tick re-rendering | Medium | Render CPU (-40%) | Medium | High |
| 6 | `SavedTestsList.tsx`: Image rendering | Low | Network/Memory | Low | High |
| 7 | `Results.tsx`: `sameTestHistory` derived state | Low | CPU overhead | Low | High |
| 8 | `TypingTest.tsx`: `handleInputChange` mismatch calc | Low | CPU overhead | Low | Medium |
| 9 | `api/extract-text.ts`: Large payload base64 splitting | Low | Memory/CPU | Low | Medium |
| 10 | `storageService.ts`: Synchronous LocalStorage | Low | Main thread blocking | Medium | Low |

---

# Detailed Findings

## 1. Full-document rendering in `TypingTest.tsx`
* **Problem:** While `windowedTokens` creates a sliding window of tokens to render, it still relies on splitting the *entire* target text into tokens and filtering them on *every keystroke* when `currIndex` changes.
* **Root Cause:** The `windowedTokens` calculation scales with O(N) where N is the total token count of the document, running on every keypress.
* **Performance Impact:** For large texts, slicing and filtering arrays of thousands of tokens per keystroke causes rendering lag.
* **Possible Fixes:**
  1. Virtualize the text rendering using a dedicated virtualization library (e.g., `react-window`).
  2. Maintain a shifting pointer window instead of full array filtering.
* **Recommended Fix:** Implement true virtualization or a highly optimized sliding slice logic that avoids traversing the entire token array.
* **Risks:** Breaking the layout of the text flow or the floating caret calculation.
* **Risk Mitigation:** Add unit tests for the tokenization slicing bounds.
* **Estimated Improvement:** Drastic reduction in CPU time per keystroke for large texts.
* **Confidence Level:** High
* **Implementation Difficulty:** Medium

## 2. Missing Chart data memoization in `Results.tsx`
* **Problem:** The `sessionChartData` is memoized, but `sameTestHistory` filtering happens on every render if `results.testId` exists.
* **Root Cause:** `sameTestHistory` fetches `getHistory()` (which reads from localStorage) and filters it directly inside `useMemo`. `getHistory` itself parses JSON synchronously.
* **Performance Impact:** Every render of `Results` blocks the main thread to parse JSON from localStorage.
* **Possible Fixes:** Cache the `getHistory()` result globally or lift the history state completely to `App.tsx` and pass it down as a prop.
* **Recommended Fix:** The `history` is already loaded in `App.tsx` and passed around. Pass `history` as a prop to `Results.tsx` to avoid redundant localStorage parsing.
* **Risks:** Stale history data if updated elsewhere.
* **Risk Mitigation:** `App.tsx` is the source of truth for `history`; passing it down guarantees synchronization.
* **Estimated Improvement:** Eliminates a synchronous disk read/parse per render.
* **Confidence Level:** High
* **Implementation Difficulty:** Low

## 3. Costly Diff Calculation in `PhysicalTypingTest.tsx`
* **Problem:** In `finishTest`, `levenshteinDistance` is calculated over potentially the entire document.
* **Root Cause:** Levenshtein distance is O(N*M). For a 10-minute typing test, this could be comparing arrays of thousands of characters.
* **Performance Impact:** The main thread can lock up for several milliseconds to seconds when finishing a long test.
* **Possible Fixes:** Web Worker for diffing, or chunked/batched Levenshtein calculation.
* **Recommended Fix:** Offload the `levenshteinDistance` calculation to a Web Worker to keep the UI responsive, possibly showing a "Calculating Results..." spinner.
* **Risks:** Asynchronous test completion logic might complicate the UI state machine.
* **Risk Mitigation:** Introduce an `isScoring` state to disable buttons during calculation.
* **Estimated Improvement:** Prevents UI freeze on test completion.
* **Confidence Level:** High
* **Implementation Difficulty:** Medium

## 4. `prepareTextForGame` string manipulation in `App.tsx`
* **Problem:** `prepareTextForGame` concatenates large strings in a loop to meet the time limit requirements.
* **Root Cause:** String concatenation in JS creates new string objects in memory. For a 10-minute test requiring a massive string, this causes memory churn.
* **Performance Impact:** Memory spikes and potential garbage collection pauses when starting a long test.
* **Possible Fixes:** Use an array `join` method or dynamically repeat the string contextually during rendering instead of building one massive string upfront.
* **Recommended Fix:** `rawText + ('\n\n' + rawText).repeat(repeats)` is used, which is generally optimized by engines, but generating massive strings upfront isn't ideal. A better approach is looping the text visually or generating chunks on demand.
* **Risks:** Breaking the boundary logic of the typing test window.
* **Risk Mitigation:** Ensure chunk generation logic accurately maps character indices.
* **Estimated Improvement:** Lower memory footprint.
* **Confidence Level:** Medium
* **Implementation Difficulty:** Low

## 5. Timer tick re-rendering in `TypingTest.tsx`
* **Problem:** The `setTick(t => t + 1)` interval forces the entire `TypingTest` component to re-render every second to update the timer and live stats.
* **Root Cause:** The interval is defined in the top-level `useEffect` of the component.
* **Performance Impact:** Unnecessary re-rendering of the massive text area just to update the timer header.
* **Possible Fixes:** Extract the timer and live stats into a separate child component that receives `startTime` and a stats callback, isolating the re-renders.
* **Recommended Fix:** Create a `<StatsHeader>` component that manages its own 1-second interval to pull live stats via a ref or callback, preventing the text container from re-rendering.
* **Risks:** Out-of-sync stats display if the callback isn't stable.
* **Risk Mitigation:** Use stable refs for the current input state.
* **Estimated Improvement:** Eliminates 1 render per second of the heaviest DOM element in the app.
* **Confidence Level:** High
* **Implementation Difficulty:** Medium

## 6. Unoptimized Image rendering in `SavedTestsList.tsx`
* **Problem:** Saved tests render base64 images directly in the `<img src={test.imageSrc}>` tag without lazy loading.
* **Root Cause:** Base64 strings can be massive. Loading dozens of them simultaneously blocks rendering and spikes memory.
* **Performance Impact:** Lag when opening the "Library" tab if many images are saved.
* **Possible Fixes:** Add `loading="lazy"` to the `<img>` tag. Alternatively, generate and save smaller thumbnails.
* **Recommended Fix:** Add `loading="lazy"` attribute.
* **Risks:** None.
* **Risk Mitigation:** Native browser feature.
* **Estimated Improvement:** Faster render time for the Library tab.
* **Confidence Level:** High
* **Implementation Difficulty:** Low

## 7. `sameTestHistory` derived state overhead
* **Problem:** (Addressed in point #2, combining history filtering fixes).

## 8. `handleInputChange` mismatch calc in `TypingTest.tsx`
* **Problem:** The linear mismatch calculation iterates over strings manually character by character.
* **Root Cause:** While O(N), doing this on every keystroke in JS is slightly inefficient compared to localized diffing based on the single new/deleted character.
* **Performance Impact:** Negligible for small inputs, but adds up for massive tests.
* **Possible Fixes:** Only check the differential (the character added or removed) instead of recounting linear errors from `0` when conditions aren't met.
* **Recommended Fix:** Refine the fallback `countLinearMismatches` to only happen when pasting bulk text, using differential updates for single keystrokes.
* **Risks:** Incorrect error counts.
* **Risk Mitigation:** Extensive unit testing of typing edge cases (backspace, paste, select-all-delete).
* **Estimated Improvement:** Minor CPU reduction per keystroke.
* **Confidence Level:** Medium
* **Implementation Difficulty:** Low

## 9. Large payload splitting in `extract-text.ts`
* **Problem:** `base64Image.split(",")[1]` creates a full copy of the massive base64 string in memory.
* **Root Cause:** `split` allocates arrays and new strings.
* **Performance Impact:** Memory spikes on the Node/Vercel server when processing high-res images.
* **Possible Fixes:** Find the index of `,` and use `substring()`.
* **Recommended Fix:** `base64Image.substring(base64Image.indexOf(",") + 1)`
* **Risks:** Negligible.
* **Risk Mitigation:** Ensure comma exists or handle graceful fallback.
* **Estimated Improvement:** ~50% reduction in memory allocation for image parsing.
* **Confidence Level:** High
* **Implementation Difficulty:** Low

## 10. Synchronous LocalStorage in `storageService.ts`
* **Problem:** `localStorage.setItem` and `getItem` with large JSON blobs (history, stats) run synchronously on the main thread.
* **Root Cause:** Standard Web Storage API limitations.
* **Performance Impact:** Micro-stutters when saving tests or finishing sessions.
* **Possible Fixes:** Migrate to IndexedDB using a wrapper like `idb-keyval`.
* **Recommended Fix:** Replace `localStorage` with `IndexedDB` for `snaptype_history_v1` and `snaptype_saved_tests_v1` which can grow unbounded.
* **Risks:** Data migration logic required. Asynchronous API means updating React state patterns.
* **Risk Mitigation:** Write a robust migration script that runs on startup.
* **Estimated Improvement:** Zero main-thread blocking for storage IO.
* **Confidence Level:** Medium
* **Implementation Difficulty:** Medium

---

# Quick Wins
* Add `loading="lazy"` to images in `SavedTestsList.tsx`.
* Pass `history` down as a prop to `Results.tsx` to avoid synchronous localStorage reads.
* Use `substring` instead of `split` in `extract-text.ts`.

# Medium-Term Improvements
* Isolate timer state into a `<StatsHeader>` to prevent `TypingTest` full re-renders.
* Move Levenshtein distance calculations to a Web Worker.

# Long-Term Improvements
* Migrate storage from `localStorage` to `IndexedDB`.
* Implement true virtualization for the typing token array.

---

# Optimization Roadmap
* **Phase 1 — Highest ROI:** Quick wins (Lazy images, prop drilling history, substring fix).
* **Phase 2 — Medium ROI:** Timer state isolation and Web Worker for diffs.
* **Phase 3 — Long-term architectural improvements:** IndexedDB migration and virtualization.

---

# Final Assessment
* **Biggest bottleneck:** Synchronous `levenshteinDistance` for long physical typing tests and full component re-rendering every 1s for the timer.
* **Highest ROI optimization:** Isolating the timer tick to a sub-component.
* **Highest risk optimization:** Migrating from localStorage to IndexedDB.
* **Quickest measurable improvement:** Adding `loading="lazy"` to saved test images.
