// KneeCapacity - Enhanced App with Tiles and Trends

let selectedDuration = 600;
let selectedSwelling = null;
let selectedExercise = null;
let currentKneeStatus = 'unknown';

document.addEventListener('DOMContentLoaded', () => {
    DataManager.init();
    currentKneeStatus = DataManager.getKneeStatus();
    updateRestStatus();
    updateStreakDisplay();
    updateKneeStatusCard();
    loadTodayCheckIn();
    setupEventListeners();
    setInterval(updateRestStatus, 60000);
});

function setupEventListeners() {
    // Timer presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedDuration = parseInt(e.target.dataset.duration);
            updateTimerDisplay(selectedDuration);
        });
    });
    
    // Timer action
    document.getElementById('timer-action').addEventListener('click', () => {
        if (Timer.isRunning) {
            if (confirm('Stop session early?')) Timer.stop();
        } else {
            if (!DataManager.canTrain()) {
                alert('⏱️ Rest period not complete.\\n\\nKeith Barr protocol requires 6-8 hours between sessions.\\n\\nTissues need time to synthesize new collagen!');
                return;
            }
            Timer.start(selectedDuration);
        }
    });
    
    // Swelling buttons
    document.querySelectorAll('.swelling-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.swelling-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedSwelling = e.target.dataset.level;
        });
    });
    
    // Pain slider
    document.getElementById('pain-slider').addEventListener('input', (e) => {
        document.getElementById('pain-value').textContent = e.target.value;
    });
    
    // RPE slider
    document.getElementById('rpe-slider').addEventListener('input', (e) => {
        document.getElementById('rpe-value').textContent = e.target.value;
    });
    
    // Save check-in
    document.getElementById('save-checkin').addEventListener('click', saveCheckIn);
    
    // Save exercise
    document.getElementById('save-exercise').addEventListener('click', saveExerciseLog);
    
    // Close form
    document.getElementById('close-form').addEventListener('click', closeExerciseForm);
    
    // Export data
    document.getElementById('export-data').addEventListener('click', () => {
        DataManager.exportData();
        alert('✅ Data exported!\\n\\nShare this JSON file with your specialist.');
    });
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchView(e.currentTarget.dataset.view);
        });
    });
    
    // History filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderHistory(parseInt(e.target.dataset.days));
        });
    });
    
    // Phase tabs
    document.querySelectorAll('.phase-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.phase-tab').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const phase = e.target.dataset.phase;
            renderExerciseLibrary(phase);
        });
    });
}

// Stepper control function
window.adjustValue = (inputId, delta) => {
    const input = document.getElementById(inputId);
    let value = parseInt(input.value) || 0;
    value = Math.max(0, value + delta);
    
    // Cap maximums
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
    
    // Update mode badge if on log view
    const modeBadge = document.getElementById('current-mode-badge');
    if (modeBadge) {
        const modeClass = `mode-${status}`;
        modeBadge.className = `mode-badge ${modeClass}`;
        modeBadge.textContent = status.toUpperCase() + ' MODE';
    }
}

