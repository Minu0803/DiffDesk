# Whole-change review brief

Scope: uncommitted changes in src/, shared/, electron/, index.html, package.json plus new scripts/test-register.cjs and tests/. Do not review or change pre-existing design document modifications as code findings. No commits authorized.

Requirements: docs/reviews/2026-10-05-partial-merge-design.md, docs/reviews/2026-10-05-before-after-motion.md, docs/reviews/2026-10-05-theme-expansion.md. User approved all implementation on 2026-10-06.

Implemented: six additional theme presets while preserving old Light/Dark/system; shared palette for CSS/Monaco/native window; synchronous preload bootstrap for first paint; explicit native radio picker; 64px reserved original-editor scrollbar lane; unchanged Monaco DiffEditor alignment and split/scroll; header boundary from public editor geometry; press-captured versioned merge requests; synchronous invalidation on edits/whitespace option change; target-only focus and native undo; fixed click slots, separately animated faces, target code glow and receipt; dense pair packing.

Review focus: layout allocation really protects line numbers and code under wrap/sash; stale diff requests and pressed controls after re-render; caret/selection/scroll behavior; busy state liveness including options/model reset; undo baseline tracking; invalid settings/native enum/bootstrap IPC/persistence; theme menu keyboard/focus; CSS clipping, theme contrast, reduced motion; production packaging and existing file flows. Judge reasonable user expectations, not only literal spec. Report concrete Critical/Important/Minor with file/line and declined-to-judge list. Read-only, do not dispatch agents.

Ledger: docs/implementation/2026-10-06-design-themes-progress.md contains implementation rulings. Worktree denied writes; source edits remain in authorized checkout and uncommitted. Tests 9/9, renderer/Electron typechecks passing. Actual browser: width1024/960, native code area558px, lane64px, button/line-number overlap0; one chunk apply→target undo restores original diff count. More UI checks are underway, so do not infer unmeasured frame rates or Windows scale results.
