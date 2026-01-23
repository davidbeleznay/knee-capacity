// Workouts Module - Exercise & Custom Workout Logging

function setupWorkoutHandlers() {
    const toggleEx = document.getElementById('toggle-exercises');
    const toggleCu = document.getElementById('toggle-custom');
    
    if (toggleEx) {
        const h = () => {
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

    const toggleTimerBtn = document.getElementById('toggle-form-timer');
    if (toggleTimerBtn) {
        toggleTimerBtn.onclick = () => {
            const timerDiv = document.getElementById('embedded-stopwatch');
            const isVisible = timerDiv.style.display !== 'none';
            timerDiv.style.display = isVisible ? 'none' : 'block';
            toggleTimerBtn.textContent = isVisible ? '⏱️ Show Timer' : '⏱️ Hide Timer';
        };
    }
}

function renderExerciseTiles() {
    const container = document.getElementById('exercise-tiles');
    if (!container) return;
    
    const kneeStatus = DataManager.getKneeStatus();
    
    // Define Relevance Groups based on Status
    let groups = [];
    if (kneeStatus === 'green') {
        groups = [
            { label: 'Recommended for Today (BUILD)', phases: ['BUILD'], type: 'recommended' },
            { label: 'Also Available (PRIME)', phases: ['PRIME'], type: 'available' },
            { label: 'Recovery & Maintenance (CALM)', phases: ['CALM'], type: 'other' }
        ];
    } else if (kneeStatus === 'yellow') {
        groups = [
            { label: 'Recommended for Today (CALM)', phases: ['CALM'], type: 'recommended' },
            { label: 'Available (Light BUILD)', phases: ['BUILD'], type: 'available' },
            { label: 'Other Exercises (PRIME)', phases: ['PRIME'], type: 'other' }
        ];
    } else { // RED or unknown
        groups = [
            { label: 'Recommended for Today (CALM)', phases: ['CALM'], type: 'recommended' },
            { label: 'Not Recommended Today (BUILD/PRIME)', phases: ['BUILD', 'PRIME'], type: 'not-recommended' }
        ];
    }

    // Filter exercises into groups
    const sections = groups.map(group => {
        const exercises = EXERCISES.filter(ex => {
            const phaseMatch = ex.phase.some(p => group.phases.includes(p.toUpperCase()));
            if (!phaseMatch) return false;
            if (ex.availability === 'GREEN-only' && kneeStatus !== 'green') return false;
            return true;
        });

        const categorized = {};
        exercises.forEach(ex => {
            if (!categorized[ex.category]) categorized[ex.category] = [];
            categorized[ex.category].push(ex);
        });

        return { ...group, categorized };
    }).filter(s => Object.keys(s.categorized).length > 0);

    let html = '';
    sections.forEach(section => {
        html += `<div class="relevance-section relevance-${section.type}" style="grid-column: 1/-1; margin-top: 20px; margin-bottom: 8px;">
            <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: var(--gray-600); border-bottom: 2px solid var(--gray-200); padding-bottom: 4px; margin-bottom: 12px;">
                ${section.label}
            </h3>
        </div>`;

        Object.keys(section.categorized).sort().forEach(cat => {
            section.categorized[cat].forEach(ex => {
                const icon = getExerciseIcon(ex.id);
                const name = ex.name.replace(' (Isometric)', '').replace(' (Eccentric)', '');
                const isNotRecommended = section.type === 'not-recommended';
                
                html += `
                    <div id="tile-${ex.id}" class="exercise-tile ${isNotRecommended ? 'not-recommended' : ''}" 
                         onclick="toggleExerciseDetails('${ex.id}')">
                        <div class="tile-header" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                            <div style="flex: 1;">
                                <div class="tile-category" style="font-size: 9px; text-transform: uppercase; color: var(--primary); font-weight: 800; margin-bottom: 4px;">${ex.category}</div>
                                <div class="tile-name" style="font-size: 14px; font-weight: 700;">${name}</div>
                                <div class="tile-meta" style="font-size: 12px; color: var(--gray-600);">${ex.dosage}</div>
                            </div>
                            <button class="plus-log-btn" onclick="event.stopPropagation(); selectExerciseForLogging('${ex.id}')" 
                                    style="width: 44px; height: 44px; border-radius: 50%; border: none; background: var(--primary); color: white; font-size: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                +
                            </button>
                        </div>
                        
                        <div class="tile-details" style="display: none; width: 100%; margin-top: 16px; border-top: 1px solid var(--gray-200); padding-top: 16px;">
                            <div style="margin-bottom: 12px;">
                                <strong style="font-size: 12px; text-transform: uppercase; color: var(--gray-600);">Setup:</strong>
                                <ul style="margin: 4px 0 0 16px; padding: 0; font-size: 13px; line-height: 1.4;">
                                    ${ex.setup.map(s => `<li>${s}</li>`).join('')}
                                </ul>
                            </div>
                            <div style="margin-bottom: 12px;">
                                <strong style="font-size: 12px; text-transform: uppercase; color: var(--gray-600);">Execution:</strong>
                                <ul style="margin: 4px 0 0 16px; padding: 0; font-size: 13px; line-height: 1.4;">
                                    ${ex.execution.map(e => `<li>${e}</li>`).join('')}
                                </ul>
                            </div>
                            <div style="font-size: 13px; margin-bottom: 8px;">
                                <strong>Target:</strong> ${ex.targetMuscles}
                            </div>
                            <div style="font-size: 13px; margin-bottom: 16px;">
                                <strong>Tempo:</strong> ${ex.tempo}
                            </div>
                            <button class="primary-button" onclick="event.stopPropagation(); selectExerciseForLogging('${ex.id}')" style="margin-top: 0;">
                                Log This Exercise
                            </button>
                        </div>
                    </div>
                `;
            });
        });
    });

    container.innerHTML = html;
}

function toggleExerciseDetails(id) {
    const allTiles = document.querySelectorAll('.exercise-tile');
    const targetTile = document.getElementById(`tile-${id}`);
    const targetDetails = targetTile.querySelector('.tile-details');
    const isExpanding = targetDetails.style.display === 'none';

    // Accordion: Collapse all others
    allTiles.forEach(tile => {
        tile.classList.remove('expanded');
        tile.querySelector('.tile-details').style.display = 'none';
    });

    if (isExpanding) {
        targetTile.classList.add('expanded');
        targetDetails.style.display = 'block';
        // Scroll into view if needed
        targetTile.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function selectExerciseForLogging(id) {
    AppState.selectedExercise = window.getExerciseById(id);
    if (!AppState.selectedExercise) return;
    
    document.getElementById('exercise-log-form').style.display = 'block';
    document.getElementById('exercise-tiles').style.display = 'none';
    document.getElementById('custom-workout-tiles').style.display = 'none';
    
    const ex = AppState.selectedExercise;
    document.getElementById('selected-exercise-name').textContent = ex.name;
    
    // Parse dosage string to extract sets/reps/hold
    const dosageParts = ex.dosage.match(/(\d+)\s*sets?\s*x\s*(\d+)(?:-(\d+))?\s*(?:reps?|s)?/i);
    if (dosageParts) {
        document.getElementById('sets-completed').value = parseInt(dosageParts[1]) || 3;
        document.getElementById('reps-completed').value = parseInt(dosageParts[2]) || 10;
    } else {
        document.getElementById('sets-completed').value = 3;
        document.getElementById('reps-completed').value = 10;
    }
    
    // Check if it's a hold-based exercise
    const isHold = ex.dosage.toLowerCase().includes('hold') || ex.dosage.includes('s');
    document.getElementById('hold-time').value = isHold ? 30 : 0;
    
    document.getElementById('weight-used').value = 0;
    document.getElementById('rpe-slider').value = 5;
    document.getElementById('rpe-value').textContent = '5';
    document.getElementById('exercise-pain-slider').value = 0;
    document.getElementById('exercise-pain-value').textContent = '0';
    document.getElementById('exercise-notes').value = '';
    
    document.getElementById('hold-tracker').style.display = isHold ? 'block' : 'none';
    renderExerciseTrends(id);
}

function closeExerciseForm() {
    document.getElementById('exercise-log-form').style.display = 'none';
    document.getElementById('exercise-tiles').style.display = 'grid';
    AppState.selectedExercise = null;
    
    // Reset timer UI if open
    const timerDiv = document.getElementById('embedded-stopwatch');
    if (timerDiv) timerDiv.style.display = 'none';
    const toggleBtn = document.getElementById('toggle-form-timer');
    if (toggleBtn) toggleBtn.textContent = '⏱️ Show Timer';
    if (typeof Stopwatch !== 'undefined') Stopwatch.reset();
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
        pain: parseInt(document.getElementById('exercise-pain-slider').value),
        lane: AppState.selectedLane,
        notes: document.getElementById('exercise-notes').value
    });
    
    const btn = document.getElementById('save-exercise');
    btn.textContent = 'Logged!';
    btn.style.background = '#4CAF50';
    setTimeout(() => { btn.textContent = 'Log'; btn.style.background = ''; closeExerciseForm(); renderTodaysSummary(); updateWeekSummary(); updateStreakDisplay(); }, 1000);
}

function selectCustomWorkout(type) {
    const names = { peloton: '🚴 Peloton', rowing: '🚣 Rowing', core: '🎯 Core', stretch: '🧘 Stretch', upper: '💪 Upper', bike: '🚴 Bike' };
    AppState.selectedCustomWorkout = type;
    document.getElementById('custom-workout-tiles').style.display = 'none';
    document.getElementById('custom-workout-form').style.display = 'block';
    document.getElementById('custom-workout-title').textContent = names[type] || 'Custom';
    
    const defaults = { 
        peloton: { duration: 30, intensity: 6, impact: 'none' }, 
        rowing: { duration: 20, intensity: 5, impact: 'none' }, 
        core: { duration: 15, intensity: 6, impact: 'none' }, 
        stretch: { duration: 10, intensity: 3, impact: 'none' },
        upper: { duration: 30, intensity: 6, impact: 'none' },
        bike: { duration: 45, intensity: 5, impact: 'none' }
    };
    const preset = defaults[type] || { duration: 20, intensity: 5, impact: 'none' };
    document.getElementById('custom-duration').value = preset.duration;
    document.getElementById('custom-intensity').value = preset.intensity;
    document.getElementById('custom-intensity-value').textContent = preset.intensity;
    document.querySelectorAll('.impact-btn').forEach(b => b.classList.remove('active'));
    
    const impactBtn = document.querySelector(`.impact-btn[data-impact="${preset.impact}"]`);
    if (impactBtn) impactBtn.classList.add('active');
    
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
        lane: AppState.selectedLane,
        notes: document.getElementById('custom-notes').value
    });
    const btn = document.getElementById('save-custom-workout');
    btn.textContent = 'Logged!';
    btn.style.background = '#4CAF50';
    setTimeout(() => { btn.textContent = 'Log'; btn.style.background = ''; closeCustomForm(); renderTodaysSummary(); updateStreakDisplay(); }, 1000);
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
        const icons = { peloton: '🚴', rowing: '🚣', core: '🎯', stretch: '🧘', upper: '💪', bike: '🚴' };
        html += `<div style="padding: 12px; background: #f5f5f5; border-radius: 10px; margin-bottom: 8px;">
            <div style="font-weight: 700;">${icons[w.workoutCategory] || '🏋️'} ${w.workoutType || w.workoutCategory}</div>
            <div style="font-size: 13px; color: #666; margin-top: 4px;">${w.durationMinutes}min • ${w.intensity}/10</div>
        </div>`;
    });
    exercises.forEach(log => {
        const icon = getExerciseIcon(log.exerciseId);
        const hold = log.holdTimeSeconds > 0 ? ` x ${log.holdTimeSeconds}s` : '';
        html += `<div style="padding: 12px; background: #f5f5f5; border-radius: 10px; margin-bottom: 8px;">
            <div style="font-weight: 700;">${icon} ${log.exerciseName.split('(')[0].trim()}</div>
            <div style="font-size: 13px; color: #666; margin-top: 4px;">${log.setsCompleted}x${log.repsPerSet}${hold}</div>
        </div>`;
    });
    container.innerHTML = html;
}

