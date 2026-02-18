# SnapType Performance Hardening TODO

- [x] Remove interval reset risk in digital typing loop by stabilizing callback refs.
- [x] Replace per-render Levenshtein with linear mismatch checks for live stats.
- [x] Keep Levenshtein only for final submission scoring.
- [x] Guard localStorage writes against private-mode/quota failures.
- [x] Replace hot-path DOM `getElementById` caret lookup with direct character refs.
- [x] Reduce physical-mode timer repaint frequency from 100ms to 250ms.
- [x] Optimize hard-key practice word filtering with a compiled regex.
- [x] Remove unused component prop (`showHands`) to reduce dead code.
- [x] Replace API route `any` request/response typing with explicit local types.
- [x] Move from Tailwind CDN runtime to build-time Tailwind + PostCSS pipeline.
- [x] Introduce route-level/component-level lazy loading for heavy UI chunks.
- [x] Memoize derived lists in results view to avoid repeated sort work.
- [x] Throttle physical-mode zoom mouse tracking with requestAnimationFrame.
- [x] Split chart library into dedicated `charts-vendor` build chunk.
- [x] Validate with `npm run typecheck` and `npm run build`.
