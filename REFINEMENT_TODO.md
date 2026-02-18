# SnapType Refinement TODO

## Research Notes

- Home navigation is currently a single long screen, so users cannot quickly jump between create, saved tests, and progress areas.
- Saved tests currently force the stored mode (`gameMode`), so users cannot choose Digital vs Paper/Physical when replaying.
- `PhysicalTypingTest` supports image references, but text-only tests do not have a proper paper-style reference panel.
- Typing flow lacks personalization controls (for example text size), which limits comfort and flexibility.

## Implementation Checklist

- [x] Add clear home navigation between Create Test, Saved Tests, and Progress.
- [x] Merge and simplify mode selection terminology into Digital and Paper/Physical across upload flows.
- [x] Allow replaying saved tests in any mode with selectable time limit.
- [x] Upgrade paper mode to support both image references and text references.
- [x] Improve typing experience with dynamic controls (readability and keyboard visibility).
- [x] Run production build verification.
- [x] Launch the app locally for manual QA.
