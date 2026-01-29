# Personal Capacity Calibration System - Exploration & Plan

## Current System Analysis

### Current KCI Calculation (Fixed Thresholds)
```javascript
calculateKCI(checkInData) {
    let score = 100;
    
    // Fixed swelling deductions
    swellingDeductions = { 'none': 0, 'mild': -10, 'moderate': -25, 'severe': -40 }
    
    // Fixed pain deductions
    pain >= 9: -40
    pain >= 7: -25
    pain >= 5: -15
    pain >= 3: -5
    
    // Activity spikes, trends, bonuses...
}
```

**Problems:**
- Someone with chronic pain 5/10 at baseline gets penalized -15 points
- Mild swelling always = -10, even if that's their normal
- No account for individual capacity ranges
- Fixed thresholds don't meet people where they are

---

## New System: Personal Knee Envelope

### Core Concept
Map each person's knee state to their **personal capacity envelope**:
- **Target**: Where they want to be (ideal state)
- **Baseline**: Their typical state during normal loading
- **Redline**: Their peak state after hardest realistic week

### Data Model

```javascript
kneeProfile: {
  // Personal envelope points
  baselineSwelling: 1,        // 0=none, 1=mild, 2=moderate, 3=severe
  baselinePain: 3,            // 0-10 scale
  redlineSwelling: 2,          // Peak swelling after hard week
  redlinePain: 7,              // Peak pain after hard week
  targetSwelling: 0,           // Ideal state
  targetPain: 1,               // Ideal pain level
  
  // Context (for user reference)
  baselineContext: "2-3x/week strength, no impact",
  redlineContext: "Tournament weekend + training",
  
  // Weights (can tune later)
  swellingWeight: 0.65,        // Swelling is primary indicator
  painWeight: 0.35,
  
  // Metadata
  calibratedAt: "2026-01-26",  // When profile was created
  version: 1                    // For future migrations
}
```

---

## Onboarding Flow (3 Screens)

### SCREEN A: Your Baseline
**Purpose**: Establish what "normal" looks like for this person

```
┌─────────────────────────────────────┐
│  🦵 Personal Knee Calibration      │
│                                     │
│  Screen 1 of 3: Your Baseline      │
│                                     │
│  "On a light-loading week, what's   │
│   your typical swelling and pain?" │
│                                     │
│  Swelling:                          │
│  [○ None] [● Mild] [○ Mod] [○ Bad]│
│                                     │
│  Pain: [━━━━━━━━━━] 3/10           │
│                                     │
│  Context (optional):                │
│  [________________________]        │
│  e.g., "2-3 strength sessions/week"│
│                                     │
│  [Continue →]                       │
└─────────────────────────────────────┘
```

### SCREEN B: Your Redline
**Purpose**: Establish peak capacity boundary

```
┌─────────────────────────────────────┐
│  🦵 Personal Knee Calibration      │
│                                     │
│  Screen 2 of 3: Your Redline      │
│                                     │
│  "After your hardest realistic     │
│   week/tournament, what's peak     │
│   swelling & pain?"                 │
│                                     │
│  Swelling:                          │
│  [○ None] [○ Mild] [● Mod] [○ Bad]│
│                                     │
│  Pain: [━━━━━━━━━━━━━━] 7/10      │
│                                     │
│  Context (optional):                │
│  [________________________]        │
│  e.g., "8-hour tournament + 2     │
│         training days"             │
│                                     │
│  [← Back] [Continue →]              │
└─────────────────────────────────────┘
```

### SCREEN C: Your Target
**Purpose**: Establish goal state

```
┌─────────────────────────────────────┐
│  🦵 Personal Knee Calibration      │
│                                     │
│  Screen 3 of 3: Your Target        │
│                                     │
│  "Under baseline loading, where do  │
│   you want to be?"                  │
│                                     │
│  Swelling:                          │
│  [● None] [○ Mild] [○ Mod] [○ Bad]│
│                                     │
│  Pain: [━━] 1/10                   │
│                                     │
│  [← Back] [Complete Setup ✓]       │
└─────────────────────────────────────┘
```

**Implementation Notes:**
- Show only on first app load (check if `kneeProfile` exists)
- Can be skipped/manually triggered later via settings
- Store in `localStorage` as `kneeProfile`

---

## Personalized KCI Calculation

### Step 1: Calculate Irritation Score
```javascript
// Normalize to 0-1 scale
S = swelling / 3        // 0=none, 1=mild, 2=moderate, 3=severe
P = pain / 10           // 0-10 scale normalized

// Weighted irritation (swelling-weighted)
I = (swellingWeight × S) + (painWeight × P)
// Default: I = (0.65 × S) + (0.35 × P)
```

