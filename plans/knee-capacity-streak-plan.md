# Knee Capacity — Streak System Implementation Plan

## TLDR
Fix the storage layer first so streak/exercise data can't be silently wiped, THEN add Duolingo-style milestones, badges, and grace tokens. Non-negotiable order.

## Current State
- Clean working commit deployed to Netlify
- Streak system exists but is fragile — touching it causes data loss
- Root cause: storage layer treats "missing key" as "empty array" and writes it back permanently
- Dual source of truth for streaks (stored value vs recomputed from logs) creates cascade failures

## Root Cause (Plain English)
When the app starts, if it can't find your exercise logs in storage (for ANY reason — new device, cleared cache, private browsing, parse error), it writes an empty array `[]` back to storage. That empty array then triggers the streak recompute, which sees zero exercises and sets your streak to 0. Your real data is now overwritten with nothing.

This is why every time you try to add streak features, things break — the new code changes how data is read/written, and any hiccup triggers the "missing → empty → overwrite → zero" cascade.

## Critical Decisions
1. **Fix storage BEFORE adding features** — no exceptions
2. **Streak state is authoritative** — streakCount + lastStreakDate are the truth, not recomputed from logs
3. **Missing ≠ empty** — the app must distinguish "never been set" from "set to empty" from "read failed"
4. **Never overwrite on failure** — if a read fails, do NOT write defaults back
5. **Test each phase before moving to next** — verify with your actual device/browser

---

## PHASE 1: PATCH THE DAM (Storage Hardening)
**Goal:** Make it impossible for missing/corrupt data to cascade into data loss.
**Estimated effort:** One focused Cursor session (2-3 hours)
**Success criteria:** You can clear localStorage, reload the app, and nothing crashes or overwrites.

### Task 1.1: Diagnose current storage state
**Status:** [ ] Not started
**What:** Read-only audit of what's in localStorage right now on your device.
**Why:** Confirm what data exists before changing anything.

```
CURSOR PROMPT:

I need a read-only diagnostic of the current storage state. 

Search the codebase and identify every localStorage key used by the app.
For each key, document:
- Key name
- What data it stores
- Where it's read from (which files/functions)
- Where it's written to (which files/functions)
- What happens if the key is missing (null)
- What happens if the value is invalid JSON

Output a summary table. Do NOT modify any code.
```

**Checkpoint:** You should now have a complete map of every storage key and its read/write behavior.

---

### Task 1.2: Make storage reads return status (missing vs empty vs error)
**Status:** [ ] Not started
**What:** Refactor the storage utility so callers can distinguish between "key doesn't exist," "key exists with valid data," and "key exists but parse failed."
**Why:** Right now, all three cases return the same thing (empty default), which is why data gets overwritten.

```
CURSOR PROMPT:

Refactor the storage get/read layer so it returns a status object instead of just the value.

The return should distinguish:
- "missing": key does not exist in localStorage
- "ok": key exists and parsed successfully (includes the parsed value)
- "error": key exists but JSON.parse failed (includes the raw string)

Implement this as a wrapper around the existing storage.get or localStorage.getItem.

Update ALL call sites that read from storage to use this new return type.
Call sites should compile but behavior should NOT change yet — just update the types.

Do NOT change any write behavior.
Do NOT change what happens when data is missing — we'll fix that in the next step.
```

**Checkpoint:** App still works exactly as before, but now we CAN distinguish missing from empty from error.

---

### Task 1.3: Remove ALL destructive init writes
**Status:** [ ] Not started  
**What:** Find and remove every place where the app writes empty defaults when a key is missing.
**Why:** This is THE bug. This is what kills your data.

