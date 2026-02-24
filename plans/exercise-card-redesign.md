# Feature Implementation Plan: Exercise Card Redesign (Option C)
**Overall Progress:** 0%

## TLDR
Refactor the exercise list from a cramped grid into a "Action Hybrid" list view. Each item will be a row with exercise details on the left and a prominent "Log" button on the right for quick access.

## Critical Decisions
- **Layout:** Switch from 2-column grid to single-column list (stack) for better mobile readability.
- **Interaction:** Split click targets:
  - **Card Body:** Expands to show details/instructions (Accordion style).
  - **"Log" Button:** Immediately opens the logging form (Speed action).
- **Visuals:** Clean white rows with left border indicating category/phase.

## Tasks
- [ ] 🟥 Step 1: CSS Architecture for List View
  - [ ] 🟥 Update `.exercise-tiles` container to use flex-column/stack layout instead of grid.
  - [ ] 🟥 Create new `.exercise-row` styles: flex layout, alignment, padding.
  - [ ] 🟥 Design the `.log-action-btn` (pill shape, high contrast).
  - [ ] 🟥 Style the expanded details section to sit comfortably within the list flow.

- [ ] 🟥 Step 2: Component Implementation (JS)
  - [ ] 🟥 Rewrite `renderExerciseTiles` in `workouts.js` to generate the new HTML structure.
  - [ ] 🟥 Implement the split-action logic:
    - `onclick` on container toggles expansion.
    - `onclick` on Log button calls `selectExerciseForLogging` (stopping propagation).
  - [ ] 🟥 Ensure "NEW" badges and Category labels are positioned correctly in the row layout.

- [ ] 🟥 Step 3: Mobile Optimization & Polish
  - [ ] 🟥 Verify tap targets are >44px.
  - [ ] 🟥 Handle text wrapping for long exercise names.
  - [ ] 🟥 Clean up old grid-specific CSS.