### Step 2: Map to Personal Envelope
```javascript
// Calculate irritation at envelope points
I_target = (0.65 × targetSwelling/3) + (0.35 × targetPain/10)
I_baseline = (0.65 × baselineSwelling/3) + (0.35 × baselinePain/10)
I_redline = (0.65 × redlineSwelling/3) + (0.35 × redlinePain/10)

// Current irritation
I_current = (0.65 × currentSwelling/3) + (0.35 × currentPain/10)

// Map to 0-100 capacity scale
// Capacity = 100 when at target, 0 when at redline
if (I_current <= I_target) {
    // Above target = bonus capacity (100-120 range, capped at 100)
    Capacity = 100;
} else if (I_current >= I_redline) {
    // At/beyond redline = 0
    Capacity = 0;
} else {
    // Linear interpolation between target and redline
    const range = I_redline - I_target;
    const distance = I_current - I_target;
    Capacity = 100 × (1 - (distance / range));
    Capacity = Math.max(0, Math.min(100, Capacity));
}
```

### Step 3: Safety Guardrails
```javascript
// Swelling is the hard stop
if (swelling >= 2) {  // moderate or severe
    Capacity = Math.min(40, Capacity);  // Cap at yellow zone
}

// If severe swelling, force red
if (swelling === 3) {
    Capacity = Math.min(20, Capacity);
}
```

### Step 4: Apply Trend/Bonus Logic (Optional)
```javascript
// Keep existing trend detection, activity spikes, bonuses
// But apply as smaller adjustments (±5 points max)
// Since personalized score is already calibrated
```

---

## Personalized Zones

### Dynamic Thresholds
Instead of fixed:
- **GREEN**: Capacity ≥ 70 (at/better than baseline)
- **YELLOW**: Capacity 40-69 (between baseline and redline)
- **RED**: Capacity < 40 OR swelling ≥ 2 (near redline or safety stop)

### Interpretation
- **100**: At/near target (ideal state)
- **70-90**: Around baseline (normal operating range)
- **40-69**: Between baseline and redline (modify intensity)
- **0-39**: Near redline territory (recover)

---

## Delta Calculations

### Track Changes vs Baseline
```javascript
calculateDeltas(checkIn) {
    const profile = this.getKneeProfile();
    if (!profile) return null;
    
    const swellingValues = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
    const currentSwelling = swellingValues[checkIn.swelling] || 0;
    const currentPain = checkIn.pain || 0;
    
    return {
        swellingDelta: currentSwelling - profile.baselineSwelling,
        painDelta: currentPain - profile.baselinePain,
        mainDriver: Math.abs(currentSwelling - profile.baselineSwelling) > 
                   Math.abs(currentPain - profile.baselinePain) 
                   ? 'swelling' : 'pain'
    };
}
```

---

## Recovery Trend Tracking

### Track Days Since Last Good Day
```javascript
getRecoveryTrend() {
    const checkIns = this.getCheckIns();
    const profile = this.getKneeProfile();
    if (!profile) return null;
    
    // Find last day with Capacity ≥ 70
    let daysSinceGood = 0;
    const today = this.getLocalDateKey();
    
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = this.getLocalDateKey(date);
        const checkIn = checkIns.find(c => c.date === dateKey);
        
        if (checkIn && checkIn.kciScore >= 70) {
            daysSinceGood = i;
            break;
        }
    }
    
    // Calculate average recovery time
    // (time between dropping below 70 and returning to 70+)
    // ...implementation...
    
    return {
        daysSinceGood,
        avgRecoveryDays: 2.4,  // calculated from history
        trend: 'improving' | 'stable' | 'declining'
    };
}
```

---

## Enhanced UI Display

### Home Page After Check-In
```
┌─────────────────────────────────────────┐
│ KNEE CAPACITY: 62 🟡                    │
│ (Yellow - Modify Intensity)             │
├─────────────────────────────────────────┤
│ Main Driver:                            │
│ Swelling +0.5 above baseline            │
│ Pain +2 above baseline                  │
├─────────────────────────────────────────┤
│ Recovery Trend:                         │
│ Days since ≥70: 3                       │
│ Avg recovery time: 2.4 days             │
├─────────────────────────────────────────┤
│ Target Progress:                        │
│ 18 points from Target zone              │
└─────────────────────────────────────────┘
```

