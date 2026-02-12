# Task 1.1: Read-Only Storage Audit

**Status:** Complete  
**No code was modified.** This document is a diagnostic of every `localStorage` key used by the app and its read/write behavior.

---

## Summary Table

| Key | Data stored | Read from | Written from | If key missing (null) | If invalid JSON |
|-----|-------------|-----------|--------------|------------------------|-----------------|
| **exerciseLogs** | Array of exercise log entries | `data.js`: `storage.get('exerciseLogs')` → `getExerciseLogs()`, `updateStreak()`, `runStorageDiagnostic()`; callers via DataManager (app.js, app.bundle.js, src/**) | `data.js`: `saveExerciseLog()`, `normalizeCheckIns()` (indirect via get then set) | **Not written on init** (skipped in init loop). Getters return `[]`. `updateStreak()` skips (no write). | `storage.get()` returns `{ status: 'error', raw }`; getters return `[]`. Console error logged. |
| **checkIns** | Array of daily check-in objects | `data.js`: `storage.get('checkIns')` → `getCheckIns()`; used by normalizeCheckIns, saveCheckIn, getCheckIn, getCheckInsForDate, getRecentCheckIns, and many callers | `data.js`: `saveCheckIn()`, `normalizeCheckIns()` | **Init writes `[]`** in `init()` (stores.forEach). Getters return `[]`. | Same as exerciseLogs: status `error`, getters return `[]`. |
| **bodyMeasurements** | Array of measurement objects | `data.js`: `storage.get('bodyMeasurements')` → `getBodyMeasurements()`, `getLatestBodyMeasurement()`, `getBodyMeasurementHistory()`, `getSwellingTrend()`, etc. | `data.js`: `initializeBaselineMeasurement()`, `saveBodyMeasurement()`, `saveBodyMeasurement()` | **Init writes `[]`** in `init()`. Then `initializeBaselineMeasurement()` runs: if `getBodyMeasurements().length === 0` it writes `[baseline]`. So missing → `[]` then baseline written. | Getters return `[]`; baseline can still be written if length is 0. |
| **sessions** | Array of session objects | `data.js`: `storage.get('sessions')` → `getSessions()` | `data.js`: `saveSession()` | **Init writes `[]`** in `init()`. Getter returns `[]`. | Getter returns `[]`. |
| **customWorkouts** | Array of custom workout objects | `data.js`: `storage.get('customWorkouts')` → `getCustomWorkouts()`; used by updateStreak, saveCustomWorkout, and many callers | `data.js`: `saveCustomWorkout()` | **Init writes `[]`** in `init()`. Getter returns `[]`. | Getter returns `[]`. |
| **significantEvents** | Array of significant event objects | `data.js`: `storage.get('significantEvents')` → `getSignificantEvents()` | `data.js`: `addSignificantEvent()`, `updateEvent()`, `deleteEvent()` | **Init writes `[]`** in `init()**. Getter returns `[]`. | Getter returns `[]`. |
| **likedExercises** | Array of exercise IDs (strings) | `data.js`: `storage.get('likedExercises')` → `getLikedExerciseIds()`, `getFavoriteExerciseIds()` | `data.js`: `setExerciseLike()` | **Init writes `[]`** in `init()`. Getter returns `[]`. | Getter returns `[]`. |
| **dislikedExercises** | Array of exercise IDs | `data.js`: `storage.get('dislikedExercises')` → `getDislikedExerciseIds()` | `data.js`: `setExerciseDislike()` | **Init writes `[]`** in `init()**. Getter returns `[]`. | Getter returns `[]`. |
| **kneeProfile** | Object (user knee profile) | `data.js`: `storage.get('kneeProfile')` → `getKneeProfile()` | `data.js`: `setKneeProfile()`, `saveKneeProfile()` | **Not written on init** (comment: "Don't initialize"). Getter returns `null`. | Getter returns `null`. Console error from storage.get. |
| **streak** | String number (e.g. `"5"`) | `data.js`: raw `localStorage.getItem('streak')` in `getCurrentStreak()`, `updateStreak()`, `completeDailyCheckIn()`, `evaluateStreakForDate()`; `seedBackupFromStorage()`, `restoreFromBackup()`, `runStorageDiagnostic()` | `data.js`: **init** `localStorage.setItem('streak', '0')` when null; `updateStreak()` (writes `'0'` or computed value); `evaluateStreakForDate()` (writes `'0'` on reset); `completeDailyCheckIn()` (writes new streak) | **Init writes `'0'`** if null. Call sites use `parseInt(..., 10)` with `|| '0'` so missing → 0. **getCurrentStreak()**: if no lastStreakDate, calls **updateStreak()** which can write 0. | N/A (stored as string). If someone wrote invalid string, parseInt would yield NaN; code uses `|| '0'` so effectively 0. |
| **longestStreak** | String number | `data.js`: raw `localStorage.getItem('longestStreak')` in `updateStreak()`, `completeDailyCheckIn()`, `seedBackupFromStorage()`, `restoreFromBackup()`, `runStorageDiagnostic()` | `data.js`: **init** `localStorage.setItem('longestStreak', '0')` when null; `updateStreak()`, `completeDailyCheckIn()` | **Init writes `'0'`** if null. Parse with `|| '0'`. | Same as streak. |
| **lastStreakDate** | Date key string (YYYY-MM-DD) | `data.js`: raw `localStorage.getItem('lastStreakDate')` in `getCurrentStreak()`, `evaluateStreakForDate()`, `completeDailyCheckIn()`, `seedBackupFromStorage()`, `restoreFromBackup()`, `runStorageDiagnostic()` | `data.js`: `evaluateStreakForDate()` (grace token path or reset), `completeDailyCheckIn()`; **removed** on streak reset via `localStorage.removeItem('lastStreakDate')` | Not written on init. If missing: getCurrentStreak treats as "no last date" and **calls updateStreak()** (recompute from logs); evaluateStreakForDate treats as `null` and returns `streak_preserved`. | N/A (plain string). |
| **graceTokens** | String number | `data.js`: raw `localStorage.getItem('graceTokens')` in `evaluateStreakForDate()`, `completeDailyCheckIn()`, `seedBackupFromStorage()`, `restoreFromBackup()`, `runStorageDiagnostic()` | `data.js`: `evaluateStreakForDate()` (consume token), `completeDailyCheckIn()` (award tokens) | Not written on init. Parse with `|| '0'`. | N/A. |
| **graceTokenCap** | String number | `data.js`: raw `localStorage.getItem('graceTokenCap')` in `completeDailyCheckIn()`, `seedBackupFromStorage()`, `restoreFromBackup()`, `runStorageDiagnostic()` | `data.js`: `completeDailyCheckIn()` (when milestone rewards set cap) | Not written on init. Parse with `|| '0'`. | N/A. |
| **milestoneBadgesAwarded** | JSON array (e.g. `[7, 14]`) | `data.js`: raw `localStorage.getItem('milestoneBadgesAwarded')` + `JSON.parse(raw)` in `completeDailyCheckIn()`; `seedBackupFromStorage()`, `restoreFromBackup()` (with try/catch) | `data.js`: `completeDailyCheckIn()` (when milestone awarded) | Not written on init. completeDailyCheckIn: `raw ? JSON.parse(raw) : []`; catch → `awarded = []`. | Parse throws; catch sets `awarded = []`; no write of default. |

---

## Storage Wrapper Behavior (`data.js`)

- **`storage.set(key, value)`**  
  - Serializes with `JSON.stringify(value)`, writes with `localStorage.setItem(key, serializedValue)`, then triggers backup on success.  
  - Returns boolean (success/failure). Catches errors and logs to console.

- **`storage.get(key)`**  
  - Returns `{ status: 'missing' | 'ok' | 'error', value?, raw? }`.  
  - **missing**: `localStorage.getItem(key) === null` → `{ status: 'missing' }`.  
  - **ok**: item exists and `JSON.parse` succeeds → `{ status: 'ok', value }`.  
  - **error**: item exists but `JSON.parse` throws → `{ status: 'error', raw }`, console.error.

All array/object keys go through this wrapper. Streak-related keys (`streak`, `longestStreak`, `lastStreakDate`, `graceTokens`, `graceTokenCap`, `milestoneBadgesAwarded`) are read/written with **raw** `localStorage.getItem` / `setItem` (and `removeItem` for `lastStreakDate` on reset).

---

## Where Each Key Is Read

| Key | Files / functions that read |
|-----|-----------------------------|
| exerciseLogs | `data.js`: getExerciseLogs, updateStreak, runStorageDiagnostic; app.js, app.bundle.js, src/ui/* (via DataManager getters) |
| checkIns | `data.js`: getCheckIns, normalizeCheckIns, saveCheckIn, getCheckIn, getCheckInsForDate, getRecentCheckIns, and all callers of those |
| bodyMeasurements | `data.js`: getBodyMeasurements, getLatestBodyMeasurement, getBodyMeasurementHistory, getSwellingTrend, initializeBaselineMeasurement, saveBodyMeasurement; app.js, src/ui/measurements.js, analytics |
| sessions | `data.js`: getSessions, saveSession |
| customWorkouts | `data.js`: getCustomWorkouts, updateStreak, saveCustomWorkout, getCustomWorkoutsByDate, etc.; app.js, src/ui/workouts.js, analytics |
| significantEvents | `data.js`: getSignificantEvents, addSignificantEvent, updateEvent, deleteEvent, getEventById; src/ui/events.js |
| likedExercises | `data.js`: getLikedExerciseIds, getFavoriteExerciseIds; app.bundle.js, src/ui/workouts.js |
| dislikedExercises | `data.js`: getDislikedExerciseIds |
| kneeProfile | `data.js`: getKneeProfile, hasKneeProfile, setKneeProfile, saveKneeProfile, seedBackupFromStorage; app, analytics, etc. |
| streak | `data.js`: getCurrentStreak, updateStreak, completeDailyCheckIn, evaluateStreakForDate, seedBackupFromStorage, restoreFromBackup, runStorageDiagnostic |
| longestStreak | `data.js`: updateStreak, completeDailyCheckIn, seedBackupFromStorage, restoreFromBackup, runStorageDiagnostic |
| lastStreakDate | `data.js`: getCurrentStreak, evaluateStreakForDate, completeDailyCheckIn, seedBackupFromStorage, restoreFromBackup, runStorageDiagnostic |
| graceTokens | `data.js`: evaluateStreakForDate, completeDailyCheckIn, seedBackupFromStorage, restoreFromBackup, runStorageDiagnostic |
| graceTokenCap | `data.js`: completeDailyCheckIn, seedBackupFromStorage, restoreFromBackup, runStorageDiagnostic |
| milestoneBadgesAwarded | `data.js`: completeDailyCheckIn (raw get + JSON.parse), seedBackupFromStorage, restoreFromBackup |

---

## Where Each Key Is Written

| Key | Files / functions that write |
|-----|------------------------------|
| exerciseLogs | `data.js`: saveExerciseLog; normalizeCheckIns does not write exerciseLogs |
| checkIns | `data.js`: saveCheckIn, normalizeCheckIns |
| bodyMeasurements | `data.js`: initializeBaselineMeasurement, saveBodyMeasurement |
| sessions | `data.js`: saveSession |
| customWorkouts | `data.js`: saveCustomWorkout |
| significantEvents | `data.js`: addSignificantEvent, updateEvent, deleteEvent |
| likedExercises | `data.js`: setExerciseLike, toggleExerciseLike |
| dislikedExercises | `data.js`: setExerciseDislike, toggleExerciseDislike |
| kneeProfile | `data.js`: setKneeProfile, saveKneeProfile |
| streak | `data.js`: **init** (when null → `'0'`); updateStreak; evaluateStreakForDate (reset → `'0'`); completeDailyCheckIn |
| longestStreak | `data.js`: **init** (when null → `'0'`); updateStreak; completeDailyCheckIn |
| lastStreakDate | `data.js`: evaluateStreakForDate (grace path or remove on reset); completeDailyCheckIn; restoreFromBackup |
| graceTokens | `data.js`: evaluateStreakForDate (consume); completeDailyCheckIn (award); restoreFromBackup |
| graceTokenCap | `data.js`: completeDailyCheckIn (milestone reward); restoreFromBackup |
| milestoneBadgesAwarded | `data.js`: completeDailyCheckIn (milestone award); restoreFromBackup |

---

## Destructive Init / Missing-Key Behavior (Root Cause Summary)

1. **init()** (`data.js` ~127–151):  
   - For each of `sessions`, `checkIns`, `customWorkouts`, `bodyMeasurements`, `significantEvents`, `likedExercises`, `dislikedExercises`: **if key is null, writes `[]`**.  
   - **exerciseLogs**: explicitly skipped (no write when missing).  
   - **kneeProfile**: not written when null.  
   - **streak**: if null → `localStorage.setItem('streak', '0')`.  
   - **longestStreak**: if null → `localStorage.setItem('longestStreak', '0')`.

2. **initializeBaselineMeasurement()** (runs after init):  
   - If `getBodyMeasurements().length === 0` (true when key is missing or empty), **writes `[baseline]`**. So missing bodyMeasurements → init may write `[]` then baseline is written.

3. **getCurrentStreak()**:  
   - If `lastStreakDate` is missing, it **calls updateStreak()**.  
   - **updateStreak()** uses `storage.get('exerciseLogs')`. If status is `missing` or `error` or empty, it returns `{ status: 'skipped', reason }` and **does not write**.  
   - If logs are ok but "no workout today or yesterday", it **writes streak `'0'`** and backup. So the dangerous "recompute from logs and write 0" only happens when exerciseLogs exist and are valid but don’t extend the streak; when exerciseLogs are missing, updateStreak skips and no write.  
   - getCurrentStreak then returns `parseInt(localStorage.getItem('streak') || '0', 10)`. So after init, streak is already `'0'` if it was missing.

4. **restoreFromBackup()**:  
   - Writes to streak keys and milestoneBadgesAwarded **only when the primary key is null** and backup has a value. So it restores from IndexedDB when localStorage was cleared; it does not overwrite existing primary data with empty.

---

## Test / Debug Files (Not Main App)

- **test-sanity.html**: Uses `exerciseLogs`, `streak`, `longestStreak`, `lastStreakDate` (raw) for tests.  
- **test-storage.html**: Uses test keys and `exerciseLogs_test`, `persistence_test`, etc.  
- **debug-streak.html**: Reads `exerciseLogs`, `customWorkouts`, `streak`, `longestStreak` (raw).  
- **simple.html**: Uses `check_in` and test key (separate from main app keys).

These do not define the production storage contract; the main app uses only the keys in the summary table above.

---

## Checkpoint for Task 1.1

You now have a complete map of:

- Every storage key and what it stores  
- Where each is read and written  
- What happens when the key is missing vs when the value is invalid JSON  

**Next (Task 1.2):** Refactor the storage get layer to return a status object (already done for `storage.get`); ensure all call sites that need to distinguish missing / ok / error use it. The plan says "Update ALL call sites that read from storage to use this new return type" — the wrapper already returns status; streak keys are still read via raw `localStorage` and may need to go through a similar status-based read path.