function renderExerciseTiles() {
    const container = document.getElementById('exercise-tiles');
    const status = currentKneeStatus;
    
    // Map status to phases
    const phaseMap = {
        'green': ['Build', 'Prime'],
        'yellow': ['Build', 'Calm'],
        'red': ['Calm'],
        'unknown': ['Calm', 'Build'] // Default to safe options
    };
    
    const allowedPhases = phaseMap[status] || ['Calm'];
    const filtered = EXERCISES.filter(ex => 
        ex.phase.some(p => allowedPhases.includes(p))
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center" style="padding: 40px; color: var(--gray-600);">Complete daily check-in to see exercises</p>';
        return;
    }
    
    container.innerHTML = filtered.map(ex => {
        const icon = getExerciseIcon(ex.id);
        const primaryPhase = ex.phase[0];
        
        return `
            <div class="exercise-tile" onclick="selectExerciseForLogging('${ex.id}')">
                <div>
                    <div class="tile-icon">${icon}</div>
                    <div class="tile-name">${ex.name.replace(' (Isometric)', '').replace(' (Eccentric)', '')}</div>
                </div>
                <div>
                    <div class="tile-meta">${ex.dosage.sets}×${ex.dosage.reps}${ex.dosage.holdTime > 0 ? '×' + ex.dosage.holdTime + 's' : ''}</div>
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
    
    // Show form
    document.getElementById('exercise-log-form').style.display = 'block';
    document.getElementById('exercise-tiles').style.display = 'none';
    
    // Pre-fill with recommended values
    document.getElementById('selected-exercise-name').textContent = selectedExercise.name;
    document.getElementById('sets-completed').value = selectedExercise.dosage.sets;
    document.getElementById('reps-completed').value = selectedExercise.dosage.reps;
    document.getElementById('hold-time').value = selectedExercise.dosage.holdTime;
    document.getElementById('weight-used').value = 0;
    document.getElementById('rpe-slider').value = 5;
    document.getElementById('rpe-value').textContent = '5';
    document.getElementById('exercise-notes').value = '';
    
    // Show hold time tracker only if exercise uses holds
    const holdTracker = document.getElementById('hold-tracker');
    holdTracker.style.display = selectedExercise.dosage.holdTime > 0 ? 'block' : 'none';
    
    // Show exercise history trends
    renderExerciseTrends(exerciseId);
    
    // Scroll to form
    document.getElementById('exercise-log-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function closeExerciseForm() {
    document.getElementById('exercise-log-form').style.display = 'none';
    document.getElementById('exercise-tiles').style.display = 'grid';
    selectedExercise = null;
}

function saveExerciseLog() {
    if (!selectedExercise) return;
    
    const exerciseLog = {
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        setsCompleted: parseInt(document.getElementById('sets-completed').value),
        repsPerSet: parseInt(document.getElementById('reps-completed').value),
        holdTimeSeconds: parseInt(document.getElementById('hold-time').value),
        weightUsed: parseInt(document.getElementById('weight-used').value),
        rpe: parseInt(document.getElementById('rpe-slider').value),
        notes: document.getElementById('exercise-notes').value
    };
    
    DataManager.saveExerciseLog(exerciseLog);
    
    // Success feedback
    const btn = document.getElementById('save-exercise');
    const originalText = btn.textContent;
    btn.textContent = '✅ Logged!';
    btn.style.background = '#4CAF50';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        closeExerciseForm();
        renderTodaysSummary();
    }, 1000);
}

function renderTodaysSummary() {
    const logs = DataManager.getTodaysExerciseLogs();
    const container = document.getElementById('todays-exercise-list');
    
    if (logs.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--gray-600); padding: 30px;">No exercises logged today<br><small>Tap an exercise tile above to start</small></p>';
        return;
    }
    
    container.innerHTML = logs.map(log => {
        const icon = getExerciseIcon(log.exerciseId);
        const holdDisplay = log.holdTimeSeconds > 0 ? ` × ${log.holdTimeSeconds}s hold` : '';
        const weightDisplay = log.weightUsed > 0 ? ` @ ${log.weightUsed} lbs` : ' (bodyweight)';
        
        return `
            <div class="exercise-log-item">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <div style="font-size: 20px; margin-bottom: 4px;">${icon}</div>
                        <div style="font-weight: 700; font-size: 15px;">${log.exerciseName.split('(')[0].trim()}</div>
                    </div>
                    <div style="text-align: right; font-size: 12px; color: var(--gray-600);">
                        ${new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>
                <div style="margin-top: 8px; font-size: 14px; color: var(--gray-600); font-weight: 600;">
                    ${log.setsCompleted} sets × ${log.repsPerSet} reps${holdDisplay}${weightDisplay}
                </div>
                <div style="margin-top: 6px; display: flex; gap: 12px; font-size: 13px;">
                    <span>RPE: ${log.rpe}/10</span>
                    ${log.rpe >= 8 ? '<span style="color: var(--red);">●</span>' : log.rpe >= 6 ? '<span style="color: var(--yellow);">●</span>' : '<span style="color: var(--green);">●</span>'}
                </div>
                ${log.notes ? `<div style="font-size: 13px; font-style: italic; margin-top: 8px; color: var(--gray-600);">"${log.notes}"</div>` : ''}
            </div>
        `;
    }).join('');
}

function renderExerciseTrends(exerciseId) {
    const history = DataManager.getExerciseHistory(exerciseId, 30);
    const container = document.getElementById('trend-chart');
    
    if (history.length < 2) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">Log this exercise a few times to see trends</p>';
        return;
    }
    
    // Show last 10 sessions
    const recent = history.slice(0, 10).reverse();
    const maxValue = Math.max(...recent.map(h => h.weightUsed || h.holdTimeSeconds || h.repsPerSet));
    
    // Determine what to track (weight, hold time, or reps)
    const trackingMetric = recent[0].weightUsed > 0 ? 'weight' : 
                          recent[0].holdTimeSeconds > 0 ? 'holdTime' : 'reps';
    
    const metricLabels = {
        weight: 'Weight (lbs)',
        holdTime: 'Hold Time (s)',
        reps: 'Reps'
    };
    
    const getValue = (log) => {
        if (trackingMetric === 'weight') return log.weightUsed;
        if (trackingMetric === 'holdTime') return log.holdTimeSeconds;
        return log.repsPerSet;
    };
    
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px; font-weight: 600; color: var(--gray-600);">
            ${metricLabels[trackingMetric]} Progress (Last 10 Sessions)
        </div>
        <div class="chart-row">
            ${recent.map((log, i) => {
                const value = getValue(log);
                const heightPercent = (value / maxValue) * 100;
                const date = new Date(log.date);
                const label = date.getDate();
                
                return `
                    <div class="chart-bar" style="height: ${heightPercent}%;">
                        <span class="chart-value">${value}</span>
                        <span class="chart-label">${label}</span>
                    </div>
                `;
            }).join('')}
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 13px; color: var(--gray-600);">
            ${recent.length < 10 ? `${recent.length} sessions tracked` : 'Showing last 10 sessions'}
        </div>
    `;
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
    const lastTime = new Date(last.timestamp);
    const hoursAgo = Math.floor((new Date() - lastTime) / (1000 * 60 * 60));
    
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
    const activities = Array.from(document.querySelectorAll('.activity-chip input:checked'))
        .map(cb => cb.value);
    const notes = document.getElementById('checkin-notes').value;
    
    DataManager.saveCheckIn({ swelling: selectedSwelling, pain, activities, notes });
    
    // Update status immediately
    updateKneeStatusCard();
    
    // Success feedback
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
    
    if (viewName === 'history') {
        renderHistory(7);
        renderSwellingTrend(14);
        renderPainTrend(14);
    }
    if (viewName === 'exercises') renderExerciseLibrary('all');
    if (viewName === 'log') {
        renderExerciseTiles();
        renderTodaysSummary();
    }
}

function renderSwellingTrend(days) {
    const checkIns = DataManager.getRecentCheckIns(days);
    const container = document.getElementById('swelling-chart');
    
    if (checkIns.length < 2) {
        container.innerHTML = '<p class="text-center" style="color: var(--gray-600); padding: 20px;">Track a few more days to see trends</p>';
        return;
    }
    
    const swellingValues = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
    const reversed = [...checkIns].reverse();
    
    container.innerHTML = `
        <div class="chart-row">
            ${reversed.map(c => {
                const value = swellingValues[c.swelling] || 0;
                const heightPercent = (value / 3) * 100;
                const colors = ['var(--green)', 'var(--yellow)', 'var(--orange)', 'var(--red)'];
                const date = new Date(c.date);
                
                return `
                    <div class="chart-bar" style="height: ${heightPercent}%; background: ${colors[value]};">
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
        container.innerHTML = '<p class="text-center" style="color: var(--gray-600); padding: 20px;">Track a few more days to see trends</p>';
        return;
    }
    
    const reversed = [...checkIns].reverse();
    const maxPain = Math.max(...reversed.map(c => c.pain || 0));
    
    container.innerHTML = `
        <div class="chart-row">
            ${reversed.map(c => {
                const value = c.pain || 0;
                const heightPercent = maxPain > 0 ? (value / maxPain) * 100 : 0;
                const color = value <= 2 ? 'var(--green)' : value <= 5 ? 'var(--yellow)' : 'var(--red)';
                const date = new Date(c.date);
                
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

function renderHistory(days) {
    const checkIns = DataManager.getRecentCheckIns(days);
    const list = document.getElementById('history-list');
    
    if (checkIns.length === 0) {
        list.innerHTML = '<div class="card"><p class="text-center" style="padding: 40px; color: var(--gray-600);">No data yet. Start tracking!</p></div>';
        return;
    }
    
    list.innerHTML = checkIns.map(c => {
        const status = DataManager.getKneeStatusForCheckIn(c);
        const statusColors = { GREEN: 'var(--green)', YELLOW: 'var(--yellow)', RED: 'var(--red)' };
        
        return `
            <div class="history-item swelling-${c.swelling}">
                <div class="history-date">
                    ${new Date(c.date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}
                    <span style="float: right; font-weight: 800; color: ${statusColors[status]}; font-size: 14px;">${status}</span>
                </div>
                <div style="font-size: 14px; color: var(--gray-600); margin-top: 10px; line-height: 1.8;">
                    <strong>Swelling:</strong> ${c.swelling} | <strong>Pain:</strong> ${c.pain}/10
                    ${c.activities && c.activities.length > 0 ? `<br><strong>Activities:</strong> ${c.activities.join(', ')}` : ''}
                    ${c.notes ? `<br><em style="margin-top: 8px; display: block; color: var(--gray-900);">"${c.notes}"</em>` : ''}
                </div>
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
                
                <div style="display: flex; gap: 8px; margin: 16px 0;">
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

window.App = { 
    updateRestStatus, 
    updateStreakDisplay, 
    updateTimerDisplay,
    updateKneeStatusCard
};
