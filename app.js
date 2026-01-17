// KneeCapacity - With Custom Workout Support

let selectedDuration = 600;
let selectedSwelling = null;
let selectedExercise = null;
let selectedCustomWorkout = null;
let selectedKneeImpact = 'none';
let currentKneeStatus = 'unknown';
let currentAnalyticsDays = 7;

document.addEventListener('DOMContentLoaded', () => {
    DataManager.init();
    currentKneeStatus = DataManager.getKneeStatus();
    updateRestStatus();
    updateStreakDisplay();
    updateKneeStatusCard();
    loadTodayCheckIn();
    setupEventListeners();
    setInterval(updateRestStatus, 60000);
    populateAnalyticsExerciseSelect();
});

function setupEventListeners() {
    // Existing listeners...
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedDuration = parseInt(e.target.dataset.duration);
            updateTimerDisplay(selectedDuration);
        });
    });
    
    document.getElementById('timer-action').addEventListener('click', () => {
        if (Timer.isRunning) {
            if (confirm('Stop session early?')) Timer.stop();
        } else {
            if (!DataManager.canTrain()) {
                alert('⏱️ Rest period not complete.\\n\\nBarr protocol: 6-8 hours between sessions');
                return;
            }
            Timer.start(selectedDuration);
        }
    });
    
    document.querySelectorAll('.swelling-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.swelling-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedSwelling = e.target.dataset.level;
        });
    });
    
    document.getElementById('pain-slider').addEventListener('input', (e) => {
        document.getElementById('pain-value').textContent = e.target.value;
    });
    
    document.getElementById('rpe-slider').addEventListener('input', (e) => {
        document.getElementById('rpe-value').textContent = e.target.value;
    });
    
    document.getElementById('custom-intensity').addEventListener('input', (e) => {
        document.getElementById('custom-intensity-value').textContent = e.target.value;
    });
    
    document.getElementById('save-checkin').addEventListener('click', saveCheckIn);
    document.getElementById('save-exercise').addEventListener('click', saveExerciseLog);
    document.getElementById('save-custom-workout').addEventListener('click', saveCustomWorkout);
    document.getElementById('close-form').addEventListener('click', closeExerciseForm);
    document.getElementById('close-custom-form').addEventListener('click', closeCustomForm);
    
    // Workout type selector
    document.querySelectorAll('.workout-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.workout-type-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const type = e.currentTarget.dataset.type;
            
            if (type === 'exercises') {
                document.getElementById('exercise-tiles').style.display = 'grid';
                document.getElementById('custom-workout-tiles').style.display = 'none';
            } else {
                document.getElementById('exercise-tiles').style.display = 'none';
                document.getElementById('custom-workout-tiles').style.display = 'grid';
            }
        });
    });
    
    // Impact buttons for custom workouts
    document.querySelectorAll('.impact-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.impact-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedKneeImpact = e.currentTarget.dataset.impact;
        });
    });
    
    document.getElementById('export-data').addEventListener('click', () => {
        DataManager.exportData();
        alert('✅ Data exported! Share with specialist.');
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchView(e.currentTarget.dataset.view));
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentAnalyticsDays = parseInt(e.target.dataset.days);
            renderAnalytics(currentAnalyticsDays);
        });
    });
    
    document.querySelectorAll('.phase-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.phase-tab').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderExerciseLibrary(e.target.dataset.phase);
        });
    });
    
    document.getElementById('analytics-exercise-select').addEventListener('change', (e) => {
        if (e.target.value) {
            renderIndividualExerciseAnalytics(e.target.value, currentAnalyticsDays);
        }
    });
}

window.adjustValue = (inputId, delta) => {
    const input = document.getElementById(inputId);
    let value = parseInt(input.value) || 0;
    value = Math.max(0, value + delta);
    
    if (inputId === 'sets-completed') value = Math.min(10, value);
    if (inputId === 'reps-completed') value = Math.min(50, value);
    if (inputId === 'hold-time') value = Math.min(120, value);
    if (inputId === 'weight-used') value = Math.min(500, value);
    if (inputId === 'custom-duration') value = Math.min(180, value);
    
    input.value = value;
};

