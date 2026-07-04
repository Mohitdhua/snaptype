## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.

## 2024-05-19 - Focus Visibility for Hidden Inputs and Custom Buttons
**Learning:** Custom interactive elements (like the mode toggles and time limit buttons) and hidden file inputs (using `opacity-0` over a stylized dropzone) completely lack keyboard focus indicators by default. This makes keyboard navigation impossible as the user cannot see where their focus is.
**Action:** Always apply `:focus-within` styles (e.g., `focus-within:ring-2`) to the visible parent container of hidden/opacity-0 inputs. Always apply `:focus-visible` styles to custom interactive elements (buttons that don't use standard `<button>` browser styles) to restore keyboard accessibility without impacting mouse click aesthetics.
