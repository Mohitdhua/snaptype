## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.

## 2024-05-19 - Accessible Names for App and Theme Switchers
**Learning:** Found critical app-level controls (SnapSpell switcher and Theme toggle) presented as icon-only buttons on mobile viewports without any accessible names or tooltips. This prevents screen reader users from understanding what the buttons do, and blocks sighted users from getting hover text clarification.
**Action:** Always add `aria-label` (for screen readers) and `title` (for mouse hover) attributes to any button that uses only emojis or icons for its visual label.