// Custom Workout Functions
window.selectCustomWorkout = (workoutType) => {
    const workoutNames = {
        'peloton': '🚴 Peloton Ride',
        'rowing': '🚣 Rowing Session',
        'core': '🎯 Core Work',
        'stretch': '🧘 Stretching/Mobility',
        'upper': '💪 Upper Body',
        'other': '➕ Other Activity'
    };
    
    selectedCustomWorkout = workoutType;
    
    document.getElementById('custom-workout-tiles').style.display = 'none';
    document.getElementById('custom-workout-form').style.display = 'block';
    document.getElementById('custom-workout-title').textContent = workoutNames[workoutType];
    
    // Pre-fill common values based on workout type
    const defaults = {
        'peloton': { duration: 30, intensity: 6, impact: 'none' },
        'rowing': { duration: 20, intensity: 5, impact: 'none' },
        'core': { duration: 15, intensity: 6, impact: 'none' },
        'stretch': { duration: 10, intensity: 3, impact: 'none' },
        'upper': { duration: 30, intensity: 6, impact: 'none' },
        'other': { duration: 20, intensity: 5, impact: 'low' }
    };
    
    const preset = defaults[workoutType];
    document.getElementById('custom-duration').value = preset.duration;
    document.getElementById('custom-intensity').value = preset.intensity;
    document.getElementById('custom-intensity-value').textContent = preset.intensity;
    
    // Set impact button
    document.querySelectorAll('.impact-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.impact-btn[data-impact="${preset.impact}"]`).classList.add('active');
    selectedKneeImpact = preset.impact;
    
    // Clear form
    document.getElementById('custom-workout-type').value = '';
    document.getElementById('custom-notes').value = '';
    
    // Show recent history for this type
    renderCustomWorkoutHistory(workoutType);
    
    document.getElementById('custom-workout-form').scrollIntoView({ behavior: 'smooth' });
};

function closeCustomForm() {
    document.getElementById('custom-workout-form').style.display = 'none';
    document.getElementById('custom-workout-tiles').style.display = 'grid';
    selectedCustomWorkout = null;
}

function saveCustomWorkout() {
    if (!selectedCustomWorkout) return;
    
    const customWorkout = {
        workoutCategory: selectedCustomWorkout,
        workoutType: document.getElementById('custom-workout-type').value || selectedCustomWorkout,
        durationMinutes: parseInt(document.getElementById('custom-duration').value),
        intensity: parseInt(document.getElementById('custom-intensity').value),
        kneeImpact: selectedKneeImpact,
        notes: document.getElementById('custom-notes').value
    };
    
    DataManager.saveCustomWorkout(customWorkout);
    
    const btn = document.getElementById('save-custom-workout');
    btn.textContent = '✅ Logged!';
    btn.style.background = '#4CAF50';
    
    setTimeout(() => {
        btn.textContent = '✅ Log Workout';
        btn.style.background = '';
        closeCustomForm();
        renderTodaysSummary();
    }, 1000);
}

function renderCustomWorkoutHistory(category) {
    const history = DataManager.getCustomWorkoutHistory(category, 10);
    const container = document.getElementById('custom-history-list');
    
    if (history.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">No previous sessions</p>';
        return;
    }
    
    const avgDuration = (history.reduce((sum, w) => sum + w.durationMinutes, 0) / history.length).toFixed(0);
    const avgIntensity = (history.reduce((sum, w) => sum + w.intensity, 0) / history.length).toFixed(1);
    
    container.innerHTML = `
        <div style="background: var(--gray-50); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <strong>Recent Average:</strong> ${avgDuration} min @ ${avgIntensity}/10 intensity
        </div>
        ${history.slice(0, 5).map(w => {
            const date = new Date(w.date);
            const impactColors = { none: 'var(--green)', low: 'var(--yellow)', moderate: 'var(--orange)', high: 'var(--red)' };
            
            return `
                <div style="padding: 10px; background: var(--gray-50); border-radius: 8px; margin-bottom: 8px; font-size: 13px;">
                    <div style="font-weight: 700;">${date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</div>
                    <div style="color: var(--gray-600); margin-top: 4px;">
                        ${w.durationMinutes} min • Intensity ${w.intensity}/10 • 
                        <span style="color: ${impactColors[w.kneeImpact]};">●</span> ${w.kneeImpact} impact
                    </div>
                    ${w.workoutType !== w.workoutCategory ? `<div style="margin-top: 4px;"><em>${w.workoutType}</em></div>` : ''}
                </div>
            `;
        }).join('')}
    `;
}

function renderTodaysSummary() {
    const exercises = DataManager.getTodaysExerciseLogs();
    const customWorkouts = DataManager.getTodaysCustomWorkouts();
    const container = document.getElementById('todays-exercise-list');
    
    if (exercises.length === 0 && customWorkouts.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--gray-600); padding: 30px;">No workouts logged today<br><small>Tap a tile above to start</small></p>';
        return;
    }
    
    let html = '';
    
    // Custom workouts first
    if (customWorkouts.length > 0) {
        html += customWorkouts.map(w => {
            const icons = { peloton: '🚴', rowing: '🚣', core: '🎯', stretch: '🧘', upper: '💪', other: '➕' };
            const icon = icons[w.workoutCategory] || '🏃';
            const impactColors = { none: 'var(--green)', low: 'var(--yellow)', moderate: 'var(--orange)', high: 'var(--red)' };
            
            return `
                <div class="exercise-log-item">
                    <div style="display: flex; justify-content: space-between;">
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <div style="font-size: 28px;">${icon}</div>
                            <div>
                                <div style="font-weight: 700; font-size: 15px;">${w.workoutType || w.workoutCategory}</div>
                                <div style="font-size: 13px; color: var(--gray-600); margin-top: 2px;">
                                    ${w.durationMinutes} min • ${w.intensity}/10 intensity
                                </div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 11px; color: var(--gray-600);">
                                ${new Date(w.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            <div style="margin-top: 6px; font-size: 12px; font-weight: 700; color: ${impactColors[w.kneeImpact]};">
                                ${w.kneeImpact} impact
                            </div>
                        </div>
                    </div>
                    ${w.notes ? `<div style="font-size: 13px; font-style: italic; margin-top: 10px; color: var(--gray-600); padding-top: 10px; border-top: 1px solid var(--gray-200);">"${w.notes}"</div>` : ''}
                </div>
            `;
        }).join('');
    }
    
    // Then exercises
    if (exercises.length > 0) {
        html += exercises.map(log => {
            const icon = getExerciseIcon(log.exerciseId);
            const holdDisplay = log.holdTimeSeconds > 0 ? ` × ${log.holdTimeSeconds}s hold` : '';
            const weightDisplay = log.weightUsed > 0 ? ` @ ${log.weightUsed} lbs` : ' BW';
            const rpeColor = log.rpe >= 8 ? 'var(--red)' : log.rpe >= 6 ? 'var(--yellow)' : 'var(--green)';
            
            return `
                <div class="exercise-log-item">
                    <div style="display: flex; justify-content: space-between;">
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <div style="font-size: 24px;">${icon}</div>
                            <div>
                                <div style="font-weight: 700; font-size: 15px;">${log.exerciseName.split('(')[0].trim()}</div>
                                <div style="font-size: 13px; color: var(--gray-600); font-weight: 600; margin-top: 2px;">
                                    ${log.setsCompleted}×${log.repsPerSet}${holdDisplay}${weightDisplay}
                                </div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 11px; color: var(--gray-600);">
                                ${new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            <div style="margin-top: 4px; padding: 4px 8px; border-radius: 6px; background: ${rpeColor}; color: white; font-size: 12px; font-weight: 700;">
                                RPE ${log.rpe}
                            </div>
                        </div>
                    </div>
                    ${log.notes ? `<div style="font-size: 13px; font-style: italic; margin-top: 10px; color: var(--gray-600); padding-top: 10px; border-top: 1px solid var(--gray-200);">"${log.notes}"</div>` : ''}
                </div>
            `;
        }).join('');
    }
    
    container.innerHTML = html;
}

// Rest of existing functions...
[Previous app.js functions continue here - updateKneeStatusCard, renderExerciseTiles, etc.]

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${viewName}-view`).classList.add('active');
    document.querySelector(`.nav-btn[data-view="${viewName}"]`).classList.add('active');
    
    if (viewName === 'history') renderAnalytics(currentAnalyticsDays);
    if (viewName === 'exercises') renderExerciseLibrary('all');
    if (viewName === 'log') {
        renderExerciseTiles();
        renderTodaysSummary();
    }
}

window.App = { 
    updateRestStatus, 
    updateStreakDisplay, 
    updateTimerDisplay,
    updateKneeStatusCard
};
