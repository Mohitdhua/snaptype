## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.

## 2024-07-05 - Invisible Focus on File Inputs
**Learning:** Native `<input type="file">` elements styled with `opacity-0` (to act as dropzones) completely lose visual focus indication when navigated via keyboard. This makes the interface inaccessible to keyboard-only users who can't see where their focus is.
**Action:** When hiding inputs with `opacity-0`, always delegate the focus state to a visible parent container using Tailwind's `:focus-within` variant (e.g., `focus-within:ring-2 focus-within:ring-white/50`).
