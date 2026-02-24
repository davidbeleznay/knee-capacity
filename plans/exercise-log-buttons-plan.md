# Exercise Log Buttons — Visual Fix Plan

**Overall Progress:** 0%

## TLDR

Fix the look and feel of the exercise log form buttons (Like/Unlike, Save, Close). Current state: Like/Unlike use generic secondary-button styling with emoji + text; layout feels cluttered or inconsistent. Goal: cleaner, more intentional button design that matches the app aesthetic.

## Current State (What Exists)

- **Like/Unlike**: `exercise-like`, `exercise-dislike` — "👍 Like" and "👎 Unlike" with `.secondary-button.like-button`; `.active` when liked/disliked
- **Save**: `save-exercise` — "✅ Log Workout" with `.primary-button`
- **Close**: `close-form` — "Close" with `.secondary-button`
- **Like controls block**: `.like-controls` (label + `.like-buttons` flex row)
- **Styles**: `.like-button` (small padding), `.like-button.active` (green fill); mobile overrides in `#log-view .like-button`

## Critical Decisions

- **Scope**: Exercise log form buttons only — not tile plus buttons, not check-in buttons
- **Approach**: CSS-first (styles.css) plus minimal HTML tweaks if needed; no JS logic changes
- **Reference**: Use existing patterns from swelling-group or impact-btn for consistency

## Tasks

- [ ] 🟥 Step 1: Audit current button appearance
  - [ ] 🟥 Open exercise log form (Log → select exercise)
  - [ ] 🟥 Document what looks wrong (e.g., cramped, too small, misaligned, ugly active state)
  - [ ] 🟥 Screenshot or list specific issues for Like/Unlike and Save/Close

- [ ] 🟥 Step 2: Redesign Like/Unlike block
  - [ ] 🟥 Decide layout: icon-only (❤️/💔) vs text+emoji vs pills
  - [ ] 🟥 Update `.like-controls`, `.like-label`, `.like-buttons`, `.like-button` styles
  - [ ] 🟥 Ensure `.like-button.active` looks distinct and intentional
  - [ ] 🟥 Adjust mobile `#log-view .like-button` if needed

- [ ] 🟥 Step 3: Refine Save and Close buttons
  - [ ] 🟥 Align Save ("✅ Log Workout") with primary CTA hierarchy
  - [ ] 🟥 Ensure Close button doesn’t compete visually
  - [ ] 🟥 Apply spacing/layout so form footer feels balanced

- [ ] 🟥 Step 4: Test and iterate
  - [ ] 🟥 Verify on desktop and mobile
  - [ ] 🟥 Confirm active states for Like/Unlike still work
  - [ ] 🟥 No regressions in layout or tap targets
