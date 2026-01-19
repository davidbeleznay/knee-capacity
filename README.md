# KneeCapacity - Modular Architecture

**Knee OA recovery tracker built with modular, API-friendly code**

Live: https://kneecapacity.netlify.app

---

## ✅ Features

- Daily check-in (swelling, pain, activity, time)
- Traffic light status (Green/Yellow/Red)  
- Stopwatch with milestone rewards (30s, 45s, 60s)
- Exercise logging (sets, reps, hold time, weight, RPE)
- Custom workouts (Peloton, rowing, core, stretch)
- Body measurements (bilateral knee, waist, weight)
- Derived metrics (BMI, R-L difference)
- Analytics charts (swelling/pain trends)
- Export to JSON

---

## 🏭️ Modular Architecture

**Problem solved:** Old app.js was 48KB (1,200+ lines) - too big to edit via Claude API

**Solution:** Split into 9 focused modules, each < 320 lines

```
src/
├── core/
│   ├── state.js (24 lines) - Global state
│   ├── router.js (38 lines) - View switching
│   └── init.js (21 lines) - App startup
├── ui/
│   ├── checkin.js (175 lines) - Check-in UI
│   ├── stopwatch.js (152 lines) - Timer
│   ├── workouts.js (313 lines) - Exercise logging
│   ├── analytics.js (127 lines) - Charts
│   └── measurements.js (119 lines) - Body tracking
└── utils/
    └── helpers.js (32 lines) - Utilities

Bundle: app.js (1,015 lines, 38KB)
```

**Every module is editable via API!**

---

## 🔧 Development

### Quick Start
```bash
git clone https://github.com/davidbeleznay/knee-capacity.git
open index.html  # Works immediately
```

### Build Process
```bash
./build.sh  # Concatenates src/ modules → app.js
```

Or manually:
```bash
cat src/core/*.js src/utils/*.js src/ui/*.js > app.js
```

### Edit a Module
```bash
# Fix check-in bug:
code src/ui/checkin.js  # Only 175 lines!

# Rebuild:
./build.sh

# Deploy:
git push  # Netlify auto-deploys
```

---

## 📱 iOS Safari Fix

**Buttons use BOTH** `ontouchstart` AND `onclick`:
```html
<button ontouchstart="handler()" onclick="handler()">Tap Me</button>
```

**Flat structure** (no nested divs):
```html
✅ <button>🟢 None</button>
❌ <button><div>🟢</div><div>None</div></button>
```

This fixes iOS Safari touch event issues.

---

## 🗂️ Module Responsibilities

| Module | Lines | Purpose |
|--------|-------|---------|  
| state.js | 24 | Global AppState object |
| helpers.js | 32 | Icons, adjustValue, streak |
| router.js | 38 | View switching |
| checkin.js | 175 | Check-in UI & handlers |
| stopwatch.js | 152 | Timer with milestones |
| workouts.js | 313 | Exercise/custom logging |
| analytics.js | 127 | Charts & stats |
| measurements.js | 119 | Body tracking |
| init.js | 21 | Startup sequence |

---

## 💾 Data Model

Stored in localStorage via data.js:

```javascript
checkIns: [{
  date, swelling, pain,
  activityLevel, timeOfDay, notes
}]

exerciseLogs: [{
  exerciseId, exerciseName,
  setsCompleted, repsPerSet, 
  holdTimeSeconds, weightUsed,
  rpe, notes, date, timestamp
}]

customWorkouts: [{
  workoutCategory, workoutType,
  durationMinutes, intensity,
  kneeImpact, notes, date, timestamp
}]

bodyMeasurements: [{
  measurements: {
    knee_top_cm: {right, left, method},
    waist_cm, weight_lb, height_cm
  },
  posture, notes, type, date, timestamp
}]
```

---

## 🚀 Tech Stack

- Vanilla JavaScript (ES6)
- LocalStorage (device-local)
- Modular architecture (9 files)
- No frameworks, no build tools required
- Simple bash concatenation

---

## 🔬 The Science

**Keith Barr Protocol:**
- SHORT loading (5-10 min isometric holds)
- LONG rest (6-8 hours)
- Optimizes collagen synthesis

**Traffic Light System:**
- GREEN: Full training
- YELLOW: Modified intensity  
- RED: Recovery mode

---

## 📊 Benefits of Modular Design

### Before:
- ❌ 48KB single file
- ❌ 1,200+ lines
- ❌ Can't edit via API

### After:
- ✅ 38KB bundled (9 modules)
- ✅ Largest: 313 lines
- ✅ All API-editable
- ✅ Isolated bug fixes

---

## 📜 License

MIT - Adapt freely. Built to avoid surgery. 🏐💪