### Implementation Structure
```javascript
// In renderKCIResult()
const profile = DataManager.getKneeProfile();
const deltas = DataManager.calculateDeltas(enrichedData);
const recovery = DataManager.getRecoveryTrend();

if (profile) {
    // Show personalized context
    showPersonalizedContext(score, deltas, recovery, profile);
} else {
    // Show standard KCI (backward compatible)
    showStandardKCI(score);
}
```

---

## Migration Strategy

### Backward Compatibility
1. **Check if profile exists**: If no `kneeProfile`, use old fixed calculation
2. **Gradual rollout**: Show onboarding only to new users initially
3. **Manual trigger**: Add "Recalibrate" option in settings for existing users
4. **Fallback**: If profile data invalid, fall back to fixed calculation

### Data Migration
```javascript
// On app init, check for existing users
if (!this.getKneeProfile() && this.getCheckIns().length > 0) {
    // Existing user - offer calibration
    // Don't force, but show prompt: "Want to personalize your knee capacity?"
}
```

---

## Implementation Plan

### Phase 1: Data Model & Storage
- [ ] Add `kneeProfile` to storage initialization
- [ ] Create `getKneeProfile()`, `setKneeProfile()` methods
- [ ] Add to backup/restore system

### Phase 2: Onboarding Flow
- [ ] Create 3-screen onboarding modal/flow
- [ ] Swelling/pain sliders with context inputs
- [ ] Validation (redline > baseline, target ≤ baseline)
- [ ] Store profile on completion

### Phase 3: Personalized KCI Calculation
- [ ] Implement irritation score calculation
- [ ] Implement envelope mapping
- [ ] Add safety guardrails
- [ ] Replace `calculateKCI()` with personalized version (with fallback)

### Phase 4: Delta & Trend Tracking
- [ ] Implement `calculateDeltas()`
- [ ] Implement `getRecoveryTrend()`
- [ ] Track recovery patterns

### Phase 5: Enhanced UI
- [ ] Update `renderKCIResult()` to show personalized context
- [ ] Add delta display (swelling/pain vs baseline)
- [ ] Add recovery trend display
- [ ] Add target progress indicator

### Phase 6: Settings & Recalibration
- [ ] Add "Recalibrate" option in settings
- [ ] Allow editing profile
- [ ] Show calibration status

---

## Edge Cases & Considerations

### Edge Case 1: Invalid Profile
- **Scenario**: Profile has redline < baseline
- **Solution**: Validation on save, fallback to fixed calculation

### Edge Case 2: No Profile (Existing Users)
- **Scenario**: User has been using app, no profile exists
- **Solution**: Use fixed calculation, offer calibration optionally

### Edge Case 3: Extreme Values
- **Scenario**: Baseline pain = 8/10 (chronic pain)
- **Solution**: System still works - their "good day" is relative to their baseline

### Edge Case 4: Target Better Than Baseline
- **Scenario**: Target swelling = 0, baseline = 1
- **Solution**: Allow this - it's aspirational, Capacity can exceed 100 (capped at 100)

### Edge Case 5: Swelling Safety Stop
- **Scenario**: Moderate swelling but low pain
- **Solution**: Guardrail caps Capacity at 40 regardless of pain

---

## Benefits

1. **Personalized**: Meets people where they are
2. **Meaningful**: Shows context (vs baseline, not arbitrary thresholds)
3. **Motivational**: Clear progress toward target
4. **Educational**: Helps users understand their knee patterns
5. **Flexible**: Can recalibrate as they improve

---

## Calculation Examples

### Example 1: Person with Chronic Pain
**Profile:**
- Baseline: Swelling=mild (1), Pain=5/10
- Redline: Swelling=moderate (2), Pain=8/10
- Target: Swelling=none (0), Pain=2/10

**Today's Check-In:**
- Swelling=mild (1), Pain=5/10

**Calculation:**
```
I_target = (0.65 × 0/3) + (0.35 × 2/10) = 0.07
I_baseline = (0.65 × 1/3) + (0.35 × 5/10) = 0.217 + 0.175 = 0.392
I_redline = (0.65 × 2/3) + (0.35 × 8/10) = 0.433 + 0.28 = 0.713
I_current = (0.65 × 1/3) + (0.35 × 5/10) = 0.392

// Current is at baseline
Capacity = 100 × (1 - (0.392 - 0.07) / (0.713 - 0.07)) 
         = 100 × (1 - 0.322 / 0.643)
         = 100 × 0.499
         = 49.9 ≈ 50

Result: 50 (YELLOW) - "At your baseline, modify intensity"
```

