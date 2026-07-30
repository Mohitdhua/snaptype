## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.
## 2024-03-24 - Replaced System Modals with Inline Confirmations
**Learning:** System modal dialogs (`window.confirm`) break the immersive experience of the dark mode glassmorphism UI by delegating rendering back to the browser's native OS styling, which often feels abrupt and disjointed.
**Action:** Use inline confirmation states (e.g., transforming the trash icon into a "Sure?" button with a timeout) for destructive actions to keep users within the application context and maintain design system consistency.