```
CURSOR PROMPT:

CRITICAL FIX: Remove all destructive initialization writes.

Search the entire codebase for this pattern (in any form):
  if (localStorage.getItem(KEY) === null) { 
    storage.set(KEY, [])  // or {} or 0 or any default
  }

This pattern exists for exerciseLogs and likely for:
- bodyMeasurements
- significantEvents  
- streak / streakCount
- any other user data keys

For EVERY instance found:
- Remove the write-on-missing behavior
- Instead, treat missing as "uninitialized" — the key only gets created when the user first saves real data
- Ensure downstream code handles missing gracefully (returns safe empty values for rendering but does NOT persist them)

List every instance you found and changed.
```

**Checkpoint:** Clear localStorage completely, reload the app. It should NOT write any empty arrays or defaults. All screens should render empty states without crashing.

---

### Task 1.4: Fix streak to never auto-recompute to zero
**Status:** [ ] Not started
**What:** Remove the "dual source of truth" for streaks.
**Why:** When lastStreakDate is missing, the app recomputes streak from exercise logs. If logs are also missing (due to Task 1.3's bug), streak gets set to 0 and written back permanently.

```
CURSOR PROMPT:

Fix the streak "dual source of truth" problem.

Current behavior:
- If lastStreakDate exists: use stored streakCount (good)
- If lastStreakDate is missing: call updateStreak() which recomputes from exercise logs (dangerous)
- If exercise logs are also missing/empty: updateStreak() writes streak=0 (catastrophic)

New behavior:
- If streak keys exist (streakCount AND lastStreakDate): use them. Period.
- If lastStreakDate is missing but streakCount exists: preserve streakCount, do NOT recompute
- If both are missing: show streak as 0 but do NOT write anything to storage
- NEVER call updateStreak() automatically on app startup
- updateStreak() should ONLY run if explicitly triggered AND exerciseLogs status is "ok" with length > 0

Add a console warning when streak state is incomplete instead of silently recomputing.
```

**Checkpoint:** Set streakCount=10 and lastStreakDate to yesterday in localStorage manually. Clear exerciseLogs. Reload app. Streak should still show 10, NOT reset to 0.

---

### Task 1.5: Make all screens crash-proof with empty states
**Status:** [ ] Not started
**What:** Every screen that displays data must handle missing/empty gracefully.
**Why:** Even after fixing storage, screens might still crash on undefined.map() or similar.

```
CURSOR PROMPT:

Audit and fix all screens that display user data to handle missing/empty states.

Check these screens:
- Exercise log / history
- Stats / analytics
- Body measurements
- Significant events
- Streak display
- Any screen that renders lists or charts from stored data

For each screen:
- Ensure no .map() on undefined or null
- Ensure no date parsing on undefined
- Ensure no assumptions about non-empty arrays
- Add a simple empty state message (e.g., "No exercises logged yet")

Keep it minimal — no design changes, just prevent crashes.
```

**Checkpoint:** Clear ALL localStorage. Navigate to every screen in the app. Nothing should crash. Every screen should show an appropriate empty state.

---

### Task 1.6: Harden save operations + seed backups
**Status:** [ ] Not started
**What:** When saving data, verify the write succeeded. Seed backup on every successful write.
**Why:** If a write fails (quota, private mode), the in-memory data is lost on reload.

```
CURSOR PROMPT:

Harden all storage write operations.

For every function that saves user data (exercise logs, measurements, events, streaks):

1. After calling storage.set, immediately read back and verify the write succeeded
2. If the write failed:
   - Keep the in-memory data intact
   - Log a warning to console
   - Do NOT treat the save as successful
3. On every SUCCESSFUL write, also write to a backup key (e.g., exerciseLogs_backup)
4. On app startup, if primary key is missing but backup exists, restore from backup (once)

Keep the backup logic simple — just a shadow copy, not a versioning system.
```

**Checkpoint:** Your data now has a safety net. If primary storage ever gets cleared, backup can restore it.

---

### Task 1.7: Add storage health check (dev only)
**Status:** [ ] Not started
**What:** A quick diagnostic that runs on app start and logs storage status.
**Why:** So you can see immediately if something is wrong instead of discovering it after data is lost.

```
CURSOR PROMPT:

Add a dev-only storage health check that runs on app startup.

It should log to console:
- Storage available: yes/no (attempt write/read/delete of test key)
- For each data key (exerciseLogs, streak, bodyMeasurements, significantEvents, etc.):
  - Status: missing / ok / error
  - Count (if array) or summary (if object)
  - Backup status: missing / ok / error

Format it as a clean table in console.log.

Guard it behind a DEV flag or environment check so it doesn't run in production.
```

**Checkpoint:** Open console on app start. You see a clear summary of all your data. This is your early warning system.

---

### PHASE 1 VERIFICATION
Before moving to Phase 2, verify ALL of these:

- [ ] App starts without writing any empty defaults to storage
- [ ] Clearing localStorage does NOT crash any screen  
- [ ] Streak is never auto-recomputed from empty logs
- [ ] Manually set streak survives a reload even with no exercise logs
- [ ] Every screen shows an empty state instead of crashing
- [ ] Save operations are verified and backed up
- [ ] Storage health check shows clean status on startup

**If ANY of these fail, do NOT proceed to Phase 2. Fix it first.**

---

## PHASE 2: BUILD THE DECK (Duolingo-Style Streak Enhancements)
**Goal:** Make streaks feel rewarding with milestones, badges, and grace tokens.
**Estimated effort:** Two focused Cursor sessions (3-4 hours total)
**Prerequisite:** Phase 1 verification complete — ALL checkpoints pass.

### Task 2.1: Create milestone definitions (data only)
**Status:** [ ] Not started
**What:** Define milestones as pure data in a separate file. No logic yet.
**Why:** Data-driven milestones mean you can tweak rewards without touching code.

```
CURSOR PROMPT:

Create a new file for streak milestone definitions (e.g., milestones.ts or milestones.js).

Define milestones as a data array. Each milestone has:
- day: number (streak day that triggers it)
- id: string (unique identifier)
- badge: { name: string, description: string, icon: string (emoji for now) }
- rewards: { graceTokens?: number, graceTokenCap?: number }
- celebration: { title: string, subtitle: string }

MVP milestones:
- Day 3: "Spark" — "Three days in. The habit is forming." 🔥
- Day 7: "One-Week Anchor" — "A full week. You're building something real." ⚓ + unlock 1 grace token
- Day 10: "Double Digits" — "Ten days of showing up for your knees." 🎯
- Day 14: "Two-Week Tendon" — "Two weeks. Your tendons are listening." 💪
- Day 21: "Habit Groove" — "Three weeks. This is who you are now." 🧠
- Day 30: "Streak Month" — "30 days. Consistency is your superpower." 🏆 + grace token cap to 2
- Day 50: "Half Century" — "50 days. Most people quit by day 3." ⭐
- Day 75: "Tendon Transformer" — "75 days of deliberate loading." 🔄
- Day 100: "Century Club" — "100 days. You've changed the game." 💯

Also export a helper function: getNextMilestone(currentStreak) that returns the next milestone object.

This file is DATA ONLY. Do not wire it to any UI or logic yet.
```

**Checkpoint:** File exists with clean milestone data. getNextMilestone(10) returns the Day 14 milestone.

---

### Task 2.2: Add gamification state to user data
**Status:** [ ] Not started
**What:** Extend the user data model to support badges and grace tokens.
**Why:** Need somewhere to store earned badges and token balance.

```
CURSOR PROMPT:

Extend the user/gamification data model to support:

New fields (alongside existing streak data):
- graceTokens: number (current balance, default 0)
- graceTokenCap: number (max tokens user can hold, default 0 — unlocked at milestones)
- earnedBadges: string[] (array of milestone IDs that have been awarded)
- lastCelebrationShown: string | null (milestone ID of last celebration displayed)

Constraints:
- Must be backward-compatible with existing streak data
- If these fields are missing on existing users, treat as defaults (0, 0, [], null)
- Do NOT trigger any storage writes just because these fields are missing
- Follow the same safe-read pattern from Phase 1

Update the type/interface definitions.
Provide an example of what a Day 12 user's data looks like with 1 grace token earned at Day 7.
```

**Checkpoint:** Data model updated. No existing behavior changed. No storage writes triggered.

---

### Task 2.3: Implement grace token logic (streak protection)
**Status:** [ ] Not started
**What:** When a user misses a day, automatically consume a grace token instead of resetting streak.
**Why:** This is the #1 Duolingo retention mechanic — prevents rage-quits after a missed day.

```
CURSOR PROMPT:

Add grace token (streak freeze) logic to the streak evaluation.

When evaluating if a streak should continue or reset:

1. If user completed today: normal streak increment (no change to existing behavior)
2. If user missed exactly 1 day:
   - If graceTokens > 0: consume 1 token, preserve streak, log "Grace token used"
   - If graceTokens === 0: reset streak (existing behavior)
3. If user missed 2+ days: reset streak regardless of tokens (tokens only cover 1 day)

Rules:
- Grace tokens are ONLY consumed on the first app open after a missed day
- Never consume more than 1 token per gap
- Log to console when a token is consumed (so David can see it working)
- Tokens are earned through milestones (Task 2.4), not granted by default

IMPORTANT: Follow Phase 1 storage safety rules. Never write on read failure.
```

**Checkpoint:** Manually set graceTokens=1 in storage. Skip a day. Open app. Streak should be preserved and graceTokens should now be 0.

---

### Task 2.4: Wire milestone awards to daily completion
**Status:** [ ] Not started
**What:** After a successful daily check-in, check if a milestone was reached and award it.
**Why:** This is what makes Day 10 feel like something happened.

```
CURSOR PROMPT:

After a successful daily check-in increments the streak, check for milestones.

Logic:
1. After streakCount is incremented, call checkMilestones(streakCount)
2. checkMilestones looks up the milestones data file
3. If current streak matches a milestone day AND that milestone ID is NOT in earnedBadges:
   - Add milestone ID to earnedBadges
   - Apply rewards (graceTokens, graceTokenCap updates)
   - Return a celebration payload: { milestone, isNew: true }
4. If no new milestone: return null

Ensure:
- Milestones are only awarded once (check earnedBadges)
- Multiple milestones can be awarded if user somehow jumps (e.g., Day 7 missed, Day 8 awards both Day 7 and Day 3 if missing)
- Save updated gamification state following Phase 1 safe-write patterns
```

**Checkpoint:** Set streak to 6. Complete a check-in (streak becomes 7). earnedBadges should now include "anchor" and graceTokens should be 1.

---

### Task 2.5: Add celebration modal
**Status:** [ ] Not started
**What:** Show a full-screen celebration when a milestone is hit.
**Why:** The emotional payoff. This is what makes the user feel rewarded.

```
CURSOR PROMPT:

Add a celebration modal that appears when a milestone is reached.

Display:
- Badge icon (emoji for now)
- Badge name (large text)
- Celebration subtitle
- Any rewards earned (e.g., "Grace Token unlocked!")
- A "Next milestone: Day X" line with simple progress indicator
- A dismiss button

Design constraints:
- Full-screen overlay, centered content
- Simple and clean — no confetti or animations yet
- Use existing app color scheme
- Should feel like a pause/moment, not a popup ad
- Auto-dismiss after 5 seconds OR on tap

Trigger:
- Show immediately after daily completion returns a celebration payload
- Only show once per milestone (check lastCelebrationShown)
```

**Checkpoint:** Complete a check-in at a milestone day. Modal appears with correct badge info and next milestone. Dismiss works. Does NOT show again on next app open.

---

### Task 2.6: Add "next milestone" progress to home screen
**Status:** [ ] Not started
**What:** Show progress toward the next milestone on the main screen.
**Why:** Duolingo's secret weapon — visible forward momentum keeps people coming back.

```
CURSOR PROMPT:

Add a "next milestone" progress indicator to the home/check-in screen.

Display:
- Current streak count (already exists — enhance, don't replace)
- Next milestone name and day number
- Simple progress bar or text like "Day 10 of 14 — Two-Week Tendon"
- Days remaining to next milestone

Keep it minimal:
- Small section, not dominant
- Below or near the existing streak counter
- Do not redesign the home screen

Use the getNextMilestone() helper from the milestones file.
```

**Checkpoint:** Home screen shows current streak with next milestone progress. At Day 10, it shows "4 days to Two-Week Tendon."

---

### Task 2.7: Add badge shelf / earned badges display
**Status:** [ ] Not started
**What:** A place to see all badges you've earned.
**Why:** Collection motivation — seeing what you've earned and what's coming.

```
CURSOR PROMPT:

Add a simple badge display section. This could be:
- A section on the Stats screen, OR
- A new "Badges" tab or section accessible from the home screen

Show:
- All earned badges (from earnedBadges array) with icon + name + date earned
- Upcoming badges (grayed out / locked) showing what's next
- Grace token balance

Keep it very simple:
- Grid or list of badge icons
- Earned = full color, Unearned = grayed out
- No complex interactions yet

This is the "collection" that gives the streak visual depth.
```

**Checkpoint:** Badge shelf shows earned badges in color and upcoming ones grayed out. Grace token balance is visible.

---

## PHASE 2 VERIFICATION
Before shipping:

- [ ] Milestones fire at correct streak days
- [ ] Each milestone only awards once
- [ ] Grace tokens are consumed on missed days
- [ ] Celebration modal appears and dismisses correctly
- [ ] Next milestone progress is visible on home screen
- [ ] Badge shelf shows earned and upcoming badges
- [ ] ALL Phase 1 checks still pass (no regressions)
- [ ] Test: clear localStorage → app doesn't crash → start fresh → earn Day 3 badge → works

---

## EXPLICIT OUT OF SCOPE (Do Not Build Yet)
- Quests or daily mini-goals
- Social features / leaderboards
- XP or point systems
- Premium/paid streak perks
- Knee drink ritual log (separate feature, after this ships)
- Custom workout badges (separate feature)
- Sharing / social cards
- Animations or confetti

---

## KNOWN RISKS
1. **Storage regression** — New gamification writes could re-introduce the old "overwrite" bug. Mitigation: Phase 1 must pass ALL checks before Phase 2 starts.
2. **Milestone data loss** — If earnedBadges gets wiped, user loses all badges. Mitigation: Backup on every write (Phase 1 pattern).
3. **Timezone issues** — Streak date comparisons can break across timezones. Mitigation: Use local date keys consistently (addressed in Phase 1 if found).
4. **Scope creep** — You will want to add "just one more thing." Don't. Ship this, use it for a week, THEN plan the next iteration.

---

## HOW TO USE THIS PLAN IN CURSOR

1. Copy this file into your project root (or a /plans folder)
2. In your Claude.md or rules file, add: "Read plans/knee-capacity-streak-plan.md before starting any streak work"
3. Work through tasks IN ORDER — do not skip ahead
4. After each task, run the checkpoint manually
5. Update the status checkboxes as you go
6. If a task breaks something, STOP and fix before continuing
7. Commit after each successful task (small, reversible commits)

---

## POSTMORTEM TEMPLATE (Use After Shipping)

After Phase 2 is live and you've used it for a week:

1. What worked well?
2. What broke or was harder than expected?
3. What would you do differently?
4. What should be added to rules/docs to prevent future issues?
5. What's the next iteration? (This is where knee drink, recovery badges, etc. go)