function renderExerciseTrends(id) {
    const history = DataManager.getExerciseHistory(id, 30);
    const container = document.getElementById('trend-chart');
    if (history.length < 2) { container.innerHTML = ''; return; }
    
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

    // Group exercises by category
    const categories = [...new Set(EXERCISES.map(ex => ex.category))].sort();
    
    container.innerHTML = categories.map(cat => {
        const catExercises = EXERCISES.filter(ex => ex.category === cat);
        return `
            <div class="category-section" style="margin-bottom: 24px;">
                <h3 style="background: var(--primary); color: white; padding: 8px 16px; border-radius: 8px; margin-bottom: 12px; font-size: 16px;">${cat}</h3>
                <div class="exercise-cards-grid">
                    ${catExercises.map(ex => `
                        <div class="exercise-card" style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <h4 style="margin: 0; color: var(--primary);">${ex.name}</h4>
                                <div style="display: flex; gap: 4px;">
                                    ${ex.phase.map(p => `<span class="tile-phase-badge badge-${p.toLowerCase()}">${p}</span>`).join('')}
                                    ${ex.availability === 'GREEN-only' ? '<span class="tile-phase-badge" style="background: #E8F5E9; color: #2E7D32; border: 1px solid #2E7D32;">GREEN ONLY</span>' : ''}
                                </div>
                            </div>
                            <p style="font-size: 14px; margin-bottom: 8px; line-height: 1.4;">${ex.description}</p>
                            <div style="font-size: 13px; color: var(--gray-600); margin-bottom: 8px;">
                                <strong>Target:</strong> ${ex.targetMuscles}
                            </div>
                            <div style="background: #f5f5f5; padding: 8px; border-radius: 6px; font-size: 13px;">
                                <strong>Why:</strong> ${ex.why}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}
