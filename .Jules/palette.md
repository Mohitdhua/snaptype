## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.
## 2023-11-20 - Inline Confirmations over Modals
**Learning:** For frequent destructive actions in a list (like deleting saved tests), native `window.confirm` dialogs break the user flow significantly and feel jarring in modern web apps. Inline confirmation buttons that prompt "Sure?" on the first click and require a second click are much more fluid and less intrusive while still preventing accidental clicks.
**Action:** Replace native `window.confirm` with `ConfirmDeleteButton` pattern using `setTimeout` for timed resets in lists and similar layouts.
