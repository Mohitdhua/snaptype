## 2024-06-22 - Make Custom Toggles Accessible
**Learning:** Custom UI toggles implemented as `div` elements completely block keyboard and screen reader users from interacting with important settings.
**Action:** Always add `role="switch"`, `aria-checked`, `tabIndex={0}`, `onKeyDown` (for Enter/Space), and visible focus states (`focus-visible:ring-2`) when converting a `div` into an interactive control.
