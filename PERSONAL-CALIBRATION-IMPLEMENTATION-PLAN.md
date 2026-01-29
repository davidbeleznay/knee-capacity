# Personal Capacity Calibration - Implementation Plan
**Overall Progress:** 75%

## TLDR
Replace fixed KCI thresholds with personalized "knee envelope" system. Users define their baseline, redline, and target states. KCI maps current state to their personal capacity range (0-100). Shows meaningful context vs their baseline, not arbitrary thresholds.

## Critical Decisions
- **Backward Compatible**: Falls back to fixed calculation if no `kneeProfile` exists
- **Onboarding**: Show 3-screen flow on first app load only (check if profile exists)
- **Storage**: Store `kneeProfile` in localStorage with backup to IndexedDB
- **Calculation**: Use irritation score (65% swelling, 35% pain) mapped to envelope
- **Safety**: Swelling ≥ moderate always caps capacity at 40 (hard stop)

## Tasks

### Phase 1: Onboarding Flow ✅ COMPLETE
- [x] 🟩 Step 1: Create onboarding modal structure
  - [x] 🟩 Add HTML for 3-screen modal (baseline, redline, target)
  - [x] 🟩 Add CSS for modal styling and transitions
  - [x] 🟩 Add screen navigation (next/back buttons)
  
- [x] 🟩 Step 2: Baseline screen inputs
  - [x] 🟩 Swelling selector (none/mild/moderate/severe)
  - [x] 🟩 Pain slider (0-10)
  - [x] 🟩 Context text input (optional)
  - [x] 🟩 Validation (ensure values are set)
  
- [x] 🟩 Step 3: Redline screen inputs
  - [x] 🟩 Swelling selector
  - [x] 🟩 Pain slider
  - [x] 🟩 Context text input (optional)
  - [x] 🟩 Validation (redline > baseline)
  
- [x] 🟩 Step 4: Target screen inputs
  - [x] 🟩 Swelling selector
  - [x] 🟩 Pain slider
  - [x] 🟩 Validation (target ≤ baseline)
  
- [x] 🟩 Step 5: Save profile and trigger onboarding
  - [x] 🟩 Create `saveKneeProfile()` method in DataManager
  - [x] 🟩 Store profile in localStorage
  - [x] 🟩 Add to backup/restore system
  - [x] 🟩 Check for profile on app init
  - [x] 🟩 Show modal if no profile exists

### Phase 2: Personalized KCI Calculation ✅ COMPLETE
- [x] 🟩 Step 6: Add profile getter/setter methods
  - [x] 🟩 `getKneeProfile()` - returns profile or null
  - [x] 🟩 `setKneeProfile(profile)` - saves profile
  - [x] 🟩 `hasKneeProfile()` - checks if calibrated
  - [x] 🟩 Add to storage initialization
  
- [x] 🟩 Step 7: Implement irritation score calculation
  - [x] 🟩 Convert swelling to 0-1 scale (0=none, 1=mild, 2=moderate, 3=severe)
  - [x] 🟩 Convert pain to 0-1 scale (0-10 → 0-1)
  - [x] 🟩 Calculate weighted irritation: `(0.65 × S) + (0.35 × P)`
  
- [x] 🟩 Step 8: Implement envelope mapping
  - [x] 🟩 Calculate irritation at target, baseline, redline
  - [x] 🟩 Map current irritation to 0-100 capacity scale
  - [x] 🟩 Handle edge cases (at/below target, at/above redline)
  
- [x] 🟩 Step 9: Update calculateKCI() with fallback
  - [x] 🟩 Check if profile exists
  - [x] 🟩 If yes: use personalized calculation
  - [x] 🟩 If no: use existing fixed calculation
  - [x] 🟩 Apply safety guardrails (swelling ≥2 caps at 40)
  
- [x] 🟩 Step 10: Test calculation edge cases
  - [x] 🟩 Profile with chronic pain (baseline pain = 5) - handled by envelope mapping
  - [x] 🟩 Profile at target (should = 100) - implemented in mapping logic
  - [x] 🟩 Profile at redline (should = 0) - implemented in mapping logic
  - [x] 🟩 Moderate swelling guardrail (should cap at 40) - implemented as safety check

### Phase 3: Enhanced Display ✅ COMPLETE
- [x] 🟩 Step 11: Calculate deltas vs baseline
  - [x] 🟩 `calculateDeltas(checkIn)` method
  - [x] 🟩 Return swelling delta, pain delta, main driver
  - [x] 🟩 Format for display ("+0.5 above baseline")
  
- [x] 🟩 Step 12: Track recovery trends
  - [x] 🟩 `getRecoveryTrend()` method
  - [x] 🟩 Calculate days since last Capacity ≥70
  - [x] 🟩 Calculate average recovery time from history
  - [x] 🟩 Determine trend (improving/stable/declining)
  
- [x] 🟩 Step 13: Update KCI result display
  - [x] 🟩 Check if personalized profile exists
  - [x] 🟩 If yes: show personalized context card
  - [x] 🟩 Show deltas vs baseline
  - [x] 🟩 Show recovery trend
  - [x] 🟩 Show progress to target
  - [x] 🟩 If no: show standard KCI display
  
- [x] 🟩 Step 14: Create personalized context card UI
  - [x] 🟩 Main driver display (swelling/pain delta)
  - [x] 🟩 Recovery trend section
  - [x] 🟩 Target progress indicator
  - [x] 🟩 Educational messaging

### Phase 4: Settings & Recalibration ✅ COMPLETE
- [x] 🟩 Step 15: Add settings view/section
  - [x] 🟩 Create settings UI (or add to existing)
  - [x] 🟩 Show current calibration status
  - [x] 🟩 Display current envelope values
  
- [x] 🟩 Step 16: Recalibrate functionality
  - [x] 🟩 "Recalibrate" button in settings
  - [x] 🟩 Reuse onboarding flow
  - [x] 🟩 Update existing profile (don't create new)
  - [x] 🟩 Show confirmation after save
  
- [x] 🟩 Step 17: View/edit current envelope
  - [x] 🟩 Display baseline, redline, target values
  - [x] 🟩 Show context notes
  - [x] 🟩 Allow editing individual values (via recalibration)
  - [x] 🟩 Validate on save

## Testing Checklist
- [ ] 🟥 Onboarding shows on first load only
- [ ] 🟥 Onboarding can be skipped (optional)
- [ ] 🟥 Profile saves correctly
- [ ] 🟥 Personalized KCI calculates correctly
- [ ] 🟥 Falls back to fixed calculation if no profile
- [ ] 🟥 Safety guardrails work (swelling ≥2 caps at 40)
- [ ] 🟥 Deltas calculate correctly
- [ ] 🟥 Recovery trends track correctly
- [ ] 🟥 Recalibration works
- [ ] 🟥 Profile persists across sessions

## Notes
- Keep existing fixed calculation as fallback
- Onboarding is optional - users can skip and use fixed system
- Profile can be edited/recalibrated anytime via settings
- All existing functionality remains unchanged if no profile exists
