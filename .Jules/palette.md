## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.

## 2024-05-19 - Accessible Confirmations and Hidden Input Focus
**Learning:** Found two common UX issues: (1) Destructive actions (like delete) lacked inline confirmation, requiring full modal dialogs which disrupt flow, or native window.confirms which feel jarring. (2) Hidden or opacity-0 native inputs (like file inputs over dropzones) do not show keyboard focus by default, making navigation invisible for keyboard users.
**Action:** For destructive actions, prefer inline confirmations (like a "Sure?" prompt button with a timeout). For hidden inputs, always apply `:focus-within` styles to their visible wrapper element to maintain keyboard navigation visibility.
