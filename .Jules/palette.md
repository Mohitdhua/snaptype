## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.

## 2023-10-27 - Inline Confirmation for Destructive Actions
**Learning:** Native `window.confirm` dialogs are disruptive to the user flow, especially for frequent or list-based actions like deleting an item. They take the user out of the context of the UI and feel disjointed.
**Action:** Implemented inline confirmation for deleting saved tests. The delete button now transforms into a "Sure?" prompt with a 3-second timeout, keeping the interaction contextual and smooth while still preventing accidental deletions. The inline state also includes updated ARIA labels and focus rings for accessibility.
