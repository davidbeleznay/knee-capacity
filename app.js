// KneeCapacity - Enhanced with Comprehensive Analytics

let selectedDuration = 600;
let selectedSwelling = null;
let selectedExercise = null;
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
                alert('⏱️ Rest period not complete.\\n\\nKeith Barr protocol requires 6-8 hours.\\n\\nTissues synthesize collagen during rest!');
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
    
    document.getElementById('save-checkin').addEventListener('click', saveCheckIn);
    document.getElementById('save-exercise').addEventListener('click', saveExerciseLog);
    document.getElementById('close-form').addEventListener('click', closeExerciseForm);
    
    document.getElementById('export-data').addEventListener('click', () => {
        DataManager.exportData();
        alert('✅ Data exported!\\n\\nShare JSON file with your specialist.');
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
    
    // Analytics exercise selector
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
    
    input.value = value;
};

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
            <strong>Today's Plan:</strong><br>
            ${statusInfo.action}
        </div>
    `;
    
    const modeBadge = document.getElementById('current-mode-badge');
    if (modeBadge) {
        modeBadge.className = `mode-badge mode-${status}`;
        modeBadge.textContent = status.toUpperCase() + ' MODE';
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
    
    const allowedPhases = phaseMap[status] || ['Calm'];
    const filtered = EXERCISES.filter(ex => 
        ex.phase.some(p => allowedPhases.includes(p))
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center" style="padding: 40px;">Complete check-in to see exercises</p>';
        return;
    }
    
    container.innerHTML = filtered.map(ex => {
        const icon = getExerciseIcon(ex.id);
        const primaryPhase = ex.phase[0];
        const holdDisplay = ex.dosage.holdTime > 0 ? `×${ex.dosage.holdTime}s` : '';
        
        return `
            <div class="exercise-tile" onclick="selectExerciseForLogging('${ex.id}')">
                <div>
                    <div class="tile-icon">${icon}</div>
                    <div class="tile-name">${ex.name.replace(' (Isometric)', '').replace(' (Eccentric)', '')}</div>
                </div>
                <div>
                    <div class="tile-meta">${ex.dosage.sets}×${ex.dosage.reps}${holdDisplay}</div>
                    <span class="tile-phase-badge badge-${primaryPhase.toLowerCase()}">${primaryPhase}</span>
                </div>
            </div>
        `;
    }).join('');
}

function getExerciseIcon(exerciseId) {
    const icons = {
        'spanish-squat': '🔷',
        'wall-sit': '🧱',
        'step-downs': '📉',
        'single-leg-rdl': '🦵',
        'hamstring-bridge': '🌉',
        'tke': '⚡',
        'lateral-band-walk': '↔️',
        'mini-squat': '⬇️',
        'calf-raise': '👟',
        'balance-single-leg': '⚖️',
        'quad-sets': '💪',
        'heel-slides': '↕️'
    };
    return icons[exerciseId] || '💪';
}

window.selectExerciseForLogging = (exerciseId) => {
    selectedExercise = window.getExerciseById(exerciseId);
    if (!selectedExercise) return;
    
    document.getElementById('exercise-log-form').style.display = 'block';
    document.getElementById('exercise-tiles').style.display = 'none';
    
    document.getElementById('selected-exercise-name').textContent = selectedExercise.name;
    document.getElementById('sets-completed').value = selectedExercise.dosage.sets;
    document.getElementById('reps-completed').value = selectedExercise.dosage.reps;
    document.getElementById('hold-time').value = selectedExercise.dosage.holdTime;
    document.getElementById('weight-used').value = 0;
    document.getElementById('rpe-slider').value = 5;
    document.getElementById('rpe-value').textContent = '5';
    document.getElementById('exercise-notes').value = '';
    
    const holdTracker = document.getElementById('hold-tracker');
    holdTracker.style.display = selectedExercise.dosage.holdTime > 0 ? 'block' : 'none';
    
    renderExerciseTrends(exerciseId);
    document.getElementById('exercise-log-form').scrollIntoView({ behavior: 'smooth' });
};

function closeExerciseForm() {
    document.getElementById('exercise-log-form').style.display = 'none';
    document.getElementById('exercise-tiles').style.display = 'grid';
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
        btn.textContent = '✅ Log Exercise';
        btn.style.background = '';
        closeExerciseForm();
        renderTodaysSummary();
    }, 1000);
}

function renderTodaysSummary() {
    const logs = DataManager.getTodaysExerciseLogs();
    const container = document.getElementById('todays-exercise-list');
    
    if (logs.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--gray-600); padding: 30px;">No exercises logged today<br><small>Tap a tile above to start</small></p>';
        return;
    }
    
    container.innerHTML = logs.map(log => {
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

function renderExerciseTrends(exerciseId) {
    const history = DataManager.getExerciseHistory(exerciseId, 30);
    const container = document.getElementById('trend-chart');
    
    if (history.length < 2) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">Log this a few times to see trends</p>';
        return;
    }
    
    const recent = history.slice(0, 10).reverse();
    
    // Determine primary metric to track
    const hasWeight = recent.some(h => h.weightUsed > 0);
    const hasHoldTime = recent.some(h => h.holdTimeSeconds > 0);
    
    const metric = hasWeight ? 'weight' : hasHoldTime ? 'holdTime' : 'reps';
    const getValue = (log) => metric === 'weight' ? log.weightUsed : 
                              metric === 'holdTime' ? log.holdTimeSeconds : 
                              log.repsPerSet;
    
    const values = recent.map(getValue);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const avgValue = (values.reduce((a,b) => a+b, 0) / values.length).toFixed(1);
    
    const labels = { weight: 'Weight (lbs)', holdTime: 'Hold Time (sec)', reps: 'Reps' };
    
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 12px;">
            <div style="font-weight: 600; color: var(--gray-600); margin-bottom: 8px;">
                ${labels[metric]} - Last 10 Sessions
            </div>
            <div style="display: flex; justify-content: center; gap: 20px; font-size: 14px; color: var(--gray-600);">
                <span>Avg: <strong style="color: var(--primary)">${avgValue}</strong></span>
                <span>Max: <strong style="color: var(--primary)">${maxValue}</strong></span>
                <span>Min: <strong>${minValue}</strong></span>
            </div>
        </div>
        <div class="chart-row">
            ${recent.map((log, i) => {
                const value = getValue(log);
                const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
                const date = new Date(log.date);
                const isImprovement = i > 0 && value > getValue(recent[i-1]);
                const color = isImprovement ? 'var(--green)' : 'var(--primary)';
                
                return `
                    <div class="chart-bar" style="height: ${heightPercent}%; background: ${color};">
                        <span class="chart-value">${value}</span>
                        <span class="chart-label">${date.getDate()}</span>
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
    const sessions = DataManager.getSessions().filter(s => {
        const d = new Date(s.timestamp);
        return (new Date() - d) / (1000*60*60*24) <= days;
    });
    
    const exercises = DataManager.getExerciseLogs().filter(e => {
        const d = new Date(e.date);
        return (new Date() - d) / (1000*60*60*24) <= days;
    });
    
    const checkIns = DataManager.getRecentCheckIns(days);
    const avgPain = checkIns.length > 0 ? 
        (checkIns.reduce((sum, c) => sum + (c.pain || 0), 0) / checkIns.length).toFixed(1) : 0;
    
    const greenDays = checkIns.filter(c => DataManager.getKneeStatusForCheckIn(c) === 'GREEN').length;
    
    document.getElementById('total-workouts').textContent = sessions.length;
    document.getElementById('total-exercises').textContent = exercises.length;
    document.getElementById('avg-pain').textContent = avgPain;
    document.getElementById('green-days').textContent = greenDays;
}

