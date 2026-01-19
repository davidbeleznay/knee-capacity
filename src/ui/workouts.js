// Workouts Module - Exercise & Custom Workout Logging

function setupWorkoutHandlers() {
    const toggleEx = document.getElementById('toggle-exercises');
    const toggleCu = document.getElementById('toggle-custom');
    
    if (toggleEx) {
        const h = () => {
            console.log('→ Exercises');
            toggleEx.classList.add('active');
            toggleCu.classList.remove('active');
            document.getElementById('exercise-tiles').style.display = 'grid';
            document.getElementById('custom-workout-tiles').style.display = 'none';
        };
        toggleEx.ontouchstart = h;
        toggleEx.onclick = h;
    }
    
    if (toggleCu) {
        const h = () => {
            console.log('→ Custom');
            toggleCu.classList.add('active');
            toggleEx.classList.remove('active');
            document.getElementById('exercise-tiles').style.display = 'none';
            document.getElementById('custom-workout-tiles').style.display = 'grid';
        };
        toggleCu.ontouchstart = h;
        toggleCu.onclick = h;
    }
    
    document.querySelectorAll('.impact-btn').forEach(btn => {
        const h = function() {
            document.querySelectorAll('.impact-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            AppState.kneeImpact = this.dataset.impact;
        };
        btn.ontouchstart = h;
        btn.onclick = h;
    });
    
    const rpeSlider = document.getElementById('rpe-slider');
    if (rpeSlider) rpeSlider.oninput = (e) => document.getElementById('rpe-value').textContent = e.target.value;
    
    const customIntensity = document.getElementById('custom-intensity');
    if (customIntensity) customIntensity.oninput = (e) => document.getElementById('custom-intensity-value').textContent = e.target.value;
    
    const saveEx = document.getElementById('save-exercise');
    if (saveEx) { saveEx.ontouchstart = saveExerciseLog; saveEx.onclick = saveExerciseLog; }
    
    const saveCust = document.getElementById('save-custom-workout');
    if (saveCust) { saveCust.ontouchstart = saveCustomWorkout; saveCust.onclick = saveCustomWorkout; }
    
    const closeForm = document.getElementById('close-form');
    if (closeForm) { closeForm.ontouchstart = closeExerciseForm; closeForm.onclick = closeExerciseForm; }
    
    const closeCust = document.getElementById('close-custom-form');
    if (closeCust) { closeCust.ontouchstart = closeCustomForm; closeCust.onclick = closeCustomForm; }
}

function renderExerciseTiles() {
    const container = document.getElementById('exercise-tiles');
    if (!container) return;
    
    const status = AppState.kneeStatus;
    const phaseMap = { 'green': ['Build', 'Prime'], 'yellow': ['Build', 'Calm'], 'red': ['Calm'], 'unknown': ['Calm', 'Build'] };
    
    const filtered = EXERCISES.filter(ex => ex.phase.some(p => phaseMap[status].includes(p)));
    
    container.innerHTML = filtered.map(ex => {
        const icon = getExerciseIcon(ex.id);
        const hold = ex.dosage.holdTime > 0 ? `×${ex.dosage.holdTime}s` : '';
        const name = ex.name.replace(' (Isometric)', '').replace(' (Eccentric)', '');
        
        return `<div class="exercise-tile" ontouchstart="selectExerciseForLogging('${ex.id}')" onclick="selectExerciseForLogging('${ex.id}')">
            <div><div class="tile-icon">${icon}</div><div class="tile-name">${name}</div></div>
            <div><div class="tile-meta">${ex.dosage.sets}×${ex.dosage.reps}${hold}</div></div>
        </div>`;
    }).join('');
}

function selectExerciseForLogging(id) {
    AppState.selectedExercise = window.getExerciseById(id);
    if (!AppState.selectedExercise) return;
    
    document.getElementById('exercise-log-form').style.display = 'block';
    document.getElementById('exercise-tiles').style.display = 'none';
    document.getElementById('custom-workout-tiles').style.display = 'none';
    
    const ex = AppState.selectedExercise;
    document.getElementById('selected-exercise-name').textContent = ex.name;
    document.getElementById('sets-completed').value = ex.dosage.sets;
    document.getElementById('reps-completed').value = ex.dosage.reps;
    document.getElementById('hold-time').value = ex.dosage.holdTime;
    document.getElementById('weight-used').value = 0;
    document.getElementById('rpe-slider').value = 5;
    document.getElementById('rpe-value').textContent = '5';
    document.getElementById('exercise-notes').value = '';
    
    document.getElementById('hold-tracker').style.display = ex.dosage.holdTime > 0 ? 'block' : 'none';
    renderExerciseTrends(id);
}

function closeExerciseForm() {
    document.getElementById('exercise-log-form').style.display = 'none';
    document.getElementById('exercise-tiles').style.display = 'grid';
    AppState.selectedExercise = null;
}

function saveExerciseLog() {
    if (!AppState.selectedExercise) return;
    
    DataManager.saveExerciseLog({
        exerciseId: AppState.selectedExercise.id,
        exerciseName: AppState.selectedExercise.name,
        setsCompleted: parseInt(document.getElementById('sets-completed').value),
        repsPerSet: parseInt(document.getElementById('reps-completed').value),
        holdTimeSeconds: parseInt(document.getElementById('hold-time').value),
        weightUsed: parseInt(document.getElementById('weight-used').value),
        rpe: parseInt(document.getElementById('rpe-slider').value),
        notes: document.getElementById('exercise-notes').value
    });
    
    const btn = document.getElementById('save-exercise');
    btn.textContent = '✅ Logged!';
    btn.style.background = '#4CAF50';
    setTimeout(() => { btn.textContent = '✅ Log'; btn.style.background = ''; closeExerciseForm(); renderTodaysSummary(); updateWeekSummary(); }, 1000);
}

function selectCustomWorkout(type) {
    const names = { peloton: '🚴 Peloton', rowing: '🚣 Rowing', core: '🎯 Core', stretch: '🧘 Stretch' };
    AppState.selectedCustomWorkout = type;
    document.getElementById('custom-workout-tiles').style.display = 'none';
    document.getElementById('custom-workout-form').style.display = 'block';
    document.getElementById('custom-workout-title').textContent = names[type];
    
    const defaults = { peloton: { duration: 30, intensity: 6, impact: 'none' }, rowing: { duration: 20, intensity: 5, impact: 'none' }, core: { duration: 15, intensity: 6, impact: 'none' }, stretch: { duration: 10, intensity: 3, impact: 'none' } };
    const preset = defaults[type];
    document.getElementById('custom-duration').value = preset.duration;
    document.getElementById('custom-intensity').value = preset.intensity;
    document.getElementById('custom-intensity-value').textContent = preset.intensity;
    document.querySelectorAll('.impact-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.impact-btn[data-impact="${preset.impact}"]`).classList.add('active');
    AppState.kneeImpact = preset.impact;
}

function closeCustomForm() {
    document.getElementById('custom-workout-form').style.display = 'none';
    document.getElementById('custom-workout-tiles').style.display = 'grid';
    AppState.selectedCustomWorkout = null;
}

function saveCustomWorkout() {
    if (!AppState.selectedCustomWorkout) return;
    DataManager.saveCustomWorkout({
        workoutCategory: AppState.selectedCustomWorkout,
        workoutType: document.getElementById('custom-workout-type').value || AppState.selectedCustomWorkout,
        durationMinutes: parseInt(document.getElementById('custom-duration').value),
        intensity: parseInt(document.getElementById('custom-intensity').value),
        kneeImpact: AppState.kneeImpact,
        notes: document.getElementById('custom-notes').value
    });
    const btn = document.getElementById('save-custom-workout');
    btn.textContent = '✅ Logged!';
    btn.style.background = '#4CAF50';
    setTimeout(() => { btn.textContent = '✅ Log'; btn.style.background = ''; closeCustomForm(); renderTodaysSummary(); }, 1000);
}

function renderTodaysSummary() {
    const exercises = DataManager.getTodaysExerciseLogs();
    const custom = DataManager.getTodaysCustomWorkouts();
    const container = document.getElementById('todays-exercise-list');
    
    if (exercises.length === 0 && custom.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 30px;">None yet</p>';
        return;
    }
    
    let html = '';
    custom.forEach(w => {
        const icons = { peloton: '🚴', rowing: '🚣', core: '🎯', stretch: '🧘' };
        html += `<div style="padding: 12px; background: #f5f5f5; border-radius: 10px; margin-bottom: 8px;">
            <div style="font-weight: 700;">${icons[w.workoutCategory]} ${w.workoutType || w.workoutCategory}</div>
            <div style="font-size: 13px; color: #666; margin-top: 4px;">${w.durationMinutes}min • ${w.intensity}/10</div>
        </div>`;
    });
    exercises.forEach(log => {
        const icon = getExerciseIcon(log.exerciseId);
        const hold = log.holdTimeSeconds > 0 ? ` × ${log.holdTimeSeconds}s` : '';
        html += `<div style="padding: 12px; background: #f5f5f5; border-radius: 10px; margin-bottom: 8px;">
            <div style="font-weight: 700;">${icon} ${log.exerciseName.split('(')[0].trim()}</div>
            <div style="font-size: 13px; color: #666; margin-top: 4px;">${log.setsCompleted}×${log.repsPerSet}${hold}</div>
        </div>`;
    });
    container.innerHTML = html;
}

function renderExerciseTrends(id) {
    const history = DataManager.getExerciseHistory(id, 30);
    const container = document.getElementById('trend-chart');
    if (history.length < 2) { container.innerHTML = '<p style="text-align: center; padding: 20px;">Log more</p>'; return; }
    
    const recent = history.slice(0, 10).reverse();
    const metric = recent.some(h => h.holdTimeSeconds > 0) ? 'hold' : 'reps';
    const getValue = (l) => metric === 'hold' ? l.holdTimeSeconds : l.repsPerSet;
    const values = recent.map(getValue);
    const max = Math.max(...values);
    const avg = (values.reduce((a,b) => a+b, 0) / values.length).toFixed(1);
    
    container.innerHTML = `<div style="text-align: center; margin-bottom: 12px;"><div>Avg: <strong style="color: #2E7D32; font-size: 18px;">${avg}</strong> ${metric === 'hold' ? 's' : 'reps'}</div></div>
        <div class="chart-row">${recent.map((l, i) => {
            const val = getValue(l);
            const height = max > 0 ? (val / max) * 100 : 0;
            const improved = i > 0 && val > getValue(recent[i-1]);
            return `<div class="chart-bar" style="height: ${height}%; background: ${improved ? '#4CAF50' : '#2E7D32'};">
                <span class="chart-value">${val}</span><span class="chart-label">${new Date(l.date).getDate()}</span></div>`;
        }).join('')}</div>`;
}

function renderExerciseLibrary() {
    const container = document.getElementById('exercise-library');
    if (!container) return;
    container.innerHTML = EXERCISES.map(ex => `<div class="exercise-card">
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <div style="font-size: 40px;">${getExerciseIcon(ex.id)}</div>
            <div><h3>${ex.name}</h3><p style="font-size: 13px; color: #666;">${ex.category}</p></div>
        </div><p>${ex.description}</p>
        <div style="background: #E8F5E9; padding: 14px; border-radius: 10px; margin-top: 12px;">
            <strong>Why:</strong> ${ex.why}</div></div>`).join('');
}
