## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.

## 2026-06-23 - Focus Rings on Hidden Inputs and Custom Buttons
**Learning:** Interactive elements styled away from their native appearance (like an `opacity-0` file input covering a dropzone, or custom styled `<button>`s) easily lose their default focus rings, leaving keyboard navigators blind to their active state.
**Action:** Always verify keyboard tabbing. Apply `:focus-within` styles to the visible parent container of hidden/opacity-0 inputs, and `:focus-visible` styles to custom interactive elements to ensure clear, accessible focus states.
