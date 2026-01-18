// KneeCapacity - Simplified with Stopwatch

let selectedSwelling = null;
let selectedExercise = null;
let selectedCustomWorkout = null;
let selectedKneeImpact = 'none';
let currentKneeStatus = 'unknown';
let currentAnalyticsDays = 7;

document.addEventListener('DOMContentLoaded', () => {
    DataManager.init();
    currentKneeStatus = DataManager.getKneeStatus();
    updateStreakDisplay();
    updateKneeStatusCard();
    updateWeekSummary();
    loadTodayCheckIn();
    setupEventListeners();
    populateAnalyticsExerciseSelect();
});

function setupEventListeners() {
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
    
    document.querySelectorAll('.impact-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.impact-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedKneeImpact = e.currentTarget.dataset.impact;
        });
    });
    
    document.getElementById('export-data').addEventListener('click', () => {
        DataManager.exportData();
        alert('✅ Exported!');
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
        if (e.target.value) renderIndividualExerciseAnalytics(e.target.value, currentAnalyticsDays);
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

function updateWeekSummary() {
    const container = document.getElementById('week-summary');
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const weekData = DataManager.getRecentCheckIns(7);
    const weekExercises = DataManager.getExerciseLogs().filter(e => new Date(e.date) >= weekStart);
    const weekCustom = DataManager.getCustomWorkouts().filter(w => new Date(w.date) >= weekStart);
    
    const greenDays = weekData.filter(c => DataManager.getKneeStatusForCheckIn(c) === 'GREEN').length;
    const avgPain = weekData.length > 0 ? 
        (weekData.reduce((sum, c) => sum + (c.pain || 0), 0) / weekData.length).toFixed(1) : 0;
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div style="text-align: center; padding: 12px; background: var(--gray-50); border-radius: 10px;">
                <div style="font-size: 24px; font-weight: 800; color: var(--primary);">${greenDays}</div>
                <div style="font-size: 12px; color: var(--gray-600);">Green Days</div>
            </div>
            <div style="text-align: center; padding: 12px; background: var(--gray-50); border-radius: 10px;">
                <div style="font-size: 24px; font-weight: 800; color: var(--primary);">${avgPain}</div>
                <div style="font-size: 12px; color: var(--gray-600);">Avg Pain</div>
            </div>
            <div style="text-align: center; padding: 12px; background: var(--gray-50); border-radius: 10px;">
                <div style="font-size: 24px; font-weight: 800; color: var(--primary);">${weekExercises.length}</div>
                <div style="font-size: 12px; color: var(--gray-600);">Exercises</div>
            </div>
            <div style="text-align: center; padding: 12px; background: var(--gray-50); border-radius: 10px;">
                <div style="font-size: 24px; font-weight: 800; color: var(--primary);">${weekCustom.length}</div>
                <div style="font-size: 12px; color: var(--gray-600);">Workouts</div>
            </div>
        </div>
    `;
}

function updateKneeStatusCard() {
    const statusInfo = DataManager.getKneeStatusMessage();
    const status = DataManager.getKneeStatus();
    currentKneeStatus = status;
    
    const card = document.getElementById('knee-status-card');
    card.className = `status-card status-${status} text-center`;
    card.innerHTML = `
        <div class="status-icon">${statusInfo.icon}</div>
        <h2>${statusInfo.title}</h2>
        <p style="font-size: 16px; margin: 12px 0;">${statusInfo.message}</p>
        <div style="background: rgba(0,0,0,0.05); padding: 12px; border-radius: 10px; margin-top: 12px;">
            <strong>Plan:</strong> ${statusInfo.action}
        </div>
    `;
    
    const modeBadge = document.getElementById('current-mode-badge');
    if (modeBadge) {
        modeBadge.className = `mode-badge mode-${status}`;
        modeBadge.textContent = status.toUpperCase();
    }
}

function renderExerciseTiles() {
    const container = document.getElementById('exercise-tiles');
    const status = currentKneeStatus;
    
    const phaseMap = {
        'green': ['Build', 'Prime'],
        'yellow': ['Build', 'Calm'],
        'red': ['Calm'],
        'unknown': ['Calm', 'Build']
    };
    
    const filtered = EXERCISES.filter(ex => ex.phase.some(p => phaseMap[status].includes(p)));
    
    container.innerHTML = filtered.map(ex => {
        const icon = getExerciseIcon(ex.id);
        const hold = ex.dosage.holdTime > 0 ? `×${ex.dosage.holdTime}s` : '';
        
        return `
            <div class="exercise-tile" onclick="selectExerciseForLogging('${ex.id}')">
                <div>
                    <div class="tile-icon">${icon}</div>
                    <div class="tile-name">${ex.name.replace(' (Isometric)', '').replace(' (Eccentric)', '')}</div>
                </div>
                <div>
                    <div class="tile-meta">${ex.dosage.sets}×${ex.dosage.reps}${hold}</div>
                    <span class="tile-phase-badge badge-${ex.phase[0].toLowerCase()}">${ex.phase[0]}</span>
                </div>
            </div>
        `;
    }).join('');
}

function getExerciseIcon(id) {
    const icons = {
        'spanish-squat': '🔷', 'wall-sit': '🧱', 'step-downs': '📉',
        'single-leg-rdl': '🦵', 'hamstring-bridge': '🌉', 'tke': '⚡',
        'lateral-band-walk': '↔️', 'mini-squat': '⬇️', 'calf-raise': '👟',
        'balance-single-leg': '⚖️', 'quad-sets': '💪', 'heel-slides': '↕️'
    };
    return icons[id] || '💪';
}

window.selectExerciseForLogging = (id) => {
    selectedExercise = window.getExerciseById(id);
    if (!selectedExercise) return;
    
    document.getElementById('exercise-log-form').style.display = 'block';
    document.getElementById('exercise-tiles').style.display = 'none';
    document.getElementById('custom-workout-tiles').style.display = 'none';
    
    document.getElementById('selected-exercise-name').textContent = selectedExercise.name;
    document.getElementById('sets-completed').value = selectedExercise.dosage.sets;
    document.getElementById('reps-completed').value = selectedExercise.dosage.reps;
    document.getElementById('hold-time').value = selectedExercise.dosage.holdTime;
    document.getElementById('weight-used').value = 0;
    document.getElementById('rpe-slider').value = 5;
    document.getElementById('rpe-value').textContent = '5';
    document.getElementById('exercise-notes').value = '';
    
    document.getElementById('hold-tracker').style.display = selectedExercise.dosage.holdTime > 0 ? 'block' : 'none';
    
    renderExerciseTrends(id);
    document.getElementById('exercise-log-form').scrollIntoView({ behavior: 'smooth' });
};

function closeExerciseForm() {
    document.getElementById('exercise-log-form').style.display = 'none';
    const activeType = document.querySelector('.workout-type-btn.active').dataset.type;
    if (activeType === 'exercises') {
        document.getElementById('exercise-tiles').style.display = 'grid';
    } else {
        document.getElementById('custom-workout-tiles').style.display = 'grid';
    }
    selectedExercise = null;
}

function saveExerciseLog() {
    if (!selectedExercise) return;
    
    DataManager.saveExerciseLog({
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
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
    
    setTimeout(() => {
        btn.textContent = '✅ Log';
        btn.style.background = '';
        closeExerciseForm();
        renderTodaysSummary();
        updateWeekSummary();
    }, 1000);
}

window.selectCustomWorkout = (type) => {
    const names = {
        'peloton': '🚴 Peloton', 'rowing': '🚣 Rowing', 'core': '🎯 Core',
        'stretch': '🧘 Stretch', 'upper': '💪 Upper', 'bike': '🚴 Bike'
    };
    
    selectedCustomWorkout = type;
    document.getElementById('custom-workout-tiles').style.display = 'none';
    document.getElementById('exercise-tiles').style.display = 'none';
    document.getElementById('custom-workout-form').style.display = 'block';
    document.getElementById('custom-workout-title').textContent = names[type];
    
    const defaults = {
        'peloton': { duration: 30, intensity: 6, impact: 'none' },
        'rowing': { duration: 20, intensity: 5, impact: 'none' },
        'core': { duration: 15, intensity: 6, impact: 'none' },
        'stretch': { duration: 10, intensity: 3, impact: 'none' },
        'upper': { duration: 30, intensity: 6, impact: 'none' },
        'bike': { duration: 20, intensity: 4, impact: 'none' }
    };
    
    const preset = defaults[type];
    document.getElementById('custom-duration').value = preset.duration;
    document.getElementById('custom-intensity').value = preset.intensity;
    document.getElementById('custom-intensity-value').textContent = preset.intensity;
    
    document.querySelectorAll('.impact-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.impact-btn[data-impact="${preset.impact}"]`).classList.add('active');
    selectedKneeImpact = preset.impact;
    
    document.getElementById('custom-workout-type').value = '';
    document.getElementById('custom-notes').value = '';
    
    renderCustomWorkoutHistory(type);
    document.getElementById('custom-workout-form').scrollIntoView({ behavior: 'smooth' });
};

function closeCustomForm() {
    document.getElementById('custom-workout-form').style.display = 'none';
    document.getElementById('custom-workout-tiles').style.display = 'grid';
    selectedCustomWorkout = null;
}

function saveCustomWorkout() {
    if (!selectedCustomWorkout) return;
    
    DataManager.saveCustomWorkout({
        workoutCategory: selectedCustomWorkout,
        workoutType: document.getElementById('custom-workout-type').value || selectedCustomWorkout,
        durationMinutes: parseInt(document.getElementById('custom-duration').value),
        intensity: parseInt(document.getElementById('custom-intensity').value),
        kneeImpact: selectedKneeImpact,
        notes: document.getElementById('custom-notes').value
    });
    
    const btn = document.getElementById('save-custom-workout');
    btn.textContent = '✅ Logged!';
    btn.style.background = '#4CAF50';
    
    setTimeout(() => {
        btn.textContent = '✅ Log';
        btn.style.background = '';
        closeCustomForm();
        renderTodaysSummary();
        updateWeekSummary();
    }, 1000);
}

function renderCustomWorkoutHistory(category) {
    const history = DataManager.getCustomWorkoutHistory(category, 5);
    const container = document.getElementById('custom-history-list');
    
    if (history.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">None yet</p>';
        return;
    }
    
    const avgDuration = (history.reduce((sum, w) => sum + w.durationMinutes, 0) / history.length).toFixed(0);
    const avgIntensity = (history.reduce((sum, w) => sum + w.intensity, 0) / history.length).toFixed(1);
    
    container.innerHTML = `
        <div style="background: var(--gray-50); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <strong>Avg:</strong> ${avgDuration}min @ ${avgIntensity}/10
        </div>
        ${history.map(w => {
            const date = new Date(w.date);
            const colors = { none: 'var(--green)', low: 'var(--yellow)', moderate: 'var(--orange)', high: 'var(--red)' };
            
            return `
                <div style="padding: 10px; background: var(--gray-50); border-radius: 8px; margin-bottom: 8px; font-size: 13px;">
                    <div style="font-weight: 700;">${date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</div>
                    <div style="color: var(--gray-600); margin-top: 4px;">
                        ${w.durationMinutes}min • ${w.intensity}/10 • <span style="color: ${colors[w.kneeImpact]};">●</span>
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

function renderTodaysSummary() {
    const exercises = DataManager.getTodaysExerciseLogs();
    const custom = DataManager.getTodaysCustomWorkouts();
    const container = document.getElementById('todays-exercise-list');
    
    if (exercises.length === 0 && custom.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--gray-600); padding: 30px;">None yet</p>';
        return;
    }
    
    let html = '';
    
    if (custom.length > 0) {
        html += custom.map(w => {
            const icons = { peloton: '🚴', rowing: '🚣', core: '🎯', stretch: '🧘', upper: '💪', bike: '🚴' };
            const colors = { none: 'var(--green)', low: 'var(--yellow)', moderate: 'var(--orange)', high: 'var(--red)' };
            
            return `
                <div class="exercise-log-item">
                    <div style="display: flex; justify-content: space-between;">
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <div style="font-size: 28px;">${icons[w.workoutCategory]}</div>
                            <div>
                                <div style="font-weight: 700;">${w.workoutType || w.workoutCategory}</div>
                                <div style="font-size: 13px; color: var(--gray-600);">${w.durationMinutes}min • ${w.intensity}/10</div>
                            </div>
                        </div>
                        <div style="padding: 4px 10px; border-radius: 8px; background: ${colors[w.kneeImpact]}; color: white; font-size: 12px; font-weight: 700; height: fit-content;">
                            ${w.kneeImpact}
                        </div>
                    </div>
                    ${w.notes ? `<div style="font-size: 13px; font-style: italic; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--gray-200);">"${w.notes}"</div>` : ''}
                </div>
            `;
        }).join('');
    }
    
    if (exercises.length > 0) {
        html += exercises.map(log => {
            const icon = getExerciseIcon(log.exerciseId);
            const hold = log.holdTimeSeconds > 0 ? ` × ${log.holdTimeSeconds}s` : '';
            const weight = log.weightUsed > 0 ? ` @ ${log.weightUsed}lb` : '';
            const rpeColor = log.rpe >= 8 ? 'var(--red)' : log.rpe >= 6 ? 'var(--yellow)' : 'var(--green)';
            
            return `
                <div class="exercise-log-item">
                    <div style="display: flex; justify-content: space-between;">
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <div style="font-size: 24px;">${icon}</div>
                            <div>
                                <div style="font-weight: 700;">${log.exerciseName.split('(')[0].trim()}</div>
                                <div style="font-size: 13px; color: var(--gray-600);">${log.setsCompleted}×${log.repsPerSet}${hold}${weight}</div>
                            </div>
                        </div>
                        <div style="padding: 4px 10px; border-radius: 8px; background: ${rpeColor}; color: white; font-size: 12px; font-weight: 700; height: fit-content;">
                            ${log.rpe}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    container.innerHTML = html;
}

function renderExerciseTrends(id) {
    const history = DataManager.getExerciseHistory(id, 30);
    const container = document.getElementById('trend-chart');
    
    if (history.length < 2) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">Log a few times to see trends</p>';
        return;
    }
    
    const recent = history.slice(0, 10).reverse();
    const hasWeight = recent.some(h => h.weightUsed > 0);
    const hasHold = recent.some(h => h.holdTimeSeconds > 0);
    
    const metric = hasWeight ? 'weight' : hasHold ? 'hold' : 'reps';
    const getValue = (l) => metric === 'weight' ? l.weightUsed : metric === 'hold' ? l.holdTimeSeconds : l.repsPerSet;
    
    const values = recent.map(getValue);
    const max = Math.max(...values);
    const avg = (values.reduce((a,b) => a+b, 0) / values.length).toFixed(1);
    
    const labels = { weight: 'Weight (lbs)', hold: 'Hold (sec)', reps: 'Reps' };
    
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 12px;">
            <div style="font-weight: 600; color: var(--gray-600);">${labels[metric]}</div>
            <div style="font-size: 14px;">Avg: <strong style="color: var(--primary); font-size: 18px;">${avg}</strong></div>
        </div>
        <div class="chart-row">
            ${recent.map((l, i) => {
                const val = getValue(l);
                const height = max > 0 ? (val / max) * 100 : 0;
                const improved = i > 0 && val > getValue(recent[i-1]);
                const color = improved ? 'var(--green)' : 'var(--primary)';
                
                return `
                    <div class="chart-bar" style="height: ${height}%; background: ${color};">
                        <span class="chart-value">${val}</span>
                        <span class="chart-label">${new Date(l.date).getDate()}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function populateAnalyticsExerciseSelect() {
    const select = document.getElementById('analytics-exercise-select');
    EXERCISES.forEach(ex => {
        const option = document.createElement('option');
        option.value = ex.id;
        option.textContent = ex.name;
        select.appendChild(option);
    });
}

function renderAnalytics(days) {
    renderSummaryStats(days);
    renderSwellingTrend(days);
    renderPainTrend(days);
    renderWorkoutFrequency(days);
    renderExerciseBreakdown(days);
    renderHistory(days);
}

function renderSummaryStats(days) {
    const exercises = DataManager.getExerciseLogs().filter(e => (new Date() - new Date(e.date)) / (1000*60*60*24) <= days);
    const custom = DataManager.getCustomWorkouts().filter(w => (new Date() - new Date(w.date)) / (1000*60*60*24) <= days);
    const checkIns = DataManager.getRecentCheckIns(days);
    
    const avgPain = checkIns.length > 0 ? 
        (checkIns.reduce((sum, c) => sum + (c.pain || 0), 0) / checkIns.length).toFixed(1) : 0;
    const greenDays = checkIns.filter(c => DataManager.getKneeStatusForCheckIn(c) === 'GREEN').length;
    
    document.getElementById('total-workouts').textContent = exercises.length + custom.length;
    document.getElementById('total-exercises').textContent = exercises.length;
    document.getElementById('avg-pain').textContent = avgPain;
    document.getElementById('green-days').textContent = greenDays;
}

function renderWorkoutFrequency(days) {
    const exercises = DataManager.getExerciseLogs();
    const custom = DataManager.getCustomWorkouts();
    const container = document.getElementById('workout-frequency-chart');
    
    const dateMap = {};
    [...exercises, ...custom].forEach(item => {
        const date = item.date || item.timestamp.split('T')[0];
        dateMap[date] = (dateMap[date] || 0) + 1;
    });
    
    const daysArray = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        daysArray.push({ date: dateStr, count: dateMap[dateStr] || 0 });
    }
    
    const max = Math.max(...daysArray.map(d => d.count), 1);
    
    container.innerHTML = `
        <div class="chart-row" style="height: 100px;">
            ${daysArray.map(d => {
                const height = (d.count / max) * 100 || 5;
                const color = d.count === 0 ? 'var(--gray-300)' : 
                             d.count === 1 ? 'var(--green)' : 
                             d.count === 2 ? 'var(--primary)' : 'var(--orange)';
                
                return `
                    <div class="chart-bar" style="height: ${height}%; background: ${color}; min-height: 8px;">
                        ${d.count > 0 ? `<span class="chart-value">${d.count}</span>` : ''}
                        <span class="chart-label">${new Date(d.date).getDate()}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderExerciseBreakdown(days) {
    const exercises = DataManager.getExerciseLogs().filter(e => (new Date() - new Date(e.date)) / (1000*60*60*24) <= days);
    const container = document.getElementById('exercise-breakdown');
    
    if (exercises.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">None yet</p>';
        return;
    }
    
    const counts = {};
    exercises.forEach(e => counts[e.exerciseId] = (counts[e.exerciseId] || 0) + 1);
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0][1];
    
    container.innerHTML = sorted.map(([id, count]) => {
        const ex = window.getExerciseById(id);
        const icon = getExerciseIcon(id);
        const width = (count / max) * 100;
        
        return `
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-weight: 600;">${icon} ${ex.name.split('(')[0].trim()}</span>
                    <span style="color: var(--primary); font-weight: 700;">${count}×</span>
                </div>
                <div style="height: 8px; background: var(--gray-200); border-radius: 4px;">
                    <div style="height: 100%; width: ${width}%; background: var(--primary); border-radius: 4px;"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderIndividualExerciseAnalytics(id, days) {
    const history = DataManager.getExerciseHistory(id, days);
    const container = document.getElementById('exercise-analytics');
    
    if (history.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">No data</p>';
        return;
    }
    
    const icon = getExerciseIcon(id);
    const total = history.length;
    const avgSets = (history.reduce((s, h) => s + h.setsCompleted, 0) / total).toFixed(1);
    const avgReps = (history.reduce((s, h) => s + h.repsPerSet, 0) / total).toFixed(1);
    const avgHold = (history.reduce((s, h) => s + (h.holdTimeSeconds || 0), 0) / total).toFixed(1);
    const avgWeight = (history.reduce((s, h) => s + (h.weightUsed || 0), 0) / total).toFixed(1);
    const avgRPE = (history.reduce((s, h) => s + h.rpe, 0) / total).toFixed(1);
    
    const recent = history.slice(0, 10).reverse();
    
    container.innerHTML = `
        <div style="text-align: center; font-size: 40px; margin: 20px 0;">${icon}</div>
        
        <div style="background: var(--gray-50); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 14px;">
                <div><div style="color: var(--gray-600);">Sessions</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${total}</div></div>
                <div><div style="color: var(--gray-600);">RPE</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgRPE}</div></div>
                <div><div style="color: var(--gray-600);">Sets</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgSets}</div></div>
                <div><div style="color: var(--gray-600);">Reps</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgReps}</div></div>
                ${avgHold > 0 ? `<div><div style="color: var(--gray-600);">Hold</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgHold}s</div></div>` : ''}
                ${avgWeight > 0 ? `<div><div style="color: var(--gray-600);">Weight</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgWeight}lb</div></div>` : ''}
            </div>
        </div>
        
        ${avgHold > 0 ? renderMetricTrend(recent, 'hold', 'Hold Time (s)') : ''}
        ${avgWeight > 0 ? renderMetricTrend(recent, 'weight', 'Weight (lbs)') : ''}
        ${renderMetricTrend(recent, 'rpe', 'RPE')}
    `;
}

function renderMetricTrend(sessions, metric, label) {
    const getValue = (l) => metric === 'weight' ? l.weightUsed : metric === 'hold' ? l.holdTimeSeconds : l.rpe;
    const values = sessions.map(getValue);
    const max = Math.max(...values, 1);
    const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
    
    return `
        <div style="margin-top: 20px;">
            <div style="font-weight: 700; margin-bottom: 8px;">${label}</div>
            <div style="text-align: center; font-size: 13px; margin-bottom: 8px;">
                Avg: <strong style="color: var(--primary)">${avg}</strong>
            </div>
            <div class="chart-row" style="height: 120px;">
                ${sessions.map((l, i) => {
                    const val = getValue(l);
                    const height = (val / max) * 100;
                    const improved = i > 0 && val > getValue(sessions[i-1]);
                    const color = metric === 'rpe' ? 
                        (val >= 8 ? 'var(--red)' : val >= 6 ? 'var(--yellow)' : 'var(--green)') :
                        improved ? 'var(--green)' : 'var(--primary)';
                    
                    return `
                        <div class="chart-bar" style="height: ${height}%; background: ${color};">
                            <span class="chart-value">${val}</span>
                            <span class="chart-label">${new Date(l.date).getDate()}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderSwellingTrend(days) {
    const checkIns = DataManager.getRecentCheckIns(days);
    const container = document.getElementById('swelling-chart');
    
    if (checkIns.length < 2) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">Track more</p>';
        return;
    }
    
    const values = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
    const reversed = [...checkIns].reverse();
    
    container.innerHTML = `
        <div class="chart-row">
            ${reversed.map(c => {
                const val = values[c.swelling] || 0;
                const height = (val / 3) * 100 || 5;
                const colors = ['var(--green)', 'var(--yellow)', 'var(--orange)', 'var(--red)'];
                
                return `
                    <div class="chart-bar" style="height: ${height}%; background: ${colors[val]}; min-height: 10px;">
                        <span class="chart-label">${new Date(c.date).getDate()}</span>
                    </div>
                `;
            }).join('')}
        </div>
        <div style="text-align: center; margin-top: 16px; font-size: 13px;">
            🟢 None | 🟡 Mild | 🟠 Mod | 🔴 Severe
        </div>
    `;
}

function renderPainTrend(days) {
    const checkIns = DataManager.getRecentCheckIns(days);
    const container = document.getElementById('pain-chart');
    
    if (checkIns.length < 2) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">Track more</p>';
        return;
    }
    
    const reversed = [...checkIns].reverse();
    const max = Math.max(...reversed.map(c => c.pain || 0), 1);
    const avg = (reversed.reduce((s, c) => s + (c.pain || 0), 0) / reversed.length).toFixed(1);
    
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 12px;">Avg: <strong style="color: var(--primary); font-size: 18px;">${avg}</strong></div>
        <div class="chart-row">
            ${reversed.map(c => {
                const val = c.pain || 0;
                const height = (val / max) * 100 || 5;
                const color = val <= 2 ? 'var(--green)' : val <= 5 ? 'var(--yellow)' : 'var(--red)';
                
                return `
                    <div class="chart-bar" style="height: ${height}%; background: ${color}; min-height: 10px;">
                        <span class="chart-value">${val}</span>
                        <span class="chart-label">${new Date(c.date).getDate()}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderHistory(days) {
    const checkIns = DataManager.getRecentCheckIns(days);
    const list = document.getElementById('history-list');
    
    if (checkIns.length === 0) {
        list.innerHTML = '<div class="card"><p class="text-center" style="padding: 40px;">No data</p></div>';
        return;
    }
    
    list.innerHTML = checkIns.map(c => {
        const status = DataManager.getKneeStatusForCheckIn(c);
        const colors = { GREEN: 'var(--green)', YELLOW: 'var(--yellow)', RED: 'var(--red)' };
        const exercises = DataManager.getExerciseLogsByDate(c.date);
        const custom = DataManager.getCustomWorkoutsByDate(c.date);
        
        return `
            <div class="history-item swelling-${c.swelling}">
                <div class="history-date">
                    ${new Date(c.date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}
                    <span style="float: right; font-weight: 800; color: ${colors[status]};">${status}</span>
                </div>
                <div style="font-size: 14px; color: var(--gray-600); margin-top: 10px;">
                    ${c.swelling} | Pain ${c.pain}/10
                </div>
                ${exercises.length + custom.length > 0 ? `
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--gray-200);">
                        <strong style="font-size: 13px;">${exercises.length + custom.length} workouts</strong>
                        <div style="font-size: 13px; color: var(--gray-600); margin-top: 6px;">
                            ${custom.map(w => `${w.durationMinutes}min`).join(' • ')}
                            ${custom.length > 0 && exercises.length > 0 ? ' • ' : ''}
                            ${exercises.map(e => {
                                const icon = getExerciseIcon(e.exerciseId);
                                const hold = e.holdTimeSeconds > 0 ? `${e.holdTimeSeconds}s` : '';
                                return `${icon} ${hold || e.repsPerSet}`;
                            }).join(' • ')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderExerciseLibrary(phase = 'all') {
    const filtered = phase === 'all' ? EXERCISES : EXERCISES.filter(ex => ex.phase.includes(phase));
    
    document.getElementById('exercise-library').innerHTML = filtered.map(ex => {
        const icon = getExerciseIcon(ex.id);
        
        return `
            <div class="exercise-card">
                <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                    <div style="font-size: 40px;">${icon}</div>
                    <div>
                        <h3>${ex.name}</h3>
                        <p class="exercise-category">${ex.category}</p>
                    </div>
                </div>
                
                <p style="margin: 12px 0;">${ex.description}</p>
                
                <div style="display: flex; gap: 8px; margin: 16px 0; flex-wrap: wrap;">
                    <div class="duration-badge">${window.formatExerciseDuration(ex)}</div>
                    <div class="tempo-badge">${ex.dosage.tempo}</div>
                </div>
                
                <div style="background: #E8F5E9; padding: 14px; border-radius: 10px; margin: 16px 0;">
                    <strong>Why:</strong> ${ex.why}
                </div>
                
                <details>
                    <summary>📋 How To</summary>
                    <div style="margin-top: 12px; font-size: 14px;">
                        <strong>Setup:</strong>
                        <ol style="margin: 8px 0 16px 20px;">${ex.setup.map(s => `<li>${s}</li>`).join('')}</ol>
                        <strong>Do It:</strong>
                        <ol style="margin: 8px 0 0 20px;">${ex.execution.map(e => `<li>${e}</li>`).join('')}</ol>
                    </div>
                </details>
                
                <details>
                    <summary style="color: var(--red);">⚠️ Watch</summary>
                    <ul style="margin-top: 12px; padding-left: 20px; color: var(--red); font-size: 14px;">
                        ${ex.watchFor.map(w => `<li>${w}</li>`).join('')}
                    </ul>
                </details>
            </div>
        `;
    }).join('');
}

function updateStreakDisplay() {
    document.getElementById('streak-count').textContent = DataManager.getCurrentStreak();
}

function loadTodayCheckIn() {
    const checkIn = DataManager.getCheckIn(new Date().toISOString().split('T')[0]);
    
    if (checkIn) {
        if (checkIn.swelling) {
            const btn = document.querySelector(`.swelling-btn[data-level="${checkIn.swelling}"]`);
            if (btn) {
                btn.classList.add('active');
                selectedSwelling = checkIn.swelling;
            }
        }
        if (checkIn.pain !== undefined) {
            document.getElementById('pain-slider').value = checkIn.pain;
            document.getElementById('pain-value').textContent = checkIn.pain;
        }
        if (checkIn.activities) {
            checkIn.activities.forEach(activity => {
                const cb = document.querySelector(`.activity-chip input[value="${activity}"]`);
                if (cb) cb.checked = true;
            });
        }
        if (checkIn.notes) document.getElementById('checkin-notes').value = checkIn.notes;
    }
}

function saveCheckIn() {
    if (!selectedSwelling) {
        alert('⚠️ Select swelling');
        return;
    }
    
    const pain = parseInt(document.getElementById('pain-slider').value);
    const activities = Array.from(document.querySelectorAll('.activity-chip input:checked')).map(cb => cb.value);
    const notes = document.getElementById('checkin-notes').value;
    
    DataManager.saveCheckIn({ swelling: selectedSwelling, pain, activities, notes });
    updateKneeStatusCard();
    updateWeekSummary();
    
    const btn = document.getElementById('save-checkin');
    btn.textContent = '✅ Saved!';
    btn.style.background = '#4CAF50';
    setTimeout(() => {
        btn.textContent = 'Save';
        btn.style.background = '';
    }, 2000);
}

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

window.App = { updateStreakDisplay, updateKneeStatusCard };