function renderWorkoutFrequency(days) {
    const sessions = DataManager.getSessions();
    const container = document.getElementById('workout-frequency-chart');
    
    // Group by date
    const dateMap = {};
    sessions.forEach(s => {
        const date = s.timestamp.split('T')[0];
        dateMap[date] = (dateMap[date] || 0) + 1;
    });
    
    // Get last N days
    const daysArray = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        daysArray.push({ date: dateStr, count: dateMap[dateStr] || 0 });
    }
    
    const maxCount = Math.max(...daysArray.map(d => d.count), 1);
    
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 12px; font-size: 14px; color: var(--gray-600);">
            Sessions per day (Last ${days} days)
        </div>
        <div class="chart-row" style="height: 100px;">
            ${daysArray.map(d => {
                const heightPercent = (d.count / maxCount) * 100;
                const date = new Date(d.date);
                const color = d.count === 0 ? 'var(--gray-300)' : 
                             d.count === 1 ? 'var(--green)' : 
                             d.count === 2 ? 'var(--primary)' : 'var(--orange)';
                
                return `
                    <div class="chart-bar" style="height: ${heightPercent}%; background: ${color};">
                        ${d.count > 0 ? `<span class="chart-value">${d.count}</span>` : ''}
                        <span class="chart-label">${date.getDate()}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderExerciseBreakdown(days) {
    const exercises = DataManager.getExerciseLogs().filter(e => {
        const d = new Date(e.date);
        return (new Date() - d) / (1000*60*60*24) <= days;
    });
    
    const container = document.getElementById('exercise-breakdown');
    
    if (exercises.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">No exercises logged yet</p>';
        return;
    }
    
    // Count by exercise
    const counts = {};
    exercises.forEach(e => {
        counts[e.exerciseId] = (counts[e.exerciseId] || 0) + 1;
    });
    
    // Sort by count
    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const maxCount = sorted[0][1];
    
    container.innerHTML = sorted.map(([id, count]) => {
        const ex = window.getExerciseById(id);
        const icon = getExerciseIcon(id);
        const widthPercent = (count / maxCount) * 100;
        
        return `
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-weight: 600;">${icon} ${ex.name.split('(')[0].trim()}</span>
                    <span style="color: var(--primary); font-weight: 700;">${count}×</span>
                </div>
                <div style="height: 8px; background: var(--gray-200); border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${widthPercent}%; background: var(--primary); border-radius: 4px;"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderIndividualExerciseAnalytics(exerciseId, days) {
    const history = DataManager.getExerciseHistory(exerciseId, days);
    const container = document.getElementById('exercise-analytics');
    
    if (history.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">No data for this exercise yet</p>';
        return;
    }
    
    const ex = window.getExerciseById(exerciseId);
    const icon = getExerciseIcon(exerciseId);
    
    // Calculate stats
    const totalSessions = history.length;
    const avgSets = (history.reduce((sum, h) => sum + h.setsCompleted, 0) / totalSessions).toFixed(1);
    const avgReps = (history.reduce((sum, h) => sum + h.repsPerSet, 0) / totalSessions).toFixed(1);
    const avgHold = (history.reduce((sum, h) => sum + (h.holdTimeSeconds || 0), 0) / totalSessions).toFixed(1);
    const avgWeight = (history.reduce((sum, h) => sum + (h.weightUsed || 0), 0) / totalSessions).toFixed(1);
    const avgRPE = (history.reduce((sum, h) => sum + h.rpe, 0) / totalSessions).toFixed(1);
    
    // Get trend data (last 10 sessions for charts)
    const recent = history.slice(0, 10).reverse();
    
    container.innerHTML = `
        <div style="text-align: center; font-size: 32px; margin: 20px 0;">${icon}</div>
        
        <div style="background: var(--gray-50); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
            <div style="font-weight: 700; margin-bottom: 12px;">📊 ${days}-Day Summary</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 14px;">
                <div>
                    <div style="color: var(--gray-600);">Sessions</div>
                    <div style="font-weight: 700; font-size: 20px; color: var(--primary)">${totalSessions}</div>
                </div>
                <div>
                    <div style="color: var(--gray-600);">Avg RPE</div>
                    <div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgRPE}/10</div>
                </div>
                <div>
                    <div style="color: var(--gray-600);">Avg Sets</div>
                    <div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgSets}</div>
                </div>
                <div>
                    <div style="color: var(--gray-600);">Avg Reps</div>
                    <div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgReps}</div>
                </div>
                ${avgHold > 0 ? `
                    <div>
                        <div style="color: var(--gray-600);">Avg Hold</div>
                        <div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgHold}s</div>
                    </div>
                ` : ''}
                ${avgWeight > 0 ? `
                    <div>
                        <div style="color: var(--gray-600);">Avg Weight</div>
                        <div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgWeight} lbs</div>
                    </div>
                ` : ''}
            </div>
        </div>
        
        ${avgHold > 0 ? renderMetricTrend(recent, 'holdTime', 'Hold Time (sec)') : ''}
        ${avgWeight > 0 ? renderMetricTrend(recent, 'weight', 'Weight (lbs)') : ''}
        ${renderMetricTrend(recent, 'rpe', 'RPE (Effort)')}
    `;
}

function renderMetricTrend(sessions, metric, label) {
    const getValue = (log) => {
        if (metric === 'weight') return log.weightUsed;
        if (metric === 'holdTime') return log.holdTimeSeconds;
        if (metric === 'rpe') return log.rpe;
        return log.repsPerSet;
    };
    
    const values = sessions.map(getValue);
    const maxValue = Math.max(...values, 1);
    const avgValue = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
    
    return `
        <div style="margin-top: 20px;">
            <div style="font-weight: 700; margin-bottom: 8px;">${label}</div>
            <div style="text-align: center; font-size: 13px; color: var(--gray-600); margin-bottom: 8px;">
                Average: <strong style="color: var(--primary)">${avgValue}</strong>
            </div>
            <div class="chart-row" style="height: 120px;">
                ${sessions.map((log, i) => {
                    const value = getValue(log);
                    const heightPercent = (value / maxValue) * 100;
                    const date = new Date(log.date);
                    const isImprovement = i > 0 && value > getValue(sessions[i-1]);
                    const color = metric === 'rpe' ? 
                        (value >= 8 ? 'var(--red)' : value >= 6 ? 'var(--yellow)' : 'var(--green)') :
                        isImprovement ? 'var(--green)' : 'var(--primary)';
                    
                    return `
                        <div class="chart-bar" style="height: ${heightPercent}%; background: ${color};">
                            <span class="chart-value">${value}</span>
                            <span class="chart-label">${date.getDate()}</span>
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
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">Track more days to see trends</p>';
        return;
    }
    
    const swellingValues = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
    const reversed = [...checkIns].reverse();
    
    container.innerHTML = `
        <div class="chart-row">
            ${reversed.map(c => {
                const value = swellingValues[c.swelling] || 0;
                const heightPercent = (value / 3) * 100 || 5;
                const colors = ['var(--green)', 'var(--yellow)', 'var(--orange)', 'var(--red)'];
                const date = new Date(c.date);
                
                return `
                    <div class="chart-bar" style="height: ${heightPercent}%; background: ${colors[value]}; min-height: 10px;">
                        ${value > 0 ? `<span class="chart-value">${c.swelling[0].toUpperCase()}</span>` : ''}
                        <span class="chart-label">${date.getDate()}</span>
                    </div>
                `;
            }).join('')}
        </div>
        <div style="text-align: center; margin-top: 16px; font-size: 13px; color: var(--gray-600);">
            🟢 None | 🟡 Mild | 🟠 Moderate | 🔴 Severe
        </div>
    `;
}

