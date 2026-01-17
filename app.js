// KneeCapacity - Enhanced App with Exercise Logging

let selectedDuration = 600;
let selectedSwelling = null;
let selectedExercise = null;

document.addEventListener('DOMContentLoaded', () => {
    DataManager.init();
    updateRestStatus();
    updateStreakDisplay();
    updateKneeStatusCard();
    loadTodayCheckIn();
    setupEventListeners();
    setInterval(updateRestStatus, 60000);
    populateExerciseSelect();
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
                alert('Rest period not complete. Barr protocol requires 6-8 hours between sessions.');
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
    
    // Save check-in
    document.getElementById('save-checkin').addEventListener('click', saveCheckIn);
    
    // Exercise select
    document.getElementById('exercise-select').addEventListener('change', (e) => {
        const exerciseId = e.target.value;
        if (exerciseId) {
            selectedExercise = window.getExerciseById(exerciseId);
            showExerciseDetail(selectedExercise);
            document.getElementById('exercise-log-form').style.display = 'block';
            // Pre-fill recommended values
            document.getElementById('sets-completed').value = selectedExercise.dosage.sets;
            document.getElementById('reps-completed').value = selectedExercise.dosage.reps;
            document.getElementById('hold-time').value = selectedExercise.dosage.holdTime;
            
            // Show/hide hold time based on exercise
            const holdGroup = document.getElementById('hold-time-group');
            holdGroup.style.display = selectedExercise.dosage.holdTime > 0 ? 'block' : 'none';
        }
    });
    
    // RPE slider
    document.getElementById('rpe-slider').addEventListener('input', (e) => {
        document.getElementById('rpe-value').textContent = e.target.value;
    });
    
    // Save exercise
    document.getElementById('save-exercise').addEventListener('click', saveExerciseLog);
    
    // Export data
    document.getElementById('export-data').addEventListener('click', () => {
        DataManager.exportData();
        alert('✅ Data exported! Share this file with your specialist.');
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
    
    // Phase filters for exercises
    document.querySelectorAll('.phase-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.phase-filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const phase = e.target.dataset.phase;
            renderExercises(phase);
        });
    });
}

function updateKneeStatusCard() {
    const statusInfo = DataManager.getKneeStatusMessage();
    const card = document.getElementById('knee-status-card');
    const status = DataManager.getKneeStatus();
    
    card.className = `status-card status-${status} text-center`;
    card.innerHTML = `
        <div class="status-icon">${statusInfo.icon}</div>
        <h2>${statusInfo.title}</h2>
        <p>${statusInfo.message}</p>
        <small style="margin-top: 8px; display: block;">${statusInfo.action}</small>
    `;
}

function populateExerciseSelect() {
    const select = document.getElementById('exercise-select');
    EXERCISES.forEach(ex => {
        const option = document.createElement('option');
        option.value = ex.id;
        option.textContent = ex.name;
        select.appendChild(option);
    });
}

function showExerciseDetail(exercise) {
    const card = document.getElementById('exercise-detail-card');
    card.style.display = 'block';
    
    card.innerHTML = `
        <h3>${exercise.name}</h3>
        <p class="exercise-category">${exercise.category}</p>
        
        <div style="margin: 16px 0;">
            <strong>Target:</strong> ${exercise.target}
        </div>
        
        <div style="margin: 16px 0;">
            <strong>Description:</strong><br>
            ${exercise.description}
        </div>
        
        <div style="margin: 16px 0; background: #F1F8E9; padding: 12px; border-radius: 8px;">
            <strong>Recommended Dosage:</strong><br>
            ${window.formatExerciseDuration(exercise)}<br>
            <small>Tempo: ${exercise.dosage.tempo}</small>
        </div>
        
        <div style="margin: 16px 0;">
            <strong>Why This Matters:</strong><br>
            ${exercise.why}
        </div>
        
        <details style="margin: 16px 0;">
            <summary style="cursor: pointer; font-weight: 600; color: #2E7D32;">
                📋 Setup Steps
            </summary>
            <ul style="margin-top: 8px; padding-left: 20px;">
                ${exercise.setup.map(step => `<li>${step}</li>`).join('')}
            </ul>
        </details>
        
        <details style="margin: 16px 0;">
            <summary style="cursor: pointer; font-weight: 600; color: #2E7D32;">
                🎯 Execution Steps
            </summary>
            <ol style="margin-top: 8px; padding-left: 20px;">
                ${exercise.execution.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </details>
        
        <details style="margin: 16px 0;">
            <summary style="cursor: pointer; font-weight: 600; color: #F57C00;">
                ⚠️ Watch Out For
            </summary>
            <ul style="margin-top: 8px; padding-left: 20px; color: #D32F2F;">
                ${exercise.watchFor.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </details>
    `;
}

