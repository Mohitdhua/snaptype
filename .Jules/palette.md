## 2026-06-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Close Reference, Toggle Sound, Delete Test) and unlabelled file inputs were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without hover tooltips. This is a common pattern in the app's components.
**Action:** Always ensure functional icons and hidden inputs have descriptive `aria-label` attributes and, where appropriate, `title` attributes for visual hover text.

## 2024-05-18 - Make Power-User Features Discoverable
**Learning:** Found existing keyboard shortcuts (Ctrl+Enter, Esc) in the TypingTest component that were completely invisible to users. Power-user features only provide UX value if users know they exist.
**Action:** Added subtle visual `<kbd>` hints directly into the relevant action buttons ("Submit" and "Back"). Next time, ensure keyboard shortcuts are visibly documented in the UI as they are implemented, especially for frequent/core interaction loops like completing a typing test.

## 2024-05-19 - Missing Focus States on Custom Interactive Elements
**Learning:** Found multiple custom buttons (input mode tabs, typing mode options, time limit options) and a file dropzone without keyboard focus indicators in `ImageUploader.tsx`. Users relying on keyboard navigation wouldn't know which element was focused.
**Action:** Always add `focus-visible:ring-2 focus-visible:outline-none` (and `focus-within` for hidden inputs within visual containers) to interactive elements that aren't native `<button>` or `<input>` tags, or when overriding default styles to ensure keyboard accessibility.