**Old System Would Give:**
- Mild swelling: -10
- Pain 5: -15
- Score: 75 (GREEN) ❌ Wrong - this is their baseline, not good!

### Example 2: Person Improving
**Profile:**
- Baseline: Swelling=mild (1), Pain=3/10
- Redline: Swelling=moderate (2), Pain=7/10
- Target: Swelling=none (0), Pain=1/10

**Today's Check-In:**
- Swelling=none (0), Pain=1/10

**Calculation:**
```
I_target = (0.65 × 0/3) + (0.35 × 1/10) = 0.035
I_current = (0.65 × 0/3) + (0.35 × 1/10) = 0.035

// Current equals target
Capacity = 100 ✅

Result: 100 (GREEN) - "At target! Ready to work"
```

### Example 3: Safety Guardrail
**Profile:**
- Baseline: Swelling=mild (1), Pain=4/10
- Redline: Swelling=moderate (2), Pain=8/10

**Today's Check-In:**
- Swelling=moderate (2), Pain=3/10 (low pain but moderate swelling)

**Calculation:**
```
I_current = (0.65 × 2/3) + (0.35 × 3/10) = 0.433 + 0.105 = 0.538
// Would calculate to ~60 based on irritation

// BUT safety guardrail applies:
if (swelling >= 2) {
    Capacity = Math.min(40, Capacity) = 40
}

Result: 40 (YELLOW) - "Moderate swelling = modify intensity"
// Swelling is the hard stop, regardless of pain
```

---

## Questions to Consider

1. **When to show onboarding?**
   - First app load only?
   - After X check-ins?
   - Manual trigger only?

2. **Recalibration frequency?**
   - Quarterly?
   - When baseline changes?
   - Manual only?

3. **Historical data?**
   - Recalculate old KCI scores with new formula?
   - Keep old scores, use new going forward?

4. **Default weights?**
   - Start with 0.65/0.35 (swelling/pain)?
   - Allow user tuning?
   - Learn from data?

5. **Migration for existing users?**
   - Force calibration?
   - Optional prompt?
   - Silent fallback?

---

## Next Steps

1. **Review this plan** - Confirm approach and priorities
2. **Prototype onboarding flow** - Test UX flow
3. **Implement data model** - Storage and methods
4. **Build calculation engine** - Personalized KCI
5. **Add UI enhancements** - Context display
6. **Test edge cases** - Ensure robustness
7. **Gradual rollout** - New users first, then existing

---

## Summary & Key Decisions

### Core Innovation
**Personal Knee Envelope** replaces fixed thresholds with individualized capacity mapping:
- Each person defines their baseline, redline, and target
- KCI maps current state to their personal envelope (0-100)
- Contextual feedback shows deltas vs baseline, not arbitrary scores

### Technical Approach
1. **Backward Compatible**: Falls back to fixed calculation if no profile exists
2. **Irritation Score**: Weighted combination (65% swelling, 35% pain)
3. **Linear Mapping**: Current irritation → Capacity via envelope interpolation
4. **Safety Guardrails**: Swelling ≥ moderate caps capacity at 40

### UX Flow
- **3-screen onboarding**: Baseline → Redline → Target
- **Optional context**: Users can add notes about their envelope points
- **First-time only**: Show on app initialization if no profile exists
- **Recalibration**: Available via settings for adjustments

### Data Storage
```javascript
localStorage: {
  kneeProfile: {
    baselineSwelling, baselinePain,
    redlineSwelling, redlinePain,
    targetSwelling, targetPain,
    baselineContext, redlineContext,
    swellingWeight, painWeight,
    calibratedAt, version
  }
}
```

### Key Benefits
✅ **Personalized**: Meets people where they are  
✅ **Meaningful**: Shows progress vs their baseline, not fixed thresholds  
✅ **Motivational**: Clear path from current → target  
✅ **Educational**: Helps users understand their knee patterns  
✅ **Flexible**: Can recalibrate as they improve  

### Implementation Priority
1. **High**: Data model, personalized calculation, onboarding flow
2. **Medium**: Delta tracking, recovery trends, enhanced UI
3. **Low**: Advanced analytics, weight tuning, auto-recalibration

---

## Open Questions for Discussion

1. **Onboarding Timing**: First load only, or after X check-ins?
2. **Recalibration**: Quarterly, on-demand, or auto-detect baseline shifts?
3. **Historical Data**: Recalculate old scores or keep as-is?
4. **Default Weights**: Start with 0.65/0.35 or allow user tuning?
5. **Migration**: Force calibration for existing users or optional prompt?