function saveExerciseLog() {
    if (!selectedExercise) {
        alert('Please select an exercise first');
        return;
    }
    
    const exerciseLog = {
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        setsCompleted: parseInt(document.getElementById('sets-completed').value),
        repsPerSet: parseInt(document.getElementById('reps-completed').value),
        holdTime: parseInt(document.getElementById('hold-time').value),
        weightUsed: parseInt(document.getElementById('weight-used').value) || 0,
        rpe: parseInt(document.getElementById('rpe-slider').value),
        notes: document.getElementById('exercise-notes').value
    };
    
    DataManager.saveExerciseLog(exerciseLog);
    
    // Success feedback
    const btn = document.getElementById('save-exercise');
    btn.textContent = '✅ Logged!';
    btn.style.background = '#4CAF50';
    
    setTimeout(() => {
        btn.textContent = '✅ Log Exercise';
        btn.style.background = '';
        // Clear form
        document.getElementById('exercise-notes').value = '';
        // Refresh today's list
        renderTodaysExercises();
    }, 1500);
}

function renderTodaysExercises() {
    const logs = DataManager.getTodaysExerciseLogs();
    const container = document.getElementById('todays-exercise-list');
    
    if (logs.length === 0) {
        container.innerHTML = '<p style="color: #757575; text-align: center; padding: 20px;">No exercises logged today</p>';
        return;
    }
    
    container.innerHTML = logs.map(log => `
        <div class="exercise-log-item">
            <div style="font-weight: 600; margin-bottom: 4px;">${log.exerciseName}</div>
            <div style="font-size: 14px; color: #757575;">
                ${log.setsCompleted} sets × ${log.repsPerSet} reps
                ${log.holdTime > 0 ? `× ${log.holdTime}s hold` : ''}
                ${log.weightUsed > 0 ? `@ ${log.weightUsed} lbs` : '(bodyweight)'}
                | RPE: ${log.rpe}/10
            </div>
            ${log.notes ? `<div style="font-size: 13px; font-style: italic; margin-top: 4px;">"${log.notes}"</div>` : ''}
            <div style="font-size: 12px; color: #BDBDBD; margin-top: 4px;">
                ${new Date(log.timestamp).toLocaleTimeString()}
            </div>
        </div>
    `).join('');
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
            <p>Your connective tissue has recovered</p>
            <small>Last session: ${getLastSessionTime()}</small>
        `;
    } else {
        const hours = Math.floor(hoursUntil);
        const minutes = Math.round((hoursUntil - hours) * 60);
        statusCard.className = 'status-card status-resting text-center';
        statusCard.innerHTML = `
            <div class="status-icon">⏱️</div>
            <h2>Rest Period</h2>
            <p class="time-remaining">${hours}h ${minutes}m</p>
            <small>Tissues recovering - adaptation happens during rest</small>
        `;
    }
}

function getLastSessionTime() {
    const sessions = DataManager.getSessions();
    if (sessions.length === 0) return 'Never';
    
    const last = sessions[sessions.length - 1];
    const lastTime = new Date(last.timestamp);
    const hoursAgo = Math.floor((new Date() - lastTime) / (1000 * 60 * 60));
    
    if (hoursAgo < 24) {
        return `${hoursAgo} hours ago`;
    } else {
        const daysAgo = Math.floor(hoursAgo / 24);
        return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    }
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
                const cb = document.querySelector(`input[value="${activity}"]`);
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
        alert('Please select swelling level');
        return;
    }
    
    const pain = parseInt(document.getElementById('pain-slider').value);
    const activities = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    const notes = document.getElementById('checkin-notes').value;
    
    DataManager.saveCheckIn({ swelling: selectedSwelling, pain, activities, notes });
    
    // Update traffic light status
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
    
    if (viewName === 'history') renderHistory(7);
    if (viewName === 'exercises') renderExercises('all');
    if (viewName === 'log') {
        renderTodaysExercises();
        updateKneeStatusCard();
    }
}

function renderHistory(days) {
    const checkIns = DataManager.getRecentCheckIns(days);
    const list = document.getElementById('history-list');
    
    if (checkIns.length === 0) {
        list.innerHTML = '<p class="text-center" style="padding: 40px; color: #757575;">No data yet. Start tracking!</p>';
        return;
    }
    
    list.innerHTML = checkIns.map(c => {
        const status = DataManager.getKneeStatusForCheckIn(c);
        const statusColor = status === 'GREEN' ? '#4CAF50' : status === 'YELLOW' ? '#FF9800' : '#F44336';
        
        return `
            <div class="history-item swelling-${c.swelling}">
                <div class="history-date">
                    ${new Date(c.date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}
                    <span style="float: right; font-weight: 600; color: ${statusColor}">${status}</span>
                </div>
                <div style="font-size: 14px; color: #757575; margin-top: 8px;">
                    Swelling: <strong>${c.swelling}</strong> | Pain: <strong>${c.pain}/10</strong>
                    ${c.activities && c.activities.length > 0 ? `<br>Activities: ${c.activities.join(', ')}` : ''}
                    ${c.notes ? `<br><em style="margin-top: 8px; display: block;">"${c.notes}"</em>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderExercises(phase = 'all') {
    const filtered = phase === 'all' ? EXERCISES : EXERCISES.filter(ex => ex.phase.includes(phase));
    
    document.getElementById('exercise-list').innerHTML = filtered.map(ex => `
        <div class="exercise-card">
            <h3>${ex.name}</h3>
            <p class="target">${ex.category}</p>
            <p class="target" style="font-size: 13px; margin-top: 4px;">Target: ${ex.target}</p>
            
            <p style="margin: 12px 0;">${ex.description}</p>
            
            <div class="duration-badge">
                ${window.formatExerciseDuration(ex)}
            </div>
            
            <div class="tempo-badge">
                Tempo: ${ex.dosage.tempo}
            </div>
            
            <div style="margin-top: 12px; padding: 12px; background: #F1F8E9; border-radius: 6px;">
                <strong style="color: #2E7D32;">Why:</strong> ${ex.why}
            </div>
            
            <div style="margin-top: 12px;">
                <strong>Phase:</strong> ${ex.phase.join(', ')}
                <span style="float: right;"><strong>RPE:</strong> ${ex.rpe}</span>
            </div>
            
            <details style="margin-top: 12px;">
                <summary style="cursor: pointer; color: #2E7D32; font-weight: 600;">
                    📋 Setup & Execution
                </summary>
                <div style="margin-top: 8px; font-size: 14px;">
                    <strong>Setup:</strong>
                    <ul style="margin: 4px 0 8px 20px;">
                        ${ex.setup.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                    <strong>Execution:</strong>
                    <ol style="margin: 4px 0 0 20px;">
                        ${ex.execution.map(e => `<li>${e}</li>`).join('')}
                    </ol>
                </div>
            </details>
            
            <details style="margin-top: 8px;">
                <summary style="cursor: pointer; color: #F57C00; font-weight: 600;">
                    ⚠️ Watch Out For
                </summary>
                <ul style="margin-top: 8px; padding-left: 20px; color: #D32F2F; font-size: 14px;">
                    ${ex.watchFor.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </details>
            
            <details style="margin-top: 8px;">
                <summary style="cursor: pointer; color: #757575; font-weight: 600;">
                    🔧 Modifications
                </summary>
                <div style="margin-top: 8px; font-size: 14px;">
                    <div><strong>Easier:</strong> ${ex.modifications.easier}</div>
                    <div style="margin-top: 4px;"><strong>Harder:</strong> ${ex.modifications.harder}</div>
                </div>
            </details>
        </div>
    `).join('');
}

window.App = { 
    updateRestStatus, 
    updateStreakDisplay, 
    updateTimerDisplay,
    updateKneeStatusCard
};
