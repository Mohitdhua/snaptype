## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.

## 2026-08-02 - Inline Delete Confirmation UX Pattern
**Learning:** Destructive actions benefit heavily from inline confirmations (e.g., swapping a button to say 'Sure?') instead of jarring system modals. This keeps the user in flow and avoids context-switching, while preventing accidental data loss.
**Action:** Use inline confirmation states with a timeout (using  for cleanup) for single-item deletion actions in lists or grids.

## 2026-08-02 - Inline Delete Confirmation UX Pattern
**Learning:** Destructive actions benefit heavily from inline confirmations (e.g., swapping a button to say 'Sure?') instead of jarring system modals. This keeps the user in flow and avoids context-switching, while preventing accidental data loss.
**Action:** Use inline confirmation states with a timeout (using useRef for cleanup) for single-item deletion actions in lists or grids.
