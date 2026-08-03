## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.

## 2026-08-03 - Inline Confirmation for Destructive Actions
**Learning:** Destructive UI actions like deleting a saved test were executing immediately without confirmation, risking accidental data loss. System modal dialogs (`window.confirm`) can feel jarring. Inline confirmations (transforming the button to a 'Sure?' prompt) provide a smoother, less intrusive safety net.
**Action:** Prefer implementing inline confirmation states with timeouts for destructive actions over immediate execution or intrusive system modal dialogs to balance safety and smooth UX.
