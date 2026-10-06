# Execution ledger — plan: docs/reviews/2026-10-05-theme-expansion.md

Authority: user approved implementation on 2026-10-06. Commit permission remains separate.

Tasks: 1 theme/settings compatibility; 2 dedicated merge lane and stale request protection; 3 product chrome/motion/theme picker; 4 build, real Monaco flows and whole-change review.

Baseline: renderer and Electron TypeScript checks pass. No existing automated test command. Product source clean; existing review documents are preserved.

Ruling: managed worktree created but writing is denied by sandbox — implement in the user-authorized workspace without Git metadata changes — changes remain uncommitted for review.

Pre-flight: theme palette feeds CSS, Monaco and Electron startup; new preset stays separate from native system/light/dark. Merge lane geometry feeds header boundary and versioned button requests. Model edits must invalidate requests synchronously before asynchronous diff updates.

Ruling: test public original-editor scrollbar reservation for the dedicated 64px lane before structural engine changes — supported layout space preserves DiffEditor alignment and synchronized scrolling — if reservation fails, do not overlay code/line numbers.

Task 1: theme resolution, malformed-preset fallback, native theme enum and settings persistence RED→GREEN; Monaco preset palette test RED→GREEN; suite 9/9.

Task 2: dense packing and either-model version invalidation RED→GREEN. Requests captured on press, content events invalidate synchronously. Actual layout validation in progress.

Ruling: ITextModel does not expose canUndo in the installed public API — derive toolbar availability from the alternative version at each load/reset baseline — native Monaco undo remains authoritative.

Task 3: six themes and existing options, keyboard radio picker, compact chrome, fixed hitboxes and animated faces connected. Renderer and Electron typechecks pass. Actual Monaco at1024/960:64px lane, line-number/button overlap0, code558px; one-block application and native target undo verified.

Final review: independent read-only review found two Important issues (late worker result freshness; visible continuation of long blocks) and one Minor (reselecting current theme does not close). No Critical issues.

Final: fixed long-block continuation — viewport-intersection regression RED→GREEN.
Final: fixed stale worker approval — fresh session invalidation and coalescing regressions RED→GREEN. Use public createViewModel/setModel with the same text models; invalidate before Monaco's own listeners and associate each attached computation with captured versions. Full suite12/12.
Ruling: use public diff view-model renewal after a100ms stable interval rather than trusting onDidUpdateDiff as a worker completion version guarantee — installed0.52.2 can publish older in-flight results — cost is diff recomputation; text models/editors and undo persist.
Ruling: finish current-theme pointer confirmation as part of the approved selection flow — small UI correction required for usable selection, verified live rather than a source-mirroring test.

Final reviewer declined live Windows scale, native first paint/relaunch, packaging, FPS, full language contrast and unchanged file protection. Ruling: validate native launch/packaging and representative scaling now; report unmeasured FPS and exhaustive language contrast rather than claiming certification. Existing unrelated file guards remain out of this design/theme scope.

Final: viewport-edge packing regression RED→GREEN; compare clamped desired anchors when deciding compact targets. Suite13/13. Native100/125/150 and minimum/reduced-motion checks pass with64px lane, line-number overlap0 and toolbar overflow0.
Final: live whole-copy regression reproduced wrong undo target; focus affected editor after copy. Both copy directions now undo back to5differences in the actual Monaco UI. Renderer/Electron typechecks and suite13/13 pass after correction.
Ruling: exclude generated build/release paths from the dev watcher — locked packaging temporary files caused EBUSY and unwanted reloads — keep product runtime unchanged and use a fresh clean tab for final validation.
Ruling: hidden QA window omitted composited merge controls from capture — capture through a transparent, inactive QA window and assert painted arrow pixels — production window behavior is unchanged; this is not evidence of an operating-window rendering defect.
Final: designer agent reviewed actual Deep Dark screenshot; no important visual deviation. Final native startup colors match saved Deep Dark/GitHub Light presets. FPS, every language-state contrast and multi-monitor OS DPI transition remain unmeasured and are documented in the result report.
Final: final renderer build and Windows portable packaging exit0. ASAR comparison matches all101renderer/Electron build files, QA scripts excluded. Final artifact SHA-256:0b84a4bcfbc6a203507ba162557ef38e15f858c7c02e8b07de51d2892f40d695. No commit, index or branch changes performed.