function renderPainTrend(days) {
    const checkIns = DataManager.getRecentCheckIns(days);
    const container = document.getElementById('pain-chart');
    
    if (checkIns.length < 2) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">Track more days to see trends</p>';
        return;
    }
    
    const reversed = [...checkIns].reverse();
    const maxPain = Math.max(...reversed.map(c => c.pain || 0), 1);
    const avgPain = (reversed.reduce((sum, c) => sum + (c.pain || 0), 0) / reversed.length).toFixed(1);
    
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 12px; font-size: 14px; color: var(--gray-600);">
            Average Pain: <strong style="color: var(--primary); font-size: 18px;">${avgPain}/10</strong>
        </div>
        <div class="chart-row">
            ${reversed.map(c => {
                const value = c.pain || 0;
                const heightPercent = (value / maxPain) * 100 || 5;
                const color = value <= 2 ? 'var(--green)' : value <= 5 ? 'var(--yellow)' : 'var(--red)';
                const date = new Date(c.date);
                
                return `
                    <div class="chart-bar" style="height: ${heightPercent}%; background: ${color}; min-height: 10px;">
                        <span class="chart-value">${value}</span>
                        <span class="chart-label">${date.getDate()}</span>
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
        list.innerHTML = '<div class="card"><p class="text-center" style="padding: 40px; color: var(--gray-600);">No data yet</p></div>';
        return;
    }
    
    list.innerHTML = checkIns.map(c => {
        const status = DataManager.getKneeStatusForCheckIn(c);
        const statusColors = { GREEN: 'var(--green)', YELLOW: 'var(--yellow)', RED: 'var(--red)' };
        const exercisesOnDay = DataManager.getExerciseLogsByDate(c.date);
        
        return `
            <div class="history-item swelling-${c.swelling}">
                <div class="history-date">
                    ${new Date(c.date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}
                    <span style="float: right; font-weight: 800; color: ${statusColors[status]}; font-size: 14px;">${status}</span>
                </div>
                <div style="font-size: 14px; color: var(--gray-600); margin-top: 10px;">
                    <strong>Swelling:</strong> ${c.swelling} | <strong>Pain:</strong> ${c.pain}/10
                    ${c.activities && c.activities.length > 0 ? `<br><strong>Activities:</strong> ${c.activities.join(', ')}` : ''}
                </div>
                ${exercisesOnDay.length > 0 ? `
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--gray-200);">
                        <strong style="font-size: 13px;">Exercises (${exercisesOnDay.length}):</strong>
                        <div style="font-size: 13px; color: var(--gray-600); margin-top: 6px;">
                            ${exercisesOnDay.map(e => {
                                const icon = getExerciseIcon(e.exerciseId);
                                const holdDisplay = e.holdTimeSeconds > 0 ? ` ${e.holdTimeSeconds}s` : '';
                                const weightDisplay = e.weightUsed > 0 ? ` ${e.weightUsed}lb` : '';
                                return `${icon} ${e.setsCompleted}×${e.repsPerSet}${holdDisplay}${weightDisplay}`;
                            }).join(' • ')}
                        </div>
                    </div>
                ` : ''}
                ${c.notes ? `<div style="font-size: 13px; font-style: italic; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--gray-200);">"${c.notes}"</div>` : ''}
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
                <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
                    <div style="font-size: 40px;">${icon}</div>
                    <div style="flex: 1;">
                        <h3>${ex.name}</h3>
                        <p class="exercise-category">${ex.category}</p>
                    </div>
                </div>
                
                <p style="margin: 12px 0; line-height: 1.6;">${ex.description}</p>
                
                <div style="display: flex; gap: 8px; margin: 16px 0; flex-wrap: wrap;">
                    <div class="duration-badge">${window.formatExerciseDuration(ex)}</div>
                    <div class="tempo-badge">${ex.dosage.tempo}</div>
                </div>
                
                <div style="background: #E8F5E9; padding: 14px; border-radius: 10px; margin: 16px 0;">
                    <strong style="color: var(--primary);">Why This Works:</strong>
                    <p style="margin-top: 6px; font-size: 14px; line-height: 1.6;">${ex.why}</p>
                </div>
                
                <details>
                    <summary>📋 Setup & Execution</summary>
                    <div style="margin-top: 12px; font-size: 14px; line-height: 1.8;">
                        <strong>Setup:</strong>
                        <ol style="margin: 8px 0 16px 20px;">
                            ${ex.setup.map(s => `<li>${s}</li>`).join('')}
                        </ol>
                        <strong>How to Do It:</strong>
                        <ol style="margin: 8px 0 0 20px;">
                            ${ex.execution.map(e => `<li>${e}</li>`).join('')}
                        </ol>
                    </div>
                </details>
                
                <details>
                    <summary style="color: var(--red);">⚠️ Watch Out For</summary>
                    <ul style="margin-top: 12px; padding-left: 20px; color: var(--red); font-size: 14px; line-height: 1.8;">
                        ${ex.watchFor.map(w => `<li>${w}</li>`).join('')}
                    </ul>
                </details>
                
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200); display: flex; justify-content: space-between; font-size: 13px; color: var(--gray-600);">
                    <span><strong>Phase:</strong> ${ex.phase.join(', ')}</span>
                    <span><strong>RPE:</strong> ${ex.rpe}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateRestStatus() {
    const canTrain = DataManager.canTrain();
    const hoursUntil = DataManager.hoursUntilReady();
    const statusCard = document.getElementById('rest-status');
    
    if (canTrain) {
        statusCard.className = 'status-card status-ready text-center';
        statusCard.innerHTML = `
            <div class="status-icon">✅</div>
            <h2>Ready to Train</h2>
            <p>Tissue recovered (6+ hours rest)</p>
            <small style="color: var(--gray-600);">${getLastSessionTime()}</small>
        `;
    } else {
        const hours = Math.floor(hoursUntil);
        const minutes = Math.round((hoursUntil - hours) * 60);
        statusCard.className = 'status-card status-resting text-center';
        statusCard.innerHTML = `
            <div class="status-icon">⏱️</div>
            <h2>Rest Period</h2>
            <p class="time-remaining">${hours}h ${minutes}m</p>
            <small style="color: var(--gray-600);">Collagen synthesis happening now...</small>
        `;
    }
}

function getLastSessionTime() {
    const sessions = DataManager.getSessions();
    if (sessions.length === 0) return 'No sessions yet';
    
    const last = sessions[sessions.length - 1];
    const hoursAgo = Math.floor((new Date() - new Date(last.timestamp)) / (1000 * 60 * 60));
    
    if (hoursAgo < 1) return 'Less than 1 hour ago';
    if (hoursAgo < 24) return `Last session: ${hoursAgo} hours ago`;
    
    const daysAgo = Math.floor(hoursAgo / 24);
    return `Last session: ${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
}

function updateTimerDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('timer-minutes').textContent = mins;
    document.getElementById('timer-seconds').textContent = secs.toString().padStart(2, '0');
}

function updateStreakDisplay() {
    document.getElementById('streak-count').textContent = DataManager.getCurrentStreak();
}

function loadTodayCheckIn() {
    const today = new Date().toISOString().split('T')[0];
    const checkIn = DataManager.getCheckIn(today);
    
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
        if (checkIn.notes) {
            document.getElementById('checkin-notes').value = checkIn.notes;
        }
    }
}

function saveCheckIn() {
    if (!selectedSwelling) {
        alert('⚠️ Please select swelling level');
        return;
    }
    
    const pain = parseInt(document.getElementById('pain-slider').value);
    const activities = Array.from(document.querySelectorAll('.activity-chip input:checked')).map(cb => cb.value);
    const notes = document.getElementById('checkin-notes').value;
    
    DataManager.saveCheckIn({ swelling: selectedSwelling, pain, activities, notes });
    updateKneeStatusCard();
    
    const btn = document.getElementById('save-checkin');
    btn.textContent = '✅ Saved!';
    btn.style.background = '#4CAF50';
    setTimeout(() => {
        btn.textContent = 'Save Check-In';
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

window.App = { 
    updateRestStatus, 
    updateStreakDisplay, 
    updateTimerDisplay,
    updateKneeStatusCard
};
