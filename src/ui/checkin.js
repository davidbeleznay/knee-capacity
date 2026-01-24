// Check-In UI Module
function setupCheckInHandlers() {
    document.querySelectorAll('.swelling-btn').forEach(btn => {
        const handler = function() {
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
        alert('! Select swelling');
        return;
    }
    
    console.log('💾 Saving check-in and calculating KCI...');
    
    const checkInData = { 
        swelling: AppState.swelling, 
        pain: AppState.pain,
        activityLevel: AppState.activityLevel,
        timeOfDay: AppState.timeOfDay,
        notes: document.getElementById('checkin-notes').value
    };
    
    const enrichedData = DataManager.saveCheckIn(checkInData);
    
    if (enrichedData) {
        updateWeekSummary();
        renderKCIResult(enrichedData.kciScore);
        
        const btn = document.getElementById('save-checkin');
        btn.textContent = 'Calculated!';
        btn.style.background = '#4CAF50';
        setTimeout(() => {
            btn.textContent = 'Calculate My Knee Status';
            btn.style.background = '';
        }, 2000);
    }
}

function renderKCIResult(score) {
    const container = document.getElementById('kci-result-container');
    const scoreDisplay = document.getElementById('kci-score-display');
    const progressBar = document.getElementById('kci-progress-bar');
    const messageDisplay = document.getElementById('kci-message');
    const laneName = document.getElementById('kci-lane-name');
    const planDesc = document.getElementById('kci-plan-desc');
    const recommendationsList = document.getElementById('kci-recommendations');
    
    const info = DataManager.getKCIMessage(score);
    
    // 1. Show container
    container.style.display = 'block';
    
    // 2. Animate score count up
    let current = 0;
    const duration = 1000; // 1 second
    const start = performance.now();
    
    function animate(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuad = t => t * (2 - t);
        const val = Math.floor(easeOutQuad(progress) * score);
        
        scoreDisplay.textContent = `${val}/100`;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            scoreDisplay.textContent = `${score}/100`;
        }
    }
    requestAnimationFrame(animate);
    
    // 3. Update Progress Bar (10 blocks)
    progressBar.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const block = document.createElement('div');
        if (i <= score / 10) {
            block.style.background = info.color;
        }
        progressBar.appendChild(block);
    }
    
    // 4. Update Message & Plan
    messageDisplay.textContent = info.text;
    messageDisplay.style.color = info.color;
    laneName.textContent = info.lane;
    laneName.style.color = info.color;
    planDesc.textContent = info.plan;
    
    // 5. Update Recommendations
    const recommendations = DataManager.getRecommendedExercises(info.lane.split(' ')[0]);
    recommendationsList.innerHTML = recommendations.map(ex => `
        <div class="kci-recommendation-tile" onclick="selectExerciseForLogging('${ex.id}')">
            <span class="tile-icon">${getExerciseIcon(ex.id)}</span>
            <span class="tile-name">${ex.name}</span>
            <span class="plus-log-btn">+</span>
        </div>
    `).join('');
    
    // 6. Setup Buttons
    document.getElementById('kci-start-workout').onclick = () => {
        if (recommendations.length > 0) {
            selectExerciseForLogging(recommendations[0].id);
        }
    };
    document.getElementById('kci-view-all').onclick = () => {
        switchView('log');
        // Pre-filter log view to today's lane
        AppState.selectedLane = info.lane.split(' ')[0];
        if (typeof renderExerciseTiles === 'function') renderExerciseTiles();
    };
    
    // 7. Smooth Scroll
    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

function loadTodayCheckIn() {
    const checkIn = DataManager.getCheckIn(new Date().toISOString().split('T')[0]);
    if (!checkIn) return;
    
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

    if (checkIn.kciScore !== undefined) {
        renderKCIResult(checkIn.kciScore);
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
