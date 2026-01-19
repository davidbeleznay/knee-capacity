# KneeCapacity

> Knee OA recovery tracker: Keith Barr protocols + body measurements + workout analytics

**Live app:** https://kneecapacity.netlify.app

---

## 🎯 Core Features

### Daily Check-In (30 seconds)
- Traffic light status (Green/Yellow/Red)
- Swelling + pain tracking
- Activity logging
- Auto-filters safe exercises

### Workout Logging
- **⏱️ Stopwatch** with milestone rewards (30s, 45s, 60s!)
- **💪 Exercises:** Spanish Squat, Wall Sit, Step-Downs, etc.
  - Track: sets, reps, **hold time**, weight, RPE
- **🎯 Custom:** Peloton, rowing, core, stretch
  - Track: duration, intensity, knee impact
- Progress trends for every exercise

### 📏 Body Measurements
- Bilateral knee circumference (effusion zone)
- Optional: thigh, calf, waist, weight
- **Derived metrics:** BMI, waist-to-height, R-L difference
- Swelling trend detection

### 📊 Analytics
- Workout frequency, swelling/pain trends
- Top exercises, individual exercise deep-dives
- Hold time progression charts
- 7/14/30/90 day views

---

## ⚠️ DATA PERSISTENCE ISSUE?

**If your wall sit from yesterday isn't showing:**

### iOS Safari (Most Common Issue):
1. Settings → Safari → **"Prevent Cross-Site Tracking"** = OFF
2. Settings → Safari → **"Block All Cookies"** = OFF
3. **Add to Home Screen** (better persistence)
4. Not in Private Browsing mode

### Android Chrome:
1. Settings → Site Settings → Cookies = **Allowed**
2. Not using "Lite mode"
3. Not set to "Clear data on exit"

### Desktop:
1. Not in Incognito/Private mode
2. Cookies/LocalStorage enabled
3. Not using aggressive privacy extensions

### Debug in Console (F12):
```javascript
// See what's stored:
console.log(JSON.parse(localStorage.getItem('exerciseLogs')));
console.log(JSON.parse(localStorage.getItem('checkIns')));

// Clear and restart (if needed):
localStorage.clear();
location.reload();
```

### Best Practice:
**Export your data weekly** (Analytics → Export) as backup!

---

## 📱 Usage

### Wall Sit with Stopwatch
1. Log tab → Start stopwatch
2. Get in position
3. Watch time climb: 00:30 🎯 ... 00:45 🎯🎉
4. Stop at your max (e.g., 47s)
5. Tap 🧱 Wall Sit tile
6. Adjust hold time to 47s
7. Log it!
8. **Next time:** Beat 47s!

### Peloton Ride
1. Log tab → Custom
2. Tap 🚴 Peloton
3. Details: "Power Zone with Matt"
4. Duration: 30 min
5. Intensity: 7/10
6. Impact: None
7. Log it!

### Weekly Measurements
1. Home tab → "Add" under Measurements
2. Measure both knees (2cm above patella)
3. Optional: waist, weight
4. See BMI, R-L difference, trends

---

## 🔬 The Science

**Keith Barr Research:**
- SHORT loading (5-10 min isometric holds)
- LONG rest (6-8 hours between sessions)
- Optimizes collagen synthesis in damaged tissue

**Your Specialist's Protocol:**
- Traffic light system (swelling-first approach)
- Quad-sparing techniques (0-60° ROM)
- Lateral compartment protection
- Progressive loading: Calm → Build → Prime

---

## 🛠️ Tech Stack

- Vanilla JavaScript ES6+
- LocalStorage (5-10MB, device-local)
- No frameworks, no dependencies
- No backend, no tracking
- Mobile-first responsive design

---

## 📊 Data Model

```javascript
// Check-In
{date, swelling, pain, activities[], notes}

// Exercise Log  
{exerciseId, exerciseName, setsCompleted, repsPerSet, 
 holdTimeSeconds, weightUsed, rpe, notes, date, timestamp}

// Custom Workout
{workoutCategory, workoutType, durationMinutes, 
 intensity, kneeImpact, notes, date, timestamp}

// Body Measurement
{measurements: {
  knee_top_cm: {right, left, method},
  thigh_cm: {right, left, method},
  calf_cm: {right, left, method},
  waist_cm, weight_lb, height_cm
}, posture, notes, type, date, timestamp}

// Derived Metrics
BMI, waist-to-height ratio, R-L knee difference, swelling trend
```

---

## 🚀 Development

```bash
git clone https://github.com/davidbeleznay/knee-capacity.git
cd knee-capacity

# No build process - just open:
open index.html

# Or use local server:
python -m http.server 8000
```

---

## 📤 Export Format

Analytics → Export creates JSON with:
- All check-ins, exercises, custom workouts, measurements
- Summary stats (30-day averages, green days, etc.)
- Derived metrics
- Swelling trend analysis
- Ready for specialist review

---

## Troubleshooting

**Q: Stopwatch not making sounds?**  
A: Tap screen first (browsers require user interaction for audio)

**Q: Exercise tiles not showing?**  
A: Complete daily check-in first (tiles filter by knee status)

**Q: Data lost after app update?**  
A: Export data regularly as backup. Browser updates can clear storage.

**Q: How to reset everything?**  
A: Console → `localStorage.clear()` → Refresh

---

## Medical Disclaimer

Personal tracking tool for research purposes. Not medical advice. Always consult healthcare professionals.

Based on:
- Keith Barr's published collagen synthesis research
- Specialist orthopedic treatment plan for lateral OA
- Not a substitute for professional medical care

---

## Roadmap

**Current (MVP):**
- ✅ Stopwatch with milestones
- ✅ Exercise logging (hold time tracking!)
- ✅ Custom workout logging
- ✅ Body measurements
- ✅ Trend analytics

**Next (v2):**
- ROM tracking (flexion/extension angles)
- Photo documentation
- Symptom correlation analysis
- Cloud sync option

**Future:**
- Native mobile app
- Specialist sharing portal
- Community features

---

## License

MIT - Personal use. Adapt freely.

## Author

Built by someone trying to avoid knee surgery and keep playing volleyball. 🏐

If this helps you track YOUR recovery, fork it and make it yours!
