## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.

## 2026-07-01 - Hidden Inputs Keyboard Focus Visibility
**Learning:** Found an `opacity-0` file input for image uploads where the parent container visually represented the input. Because the actual input was hidden, it lost visible keyboard focus indicators, making it un-navigable via keyboard without visual feedback.
**Action:** When implementing hidden or `opacity-0` inputs (like file dropzones), always apply `:focus-within` styles (e.g., `focus-within:ring-2`) to the visible parent container to maintain keyboard focus visibility.
