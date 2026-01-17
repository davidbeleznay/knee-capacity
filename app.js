// KneeCapacity - Main Application

let selectedDuration = 600;
let selectedSwelling = null;

document.addEventListener('DOMContentLoaded', () => {
    DataManager.init();
    updateRestStatus();
    updateStreakDisplay();
    loadTodayCheckIn();
    setupEventListeners();
    setInterval(updateRestStatus, 60000);
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
                alert('Rest period not complete. Barr protocol requires 6-8 hours.');
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
    
    document.getElementById('save-checkin').addEventListener('click', saveCheckIn);
    document.getElementById('export-data').addEventListener('click', () => DataManager.exportData());
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchView(e.currentTarget.dataset.view);
        });
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderHistory(parseInt(e.target.dataset.days));
        });
    });
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
    if (viewName === 'exercises') renderExercises();
}

function renderHistory(days) {
    const checkIns = DataManager.getRecentCheckIns(days);
    const list = document.getElementById('history-list');
    
    if (checkIns.length === 0) {
        list.innerHTML = '<p class="text-center" style="padding: 40px; color: #757575;">No data yet. Start tracking!</p>';
        return;
    }
    
    list.innerHTML = checkIns.map(c => `
        <div class="history-item swelling-${c.swelling}">
            <div class="history-date">${new Date(c.date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}</div>
            <div style="font-size: 14px; color: #757575; margin-top: 8px;">
                Swelling: <strong>${c.swelling}</strong> | Pain: <strong>${c.pain}/10</strong>
                ${c.activities && c.activities.length > 0 ? `<br>Activities: ${c.activities.join(', ')}` : ''}
                ${c.notes ? `<br><em style="margin-top: 8px; display: block;">"${c.notes}"</em>` : ''}
            </div>
        </div>
    `).join('');
}

function renderExercises() {
    document.getElementById('exercise-list').innerHTML = EXERCISES.map(ex => `
        <div class="exercise-card">
            <h3>${ex.name}</h3>
            <p class="target">${ex.target}</p>
            <p>${ex.description}</p>
            <div class="duration">${ex.duration}</div>
            <p style="margin-top: 12px; font-size: 14px; color: #757575;">
                <strong>Why:</strong> ${ex.why}
            </p>
        </div>
    `).join('');
}

window.App = { updateRestStatus, updateStreakDisplay, updateTimerDisplay };
