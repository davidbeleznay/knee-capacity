# Exercises / Stats screen crash – diagnosis

## How to capture the exact error

1. Open the app in the browser (e.g. `index.html` or your dev server).
2. Open DevTools → Console.
3. Tap **Log** (Exercises) or **Stats** in the bottom nav.
4. If it crashes, the console will show:

   **`[switchView] RENDER-TIME CRASH`** with:
   - `view`: `"log"` or `"history"`
   - `message`: the thrown error message
   - `stack`: full stack trace
   - `name`: error type (e.g. `TypeError`)

5. Copy that object and the stack trace for the exact file/line.

**Crash type:** This is a **render-time crash**, not a route/navigation crash. Navigation runs first (`switchView` updates the DOM and `AppState`). The crash happens inside the view-specific render calls (`renderExerciseTiles`, `renderTodaysSummary`, `renderAnalytics`, or `renderMeasurementSummary`).

---

## Likely errors and root causes (from code analysis)

### 1. Log view (Exercises) – `EXERCISES` undefined

- **Error:** `TypeError: Cannot read properties of undefined (reading 'filter')`
- **Where:** `app.bundle.js` (from `src/ui/workouts.js`), inside `renderExerciseTiles`, at the line that does **`EXERCISES.filter(ex => ...)`** (workouts.js ~line 110).
- **Cause:** `EXERCISES` is a global (from `exercises.js`). If that script didn’t load, or loads after the bundle, or the bundle is used without `exercises.js`, `EXERCISES` is `undefined` and `.filter` throws.
- **Check:** In console, run `typeof EXERCISES` and `typeof window.EXERCISES`. If either is `"undefined"`, this is the cause.

---

### 2. Stats view – `item.timestamp` undefined in workout frequency

- **Error:** `TypeError: Cannot read properties of undefined (reading 'split')`
- **Where:** `app.bundle.js` (from `src/ui/analytics.js`), inside `renderWorkoutFrequency`, at the line that does **`item.date || item.timestamp.split('T')[0]`** (analytics.js ~line 81).
- **Cause:** A workout or log entry in the list has no `date` and no `timestamp` (or `timestamp` is `null`/`undefined`). The code assumes at least one exists; when both are missing, `item.timestamp.split` throws.
- **Check:** After crash, in console: `DataManager.getExerciseLogs()` and `DataManager.getCustomWorkouts()`. Look for any item where both `item.date` and `item.timestamp` are missing.

---

### 3. Stats view – `e.exerciseName` or `e.date` undefined in history list

- **Error:** `TypeError: Cannot read properties of undefined (reading 'split')` or similar when building the history HTML.
- **Where:** `src/ui/analytics.js`, inside `renderHistory`, at the line that does **`e.exerciseName.split('(')[0].trim()`** (analytics.js ~line 303), or earlier when using `e.date` in filters.
- **Cause:** An exercise log entry is missing `exerciseName` or `date` (e.g. old/corrupt data or partial save). `.split` on `undefined` throws.
- **Check:** `DataManager.getExerciseLogs()` and look for entries without `exerciseName` or `date`.

---

### 4. Stats view – `getElementById` returns null

- **Error:** `TypeError: Cannot read properties of null (reading 'textContent')` (or `innerHTML`, etc.)
- **Where:** In `renderSummaryStats`, `renderWorkoutFrequency`, or other analytics functions that call `document.getElementById('...')` and then use the result without a null check.
- **Cause:** Expected DOM IDs are missing or different in your HTML (e.g. `total-workouts`, `workout-frequency-chart`, `history-list`). If the element doesn’t exist, the call returns `null` and the next property access throws.
- **Check:** Compare `index.html` with the IDs used in `src/ui/analytics.js` (e.g. `total-workouts`, `total-exercises`, `avg-pain`, `green-days`, `workout-frequency-chart`, `exercise-breakdown`, `history-list`, etc.).

---

## Root cause hypothesis (summary)

- **Exercises (Log) not accessible:** Most likely **#1** – `EXERCISES` is undefined when `renderExerciseTiles` runs (script order or missing `exercises.js`).
- **Stats (History) not accessible:** Most likely **#2** or **#3** – a workout/log item with missing `date`/`timestamp` or missing `exerciseName`/`date` in analytics/render code.

Confirm by reproducing with DevTools open and using the `[switchView] RENDER-TIME CRASH` log to get the exact `message`, `stack`, and `view`. The stack trace will point to the exact file and line (in the bundle or, if you use source maps, in the source file).
