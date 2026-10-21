## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.
## 2024-03-24 - Hidden Input Focus States
**Learning:** When using an `<input type="file" className="opacity-0">` overlaid on a custom styled `div` dropzone, keyboard focus is completely lost visually because the focused element is transparent. Screen readers may announce it, but sighted keyboard users are lost.
**Action:** Always apply `focus-within:ring-2` (and associated focus styles) to the visible *parent* container (the custom dropzone `div`) of any hidden or opacity-0 input element to ensure keyboard accessibility.
