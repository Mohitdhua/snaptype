## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.

## 2023-10-27 - Dynamic ARIA labels for confirmation buttons
**Learning:** When changing a button's content from an icon (e.g., delete trash can) to text (e.g., "Sure?") during an inline confirmation state, the `aria-label` must also dynamically update. If the `aria-label` remains static (e.g., "Delete Test"), screen readers will not announce the state change or the new text, leaving visually impaired users unaware that a second confirmation click is required.
**Action:** Always dynamically update the `aria-label` attribute on buttons that undergo state changes to ensure the accessible name matches the new state or intent.
