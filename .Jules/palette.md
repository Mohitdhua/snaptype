## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.

## 2023-10-25 - Focus Visibility on Hidden Inputs
**Learning:** Found hidden `<input>` and `<textarea>` elements with `opacity-0` that receive keyboard focus but provide no visual feedback, leaving keyboard users lost. This happened in the ImageUploader dropzone and TypingTest container.
**Action:** Always apply `:focus-within` styles (e.g., `focus-within:ring-2`) to the visible parent container of any hidden input to maintain clear keyboard focus visibility.
