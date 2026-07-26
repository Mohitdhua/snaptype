## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.
## 2023-10-26 - Inline Destructive Confirmation & Focus Management
**Learning:** For destructive actions (like deleting items) within lists/grids, inline confirmation states (transforming to "Sure?" with a timeout) are significantly less disruptive to workflow than full modal dialogs while still preventing accidental data loss. Furthermore, adding explicit `focus-visible` states to all interactive custom elements (like mode switches and delete buttons) ensures consistent keyboard navigation accessibility.
**Action:** When working on lists with destructive actions, prefer inline confirmation patterns (e.g. timeout-based button transformations) over modals. Always ensure `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stitch-dark` is applied to non-standard interactive elements.
