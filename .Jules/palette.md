## 2025-02-28 - Focus Visibility for Hidden Inputs
**Learning:** The application uses visually hidden file inputs (e.g., `opacity-0` inside a dropzone). Because the input itself is invisible, keyboard users tabbing through the interface receive no visual feedback that the file input has focus. This violates accessibility guidelines for focus visibility.
**Action:** When implementing hidden or opacity-0 inputs (like file dropzones), always apply `:focus-within` styles (e.g., `focus-within:ring-2 focus-within:ring-white/50 focus-within:border-transparent`) to the visible parent container to maintain keyboard focus visibility.

## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.
