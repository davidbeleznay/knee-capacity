// Check-In UI Module
function setupCheckInHandlers() {
    document.querySelectorAll('.swelling-btn').forEach(btn => {
        const handler = function() {
            console.log('Swelling:', this.dataset.level);
            document.querySelectorAll('.swelling-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            AppState.swelling = this.dataset.level;
        };
        btn.ontouchstart = handler;
        btn.onclick = handler;
    });
    
    document.querySelectorAll('.activity-level-btn').forEach(btn => {
        const handler = function() {
            document.querySelectorAll('.activity-level-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            AppState.activityLevel = this.dataset.level;
        };
        btn.ontouchstart = handler;
        btn.onclick = handler;
    });
    
    document.querySelectorAll('.time-btn').forEach(btn => {
        const handler = function() {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            AppState.timeOfDay = this.dataset.time;
        };
        btn.ontouchstart = handler;
        btn.onclick = handler;
    });
    
    document.getElementById('pain-slider').oninput = (e) => {
        document.getElementById('pain-value').textContent = e.target.value;
        AppState.pain = parseInt(e.target.value);
    };
    
    document.getElementById('save-checkin').onclick = saveCheckIn;
}

function saveCheckIn() {
    if (!AppState.swelling) {
        alert('⚠️ Select swelling');
        return;
    }
    
    console.log('💾 Saving check-in...');
    
    const success = DataManager.saveCheckIn({ 
        swelling: AppState.swelling, 
        pain: AppState.pain,
        activityLevel: AppState.activityLevel,
        timeOfDay: AppState.timeOfDay,
        notes: document.getElementById('checkin-notes').value
    });
    
    if (success) {
        updateKneeStatusCard();
        updateWeekSummary();
        
        const btn = document.getElementById('save-checkin');
        btn.textContent = 'Saved!';
        btn.style.background = '#4CAF50';
        setTimeout(() => {
            btn.textContent = 'Save Check-In';
            btn.style.background = '';
        }, 2000);
    }
}

function loadTodayCheckIn() {
    const checkIn = DataManager.getCheckIn(new Date().toISOString().split('T')[0]);
    if (!checkIn) return;
    
    console.log('📥 Loading check-in');
    
    if (checkIn.swelling) {
        const btn = document.querySelector(`.swelling-btn[data-level="${checkIn.swelling}"]`);
        if (btn) {
            btn.classList.add('active');
            AppState.swelling = checkIn.swelling;
        }
    }
    
    if (checkIn.pain !== undefined) {
        document.getElementById('pain-slider').value = checkIn.pain;
        document.getElementById('pain-value').textContent = checkIn.pain;
        AppState.pain = checkIn.pain;
    }
    
    if (checkIn.activityLevel) {
        const btn = document.querySelector(`.activity-level-btn[data-level="${checkIn.activityLevel}"]`);
        if (btn) {
            document.querySelectorAll('.activity-level-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.activityLevel = checkIn.activityLevel;
        }
    }
    
    if (checkIn.timeOfDay) {
        const btn = document.querySelector(`.time-btn[data-time="${checkIn.timeOfDay}"]`);
        if (btn) {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.timeOfDay = checkIn.timeOfDay;
        }
    }
    
    if (checkIn.notes) {
        document.getElementById('checkin-notes').value = checkIn.notes;
    }
}

function updateKneeStatusCard() {
    const statusInfo = DataManager.getKneeStatusMessage();
    const status = DataManager.getKneeStatus();
    AppState.kneeStatus = status;
    
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
    
    const badge = document.getElementById('current-mode-badge');
    if (badge) {
        badge.className = `mode-badge mode-${status}`;
        badge.textContent = status.toUpperCase();
    }
}

function updateWeekSummary() {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const weekData = DataManager.getRecentCheckIns(7);
    const weekExercises = DataManager.getExerciseLogs().filter(e => new Date(e.date) >= weekStart);
    const weekCustom = DataManager.getCustomWorkouts().filter(w => new Date(w.date) >= weekStart);
    
    const greenDays = weekData.filter(c => DataManager.getKneeStatusForCheckIn(c) === 'GREEN').length;
    const avgPain = weekData.length > 0 ? 
        (weekData.reduce((s, c) => s + (c.pain || 0), 0) / weekData.length).toFixed(1) : 0;
    
    document.getElementById('week-summary').innerHTML = `
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
