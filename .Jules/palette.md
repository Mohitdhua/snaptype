## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.

## 2024-06-24 - Dropzones and Opacity-0 Inputs Trap Focus Invisibly
**Learning:** Found that our file dropzone implementation used an `<input type="file" opacity="0">` overlay. When users navigate with the keyboard, focus lands on this hidden input, but because it is invisible, the user sees no focus indicator. They appear to be "lost".
**Action:** Always apply `:focus-within` styles to the visible container of a hidden/opacity-0 input (like `focus-within:ring-2` in Tailwind) so the user gets visual feedback when the hidden interactive element receives keyboard focus.
