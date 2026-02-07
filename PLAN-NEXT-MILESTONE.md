# Feature Implementation Plan: Next Milestone Progress
**Overall Progress:** 100%

## TLDR
Add a "Next Milestone" progress indicator to the home streak card: show the next milestone (e.g. Day 14 — Two Weeks), a progress bar (percentage toward that day), and days remaining. Uses existing streak + milestone data; no new APIs.

## Critical Decisions
- **Reuse `getNextMilestone(currentStreak)`** from `milestones.js` for next target; progress % = (currentStreak / nextDay) × 100.
- **Single container:** Reuse `#home-streak-progress`; inject bar HTML when there is a next milestone, plain text when max or zero.
- **Milestone set:** Day 3 (Spark), 7 (One Week), 10, 14 (Two Weeks), 21 (Three Weeks), 30 (One Month), 50, 75, 100.

## Tasks
- [x] 🟩 Step 1: Milestone data
  - [x] 🟩 Add 50, 75, 100 to `STREAK_MILESTONES` in `milestones.js`
  - [x] 🟩 Align titles: Spark, One Week, Two Weeks, Three Weeks, One Month
- [x] 🟩 Step 2: Progress bar UI logic
  - [x] 🟩 In `renderStreakProgress(containerId)` (helpers.js), when next milestone exists: build label + bar + meta HTML and set on container
  - [x] 🟩 When at max or zero: keep existing text-only copy
- [x] 🟩 Step 3: Styling
  - [x] 🟩 Add CSS for `.next-milestone-wrap`, `.next-milestone-bar`, `.next-milestone-fill`, `.next-milestone-meta` under `.streak-card-large`
- [x] 🟩 Step 4: Bundle and verify
  - [x] 🟩 Rebuild `app.bundle.js`; confirm home and KCI streak progress both show the bar when applicable
