## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.
## 2026-07-22 - Focus Visibility for Hidden Inputs
**Learning:** When using an invisible file input (`opacity-0`) spread over a styled dropzone, standard focus outlines are hidden or clipped. Applying `focus-within` to the visible parent container ensures keyboard users see when the dropzone is focused, adhering to WCAG 2.4.7 (Focus Visible) without breaking the custom styling.
**Action:** Always apply `:focus-within` styles to the visual container wrapping a visually hidden but functionally interactive element like a file input.
