# React IFC Viewer Flaw Report

This review captures the main issues currently holding the project back and how to address them. Tackle the items in order of impact to regain maintainability and predictable performance.

## Flaw 1 – Monolithic viewer component

`src/components/ifc-viewer/ifc-viewer.tsx` is almost 1,000 lines long and mixes loading, rendering, selection, overlays, camera control, and global state wiring. The size makes reasoning, testing, and future changes risky, which contradicts the Single Responsibility Principle.

**Fix:** Split the viewer into dedicated modules: a headless hook for loading and selection state, smaller focused components (camera controls, overlay manager, material state machine), and utility services. Aim to keep each file under 300 lines and write integration tests for the extracted pieces.

## Flaw 2 – Anchor updates run every frame

`animate()` calls `updateAnchors()` on every RAF tick. With many markers this recalculates world positions thousands of times per second even when the camera is idle, wasting CPU and throttling large IFCs.

**Fix:** Trigger anchor recomputation only when the camera moves, the renderer resizes, or marker links change. Use `OrbitControls` events (`change`, `start`, `end`) plus a lightweight throttle so anchors update at most ~30 Hz during interaction.

## Flaw 3 – O(n²) key lookup for marker anchors

`updateAnchors()` builds React keys with `ifcMarkerLinks.indexOf(ifcMarkerLink)` inside a `for…of`. Every iteration scans the entire array, so 2,000 markers trigger ~2 million comparisons.

**Fix:** Iterate with an indexed loop or maintain a pre-computed `id` on each marker link. Example: `for (let index = 0; index < ifcMarkerLinks.length; index += 1)` and reuse `index` directly as the key.

## Flaw 4 – README is out of date

The README still warns that instanced meshes are “not yet implemented,” contradicting the current release and confusing adopters.

**Fix:** Refresh the README to document the instanced rendering pipeline, updated performance characteristics, and any migration notes. Include a changelog note referencing v0.7.0.

## Flaw 5 – Lint script ignores failures

`"lint": "tsc & eslint ./src/**/*.{ts,tsx} --fix"` runs ESLint even if the type check fails and auto-fixes code during CI, hiding issues and creating noisy diffs.

**Fix:** Replace the script with `"lint": "tsc && eslint ./src --ext .ts,.tsx"` and reserve `--fix` for a separate `lint:fix` task that developers run locally.

## Flaw 6 – Sparse automated tests

Vitest only runs two suites, reaching ~34 % statement coverage and leaving the viewer, hooks, and material state transitions untested.

**Fix:** Add component tests for `IfcViewer` (interaction, selection, overlays), state hooks, and the material state machine using `@testing-library/react` plus mocked `IfcModel`. Use vitest snapshots or scenes saved in fixtures to validate camera utilities.
