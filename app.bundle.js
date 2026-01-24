// State Management Module
const AppState = {
    swelling: null,
    pain: 0,
    activityLevel: 'light',
    timeOfDay: 'morning',
    currentView: 'home',
    kneeStatus: 'unknown',
    selectedExercise: null,
    selectedCustomWorkout: null,
    kneeImpact: 'none',
    posture: 'relaxed',
    analyticsDays: 7,
    selectedLane: null
};

function updateState(key, value) {
    AppState[key] = value;
}

function getState(key) {
    return AppState[key];
}
// Utility Helpers
function getExerciseIcon(id) {
    // Return empty string - no icons/badges needed
    return '';
}

function adjustValue(inputId, delta) {
    const input = document.getElementById(inputId);
    let value = parseFloat(input.value) || 0;
    value = value + delta;
    
    // Handle floating point precision issues
    if (delta % 1 !== 0) {
        value = Math.round(value * 10) / 10;
    } else {
        value = Math.round(value);
    }
    
    value = Math.max(0, value);
    
    const limits = {
        'sets-completed': 10,
        'reps-completed': 50,
        'hold-time': 120,
        'weight-used': 500,
        'custom-duration': 180,
        'knee-right': 60,
        'knee-left': 60,
        'thigh-right': 80,
        'thigh-left': 80,
        'height': 250,
        'waist': 200,
        'weight': 500
    };
    
    if (limits[inputId]) {
        value = Math.min(limits[inputId], value);
    }
    
    input.value = value;
}

function updateStreakDisplay() {
    const streak = DataManager.getCurrentStreak();
    const badges = DataManager.getBadges();
    const totalWorkouts = DataManager.getTotalWorkouts();
    
    // Update Home Streak Card
    const homeStreakCount = document.getElementById('home-streak-count');
    if (homeStreakCount) homeStreakCount.textContent = streak;
    
    const homeTotalWorkouts = document.getElementById('home-total-workouts');
    if (homeTotalWorkouts) homeTotalWorkouts.textContent = totalWorkouts;
    
    const homeBadges = document.getElementById('home-milestone-badges');
    if (homeBadges) {
        homeBadges.innerHTML = badges.map(b => 
            `<span class="milestone-badge-home" data-label="${b.label}">${b.emoji}</span>`
        ).join('') || '<span style="font-size: 12px; opacity: 0.8;">WORKOUT TO EARN BADGES</span>';
    }
    
    // Update Header Badges
    const headerBadges = document.getElementById('header-badges');
    if (headerBadges) {
        headerBadges.innerHTML = badges.map(b => 
            `<span class="header-badge" title="${b.label}">${b.emoji}</span>`
        ).join('');
    }
}
// View Router Module
function switchView(viewName) {
    
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${viewName}-view`).classList.add('active');
    document.querySelector(`.nav-btn[data-view="${viewName}"]`).classList.add('active');
    
    AppState.currentView = viewName;
    
    // Trigger view-specific rendering
    if (viewName === 'home') {
        updateKneeStatusCard();
        updateWeekSummary();
    }
    if (viewName === 'log') {
        renderExerciseTiles();
        renderTodaysSummary();
    }
    if (viewName === 'history') {
        renderAnalytics(AppState.analyticsDays);
        renderMeasurementSummary();
    }
    if (viewName === 'exercises') {
        renderExerciseLibrary('all');
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const handler = function() { switchView(this.dataset.view); };
        btn.ontouchstart = handler;
        btn.onclick = handler;
    });
}
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
        <div class="kci-recommendation-tile" onclick="switchView('log'); selectExerciseForLogging('${ex.id}')">
            <span class="tile-icon">${getExerciseIcon(ex.id)}</span>
            <span class="tile-name">${ex.name}</span>
            <span class="plus-log-btn">+</span>
        </div>
    `).join('');
    
    // 6. Setup Buttons
    document.getElementById('kci-start-workout').onclick = () => {
        if (recommendations.length > 0) {
            switchView('log');
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
// Stopwatch Module
const Stopwatch = {
    seconds: 0,
    isRunning: false,
    interval: null,
    audioContext: null,
    milestones: [30, 45, 60, 90, 120],
    hitMilestones: [],
    
    init() {
        const startBtn = document.getElementById('stopwatch-start');
        const stopBtn = document.getElementById('stopwatch-stop');
        const resetBtn = document.getElementById('stopwatch-reset');
        
        if (startBtn) startBtn.onclick = () => this.start();
        if (stopBtn) stopBtn.onclick = () => this.stop();
        if (resetBtn) resetBtn.onclick = () => {
            if (this.seconds > 0 && confirm('Reset timer?')) this.reset();
            else if (this.seconds > 0) this.reset();
        };
    },
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.hitMilestones = [];
        
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        document.getElementById('stopwatch-start').disabled = true;
        document.getElementById('stopwatch-stop').disabled = false;
        document.getElementById('milestone-badges').style.display = 'flex';
        
        this.interval = setInterval(() => this.tick(), 1000);
    },
    
    tick() {
        this.seconds++;
        this.updateDisplay();
        this.checkMilestones();
    },
    
    stop() {
        if (!this.isRunning) return;
        
        clearInterval(this.interval);
        this.isRunning = false;
        
        document.getElementById('stopwatch-start').disabled = false;
        document.getElementById('stopwatch-stop').disabled = true;
        
        if (this.seconds >= 30) this.playSuccessSound();

        // Auto-sync with exercise log if open
        const holdTimeInput = document.getElementById('hold-time');
        const exerciseForm = document.getElementById('exercise-log-form');
        
        if (holdTimeInput && exerciseForm && exerciseForm.style.display !== 'none' && this.seconds > 0) {
            holdTimeInput.value = this.seconds;
            holdTimeInput.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
            holdTimeInput.style.transition = 'background-color 0.5s';
            setTimeout(() => { holdTimeInput.style.backgroundColor = ''; }, 1000);
        }
    },
    
    reset() {
        clearInterval(this.interval);
        this.isRunning = false;
        this.seconds = 0;
        this.hitMilestones = [];
        
        this.updateDisplay();
        
        document.getElementById('stopwatch-start').disabled = false;
        document.getElementById('stopwatch-stop').disabled = true;
        document.getElementById('milestone-badges').style.display = 'none';
        document.getElementById('milestone-badges').innerHTML = '';
    },
    
    updateDisplay() {
        const mins = Math.floor(this.seconds / 60);
        const secs = this.seconds % 60;
        document.getElementById('stopwatch-display').textContent = 
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    checkMilestones() {
        this.milestones.forEach(milestone => {
            if (this.seconds === milestone && !this.hitMilestones.includes(milestone)) {
                this.hitMilestones.push(milestone);
                this.celebrateMilestone(milestone);
            }
        });
    },
    
    celebrateMilestone(milestone) {
        this.playMilestoneSound(milestone);
        
        const badgesContainer = document.getElementById('milestone-badges');
        const badge = document.createElement('div');
        badge.className = 'milestone-badge milestone-new';
        badge.innerHTML = `<span class="milestone-icon">🎯</span><span class="milestone-text">${milestone}s!</span>`;
        badgesContainer.appendChild(badge);
        
        setTimeout(() => badge.classList.remove('milestone-new'), 500);
        
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    },
    
    playMilestoneSound(milestone) {
        if (!this.audioContext) return;
        
        const frequencies = { 30: 523, 45: 659, 60: 784, 90: 880, 120: 1047 };
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequencies[milestone] || 659;
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    },
    
    playSuccessSound() {
        if (!this.audioContext) return;
        
        [523, 659, 784].forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.3);
            }, i * 100);
        });
    }
};
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
    
    const toggleInstructionsBtn = document.getElementById('toggle-instructions');
    if (toggleInstructionsBtn) {
        toggleInstructionsBtn.onclick = () => {
            const content = document.getElementById('instructions-content');
            const icon = document.getElementById('toggle-instructions-icon');
            const isVisible = content.style.display !== 'none';
            content.style.display = isVisible ? 'none' : 'block';
            icon.textContent = isVisible ? '▶' : '▼';
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
    const favoriteIds = DataManager.getFavoriteExerciseIds(5);
    
    const sections = groups.map(group => {
        const exercises = EXERCISES.filter(ex => {
            const phaseMatch = ex.phase.some(p => group.phases.includes(p.toUpperCase()));
            if (!phaseMatch) return false;
            if (ex.availability === 'GREEN-only' && kneeStatus !== 'green') return false;
            return true;
        });

        // Sort: Favorites first, then by name
        exercises.sort((a, b) => {
            const aFav = favoriteIds.indexOf(a.id);
            const bFav = favoriteIds.indexOf(b.id);
            
            if (aFav !== -1 && bFav !== -1) return aFav - bFav;
            if (aFav !== -1) return -1;
            if (bFav !== -1) return 1;
            return a.name.localeCompare(b.name);
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

        // Instead of sorting categories, we preserve the exercise order within the section
        // but we still group them by category visually if we want, or just list them.
        // The requirement says "Sort to top of each section (CALM/BUILD/PRIME)".
        // Let's keep the category grouping but sort the exercises within each section 
        // across categories or within categories? 
        // "Appear first in their phase section" implies top of the whole section.
        
        // Let's flatten the exercises for the section to show favorites at the very top of the section
        const sectionExercises = [];
        Object.keys(section.categorized).forEach(cat => {
            section.categorized[cat].forEach(ex => sectionExercises.push(ex));
        });
        
        sectionExercises.sort((a, b) => {
            const aFav = favoriteIds.indexOf(a.id);
            const bFav = favoriteIds.indexOf(b.id);
            if (aFav !== -1 && bFav !== -1) return aFav - bFav;
            if (aFav !== -1) return -1;
            if (bFav !== -1) return 1;
            return a.name.localeCompare(b.name);
        });

        sectionExercises.forEach(ex => {
            const icon = getExerciseIcon(ex.id);
            const name = ex.name.replace(' (Isometric)', '').replace(' (Eccentric)', '');
            const isNotRecommended = section.type === 'not-recommended';
            const isFavorite = favoriteIds.includes(ex.id);
            
            html += `
                <div id="tile-${ex.id}" class="exercise-tile ${isNotRecommended ? 'not-recommended' : ''} ${isFavorite ? 'favorite-tile' : ''}" 
                     onclick="toggleExerciseDetails('${ex.id}')">
                    <div class="tile-header" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                                <div class="tile-category" style="font-size: 9px; text-transform: uppercase; color: var(--primary); font-weight: 800;">${ex.category}</div>
                                ${isFavorite ? '<span style="color: #FFD700; font-size: 14px;">⭐</span>' : ''}
                            </div>
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
    
    // Populate exercise instructions
    if (ex.setup && ex.setup.length > 0) {
        document.getElementById('setup-list').innerHTML = ex.setup.map(s => `<li>${s}</li>`).join('');
    }
    if (ex.execution && ex.execution.length > 0) {
        document.getElementById('execution-list').innerHTML = ex.execution.map(e => `<li>${e}</li>`).join('');
    }
    if (ex.targetMuscles) {
        document.getElementById('target-muscles').textContent = ex.targetMuscles;
    }
    
    // Show tempo only for isometric/hold exercises
    const isHoldExercise = ex.dosage && (ex.dosage.toLowerCase().includes('hold') || ex.dosage.toLowerCase().includes('iso'));
    if (ex.tempo && isHoldExercise) {
        document.getElementById('tempo-display').textContent = ex.tempo;
        document.getElementById('instructions-tempo').style.display = 'block';
    } else {
        document.getElementById('instructions-tempo').style.display = 'none';
    }
    
    // Start with instructions collapsed on ALL devices
    const instructionsContent = document.getElementById('instructions-content');
    instructionsContent.style.display = 'none';
    document.getElementById('toggle-instructions-icon').textContent = '▶';
    
    // Smart Defaults: Hold Time
    const defaultHold = ex.defaultHoldTime || 0;
    document.getElementById('hold-time').value = defaultHold;
    document.getElementById('hold-tracker').style.display = defaultHold > 0 ? 'block' : 'none';
    
    // Parse dosage string to extract sets/reps
    // For hold-based exercises, reps = 1 (one hold per set)
    const dosageParts = ex.dosage.match(/(\d+)\s*sets?\s*x\s*(\d+)(?:-(\d+))?\s*(?:reps?|s)?/i);
    if (dosageParts) {
        document.getElementById('sets-completed').value = parseInt(dosageParts[1]) || 3;
        // If it's a hold exercise, default to 1 rep per set (one hold)
        if (defaultHold > 0) {
            document.getElementById('reps-completed').value = 1;
        } else {
            document.getElementById('reps-completed').value = parseInt(dosageParts[2]) || 10;
        }
    } else {
        document.getElementById('sets-completed').value = 3;
        document.getElementById('reps-completed').value = defaultHold > 0 ? 1 : 10;
    }
    
    // Smart Defaults: Weight
    let defaultWeight = 0;
    if (ex.defaultWeight === 'last-used') {
        const history = DataManager.getExerciseHistory(id, 90);
        if (history.length > 0) {
            defaultWeight = history[0].weightUsed || 0;
        }
    } else if (typeof ex.defaultWeight === 'number') {
        defaultWeight = ex.defaultWeight;
    }
    document.getElementById('weight-used').value = defaultWeight;
    
    // Reset other fields
    document.getElementById('rpe-slider').value = 5;
    document.getElementById('rpe-value').textContent = '5';
    document.getElementById('exercise-pain-slider').value = 0;
    document.getElementById('exercise-pain-value').textContent = '0';
    document.getElementById('exercise-notes').value = '';
    
    renderExerciseTrends(id);
    renderExerciseHint(ex, defaultWeight);
}

function renderExerciseHint(ex, lastWeight) {
    const hintContainer = document.getElementById('exercise-hint');
    if (!hintContainer) return;
    
    let hint = '';
    if (ex.trackingFocus === 'hold') {
        hint = `💡 Typical hold: ${ex.defaultHoldTime || 30}-60s`;
    } else if (ex.trackingFocus === 'weight' && lastWeight > 0) {
        hint = `💡 Last used: ${lastWeight} lbs`;
    } else if (ex.trackingFocus === 'reps') {
        hint = `💡 Focus on controlled reps`;
    }
    
    hintContainer.textContent = hint;
    hintContainer.style.display = hint ? 'block' : 'none';
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
// Analytics Module

function setupAnalyticsHandlers() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const h = function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            AppState.analyticsDays = parseInt(this.dataset.days);
            renderAnalytics(AppState.analyticsDays);
        };
        btn.ontouchstart = h;
        btn.onclick = h;
    });
    
    const exportJsonBtn = document.getElementById('export-json');
    if (exportJsonBtn) { 
        exportJsonBtn.ontouchstart = () => DataManager.exportData(); 
        exportJsonBtn.onclick = () => DataManager.exportData(); 
    }
    
    const exportPdfBtn = document.getElementById('export-pdf');
    if (exportPdfBtn) { 
        exportPdfBtn.ontouchstart = () => DataManager.exportPDF(); 
        exportPdfBtn.onclick = () => DataManager.exportPDF(); 
    }
    
    const exerciseSelect = document.getElementById('analytics-exercise-select');
    if (exerciseSelect) {
        exerciseSelect.onchange = (e) => {
            if (e.target.value) renderIndividualExerciseAnalytics(e.target.value, AppState.analyticsDays);
        };
    }
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
    
    const avgPain = checkIns.length > 0 ? (checkIns.reduce((s, c) => s + (c.pain || 0), 0) / checkIns.length).toFixed(1) : 0;
    const greenDays = checkIns.filter(c => DataManager.getKneeStatusForCheckIn(c) === 'GREEN').length;
    
    document.getElementById('total-workouts').textContent = exercises.length + custom.length;
    document.getElementById('total-exercises').textContent = exercises.length;
    document.getElementById('avg-pain').textContent = avgPain;
    document.getElementById('green-days').textContent = greenDays;
}

function populateAnalyticsExerciseSelect() {
    const select = document.getElementById('analytics-exercise-select');
    if (!select) return;
    
    // Avoid duplicating options if called multiple times
    select.innerHTML = '<option value="">Select an exercise</option>';
    
    (window.EXERCISES || []).forEach(ex => {
        const option = document.createElement('option');
        option.value = ex.id;
        option.textContent = ex.name;
        select.appendChild(option);
    });
}

function renderWorkoutFrequency(days) {
    const container = document.getElementById('workout-frequency-chart');
    if (!container) return;
    
    const exercises = DataManager.getExerciseLogs();
    const custom = DataManager.getCustomWorkouts();
    
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
                const color = d.count === 0 ? 'var(--gray-300)' : d.count === 1 ? 'var(--green)' : d.count === 2 ? 'var(--primary)' : 'var(--orange)';
                
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
    const container = document.getElementById('exercise-breakdown');
    if (!container) return;
    
    const exercises = DataManager.getExerciseLogs().filter(e => (new Date() - new Date(e.date)) / (1000*60*60*24) <= days);
    
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
                    <span style="color: var(--primary); font-weight: 700;">${count}x</span>
                </div>
                <div style="height: 8px; background: var(--gray-200); border-radius: 4px;">
                    <div style="height: 100%; width: ${width}%; background: var(--primary); border-radius: 4px;"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderIndividualExerciseAnalytics(id, days) {
    const container = document.getElementById('exercise-analytics');
    if (!container) return;
    
    const history = DataManager.getExerciseHistory(id, days);
    
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
    const avgPain = (history.reduce((s, h) => s + (h.pain || 0), 0) / total).toFixed(1);
    
    const recent = history.slice(0, 10).reverse();
    
    container.innerHTML = `
        <div style="text-align: center; font-size: 40px; margin: 20px 0;">${icon}</div>
        
        <div style="background: var(--gray-50); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 14px;">
                <div><div style="color: var(--gray-600);">Sessions</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${total}</div></div>
                <div><div style="color: var(--gray-600);">Avg Pain</div><div style="font-weight: 700; font-size: 20px; color: ${avgPain > 3 ? 'var(--red)' : 'var(--primary)'}">${avgPain}</div></div>
                <div><div style="color: var(--gray-600);">RPE</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgRPE}</div></div>
                <div><div style="color: var(--gray-600);">Sets</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgSets}</div></div>
                <div><div style="color: var(--gray-600);">Reps</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgReps}</div></div>
                ${avgHold > 0 ? `<div><div style="color: var(--gray-600);">Hold</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgHold}s</div></div>` : ''}
                ${avgWeight > 0 ? `<div><div style="color: var(--gray-600);">Weight</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgWeight}lb</div></div>` : ''}
            </div>
        </div>
        
        ${avgHold > 0 ? renderMetricTrend(recent, 'hold', 'Hold (s)') : ''}
        ${avgWeight > 0 ? renderMetricTrend(recent, 'weight', 'Weight (lbs)') : ''}
        ${renderMetricTrend(recent, 'rpe', 'RPE')}
        ${renderMetricTrend(recent, 'pain', 'Knee Pain')}
    `;
}

function renderMetricTrend(sessions, metric, label) {
    const getValue = (l) => metric === 'weight' ? l.weightUsed : metric === 'hold' ? l.holdTimeSeconds : metric === 'pain' ? (l.pain || 0) : l.rpe;
    const values = sessions.map(getValue);
    const max = Math.max(...values, 1);
    const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
    
    return `
        <div style="margin-top: 20px;">
            <div style="font-weight: 700; margin-bottom: 8px;">${label}</div>
            <div style="text-align: center; font-size: 13px; margin-bottom: 8px;">Avg: <strong style="color: var(--primary)">${avg}</strong></div>
            <div class="chart-row" style="height: 120px;">
                ${sessions.map((l, i) => {
                    const val = getValue(l);
                    const height = (val / max) * 100;
                    const improved = i > 0 && val > getValue(sessions[i-1]);
                    const color = (metric === 'rpe' || metric === 'pain') ? (val >= 8 ? 'var(--red)' : val >= 6 ? 'var(--yellow)' : 'var(--green)') : improved ? 'var(--green)' : 'var(--primary)';
                    
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
    if (checkIns.length < 2) { container.innerHTML = '<p style="text-align: center; padding: 20px;">Track more</p>'; return; }
    
    const values = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
    const reversed = [...checkIns].reverse();
    
    container.innerHTML = `<div class="chart-row">${reversed.map(c => {
        const val = values[c.swelling] || 0;
        const height = (val / 3) * 100 || 5;
        const colors = ['#4CAF50', '#FFC107', '#FF9800', '#F44336'];
        return `<div class="chart-bar" style="height: ${height}%; background: ${colors[val]}; min-height: 10px;">
            <span class="chart-label">${new Date(c.date).getDate()}</span></div>`;
    }).join('')}</div><div style="text-align: center; margin-top: 16px; font-size: 13px;">&#128994; None | &#128993; Mild | &#128992; Mod | &#128308; Severe</div>`;
}

function renderPainTrend(days) {
    const checkIns = DataManager.getRecentCheckIns(days);
    const container = document.getElementById('pain-chart');
    if (checkIns.length < 2) { container.innerHTML = '<p style="text-align: center; padding: 20px;">Track more</p>'; return; }
    
    const reversed = [...checkIns].reverse();
    const max = Math.max(...reversed.map(c => c.pain || 0), 1);
    const avg = (reversed.reduce((s, c) => s + (c.pain || 0), 0) / reversed.length).toFixed(1);
    
    container.innerHTML = `<div style="text-align: center; margin-bottom: 12px;">Avg: <strong style="font-size: 18px;">${avg}</strong></div>
        <div class="chart-row">${reversed.map(c => {
            const val = c.pain || 0;
            const height = (val / max) * 100 || 5;
            const color = val <= 2 ? '#4CAF50' : val <= 5 ? '#FFC107' : '#F44336';
            return `<div class="chart-bar" style="height: ${height}%; background: ${color}; min-height: 10px;">
                <span class="chart-value">${val}</span><span class="chart-label">${new Date(c.date).getDate()}</span></div>`;
        }).join('')}</div>`;
}

function renderHistory(days) {
    const checkIns = DataManager.getRecentCheckIns(days);
    const exerciseLogs = DataManager.getExerciseLogs().filter(e => (new Date() - new Date(e.date)) / (1000*60*60*24) <= days);
    const customWorkouts = DataManager.getCustomWorkouts().filter(w => (new Date() - new Date(w.date)) / (1000*60*60*24) <= days);
    
    const list = document.getElementById('history-list');
    if (checkIns.length === 0 && exerciseLogs.length === 0 && customWorkouts.length === 0) { 
        list.innerHTML = '<div class="card"><p style="text-align: center; padding: 40px;">No data</p></div>'; 
        return; 
    }
    
    // Create a combined map of date -> checkin/workouts
    const dates = [...new Set([
        ...checkIns.map(c => c.date),
        ...exerciseLogs.map(e => e.date),
        ...customWorkouts.map(w => w.date)
    ])].sort().reverse();

    list.innerHTML = dates.map(date => {
        const checkIn = checkIns.find(c => c.date === date);
        const dayEx = exerciseLogs.filter(e => e.date === date);
        const dayCu = customWorkouts.filter(w => w.date === date);
        
        let html = `<div class="history-item" style="background: white; padding: 18px; border-radius: 12px; margin-bottom: 12px;">
            <div style="font-weight: 800; font-size: 16px; margin-bottom: 10px;">${new Date(date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}</div>`;
        
        if (checkIn) {
            const status = DataManager.getKneeStatusForCheckIn(checkIn);
            const statusColors = { GREEN: '#4CAF50', YELLOW: '#FFC107', RED: '#F44336' };
            html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--gray-100);">
                <span style="font-size: 14px; font-weight: 600;">Status: <span style="color: ${statusColors[status]}">${status}</span></span>
                <span style="font-size: 12px; color: var(--gray-600);">${checkIn.swelling} | Pain ${checkIn.pain}/10</span>
            </div>`;
        }

        if (dayEx.length > 0 || dayCu.length > 0) {
            const lane = (dayEx[0] || dayCu[0])?.lane;
            const laneColors = { CALM: '#4CAF50', BUILD: '#FF9800', PRIME: '#F44336' };
            if (lane) {
                html += `<div style="margin-top: 8px; font-size: 13px; font-weight: 700; color: ${laneColors[lane] || 'var(--primary)'}">
                    Lane: ${lane}
                </div>`;
            }
            
            html += `<div style="margin-top: 8px; font-size: 13px; color: var(--gray-600);">
                ${dayEx.map(e => `<div>• ${e.exerciseName.split('(')[0].trim()} (${e.setsCompleted}x${e.repsPerSet})</div>`).join('')}
                ${dayCu.map(w => `<div>• ${w.workoutType} (${w.durationMinutes}m)</div>`).join('')}
            </div>`;
        }
        
        html += '</div>';
        return html;
    }).join('');
}

// "Exports" for the concatenated bundle model (optional, but useful for debugging / inline handlers)
window.populateAnalyticsExerciseSelect = populateAnalyticsExerciseSelect;
window.renderIndividualExerciseAnalytics = renderIndividualExerciseAnalytics;
// Measurements Module

function setupMeasurementHandlers() {
    document.querySelectorAll('.posture-btn').forEach(btn => {
        const h = function() {
            document.querySelectorAll('.posture-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            AppState.posture = this.dataset.posture;
        };
        btn.ontouchstart = h;
        btn.onclick = h;
    });
    
    const saveBtn = document.getElementById('save-measurement');
    if (saveBtn) { saveBtn.ontouchstart = saveMeasurement; saveBtn.onclick = saveMeasurement; }
}

function openMeasurementModal() {
    document.getElementById('measurement-modal').style.display = 'flex';
    const latest = DataManager.getLatestBodyMeasurement();
    if (latest?.measurements) {
        const m = latest.measurements;
        if (m.knee_top_cm) {
            document.getElementById('knee-right').value = m.knee_top_cm.right || '';
            document.getElementById('knee-left').value = m.knee_top_cm.left || '';
        }
        if (m.thigh_cm) {
            document.getElementById('thigh-right').value = m.thigh_cm.right || '';
            document.getElementById('thigh-left').value = m.thigh_cm.left || '';
        }
        document.getElementById('height').value = m.height_cm || '';
        document.getElementById('waist').value = m.waist_cm || '';
        document.getElementById('weight').value = m.weight_lb || '';
    }
}

function closeMeasurementModal() {
    document.getElementById('measurement-modal').style.display = 'none';
}

function saveMeasurement() {
    const kneeRight = parseFloat(document.getElementById('knee-right').value);
    const kneeLeft = parseFloat(document.getElementById('knee-left').value);
    const thighRight = parseFloat(document.getElementById('thigh-right').value);
    const thighLeft = parseFloat(document.getElementById('thigh-left').value);
    const height = parseFloat(document.getElementById('height').value);
    
    if (!kneeRight || !kneeLeft) { alert('! Enter both knees'); return; }
    
    const data = { 
        measurements: { 
            knee_top_cm: { right: kneeRight, left: kneeLeft, method: '2cm above patella' },
            thigh_cm: { right: thighRight || 0, left: thighLeft || 0, method: 'mid-thigh' },
            height_cm: height || 0
        }, 
        posture: AppState.posture, 
        notes: document.getElementById('measurement-notes').value, 
        type: 'measurement' 
    };
    
    const waist = parseFloat(document.getElementById('waist').value);
    if (waist) data.measurements.waist_cm = waist;
    const weight = parseFloat(document.getElementById('weight').value);
    if (weight) data.measurements.weight_lb = weight;
    
    if (DataManager.saveBodyMeasurement(data)) {
        alert('Saved!');
        closeMeasurementModal();
        updateMeasurementDisplay();
        renderMeasurementSummary();
    }
}

function updateMeasurementDisplay() {
    const latest = DataManager.getLatestBodyMeasurement();
    const el = document.getElementById('last-measurement-date');
    if (!el) return;
    if (latest) el.textContent = `Last: ${new Date(latest.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}`;
    else el.textContent = 'Tap to add';
}

function renderMeasurementSummary() {
    const container = document.getElementById('measurement-summary');
    if (!container) return;
    const latest = DataManager.getLatestBodyMeasurement();
    if (!latest) { container.innerHTML = '<p style="text-align: center; padding: 20px;">No data</p>'; return; }
    
    const m = latest.measurements;
    const derived = DataManager.getDerivedMetrics();
    let html = '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">';
    
    if (derived.bmi) {
        const status = derived.bmi < 25 ? 'Normal' : 'Over';
        const color = derived.bmi < 25 ? '#4CAF50' : '#FFC107';
        html += `<div class="metric-card"><div class="metric-label">BMI</div><div class="metric-value">${derived.bmi}</div><div class="metric-status" style="color: ${color};">${status}</div></div>`;
    }
    if (derived.kneeDifference) {
        const diff = parseFloat(derived.kneeDifference);
        const color = Math.abs(diff) < 0.5 ? '#4CAF50' : '#FFC107';
        html += `<div class="metric-card"><div class="metric-label">R-L Diff</div><div class="metric-value">${derived.kneeDifference}cm</div><div class="metric-status" style="color: ${color};">${diff > 0 ? 'R larger' : 'Equal'}</div></div>`;
    }
    html += '</div>';
    if (m.knee_top_cm) html += `<div class="measurement-row"><span>Knee</span><span>R ${m.knee_top_cm.right} | L ${m.knee_top_cm.left} cm</span></div>`;
    if (m.thigh_cm) html += `<div class="measurement-row"><span>Thigh</span><span>R ${m.thigh_cm.right} | L ${m.thigh_cm.left} cm</span></div>`;
    if (m.height_cm) html += `<div class="measurement-row"><span>Height</span><span>${m.height_cm} cm</span></div>`;
    if (m.weight_lb) html += `<div class="measurement-row"><span>Weight</span><span>${m.weight_lb} lbs</span></div>`;
    container.innerHTML = html;
}
// Events Module - Significant Event Logging

const EVENT_TYPES = {
    pain_spike: { label: "Pain Spike", icon: "⚡", color: "#F44336" },
    instability: { label: "Instability Event", icon: "⚠️", color: "#FF9800" },
    mechanical: { label: "Mechanical Symptoms", icon: "⚙️", color: "#9C27B0" },
    swelling_spike: { label: "Swelling Spike", icon: "💧", color: "#2196F3" },
    post_activity_flare: { label: "Post-Activity Flare", icon: "🔥", color: "#FF5722" },
    other: { label: "Other", icon: "📝", color: "#607D8B" }
};

const DURATION_OPTIONS = [
    "< 1 hour",
    "1-6 hours",
    "6-24 hours",
    "1-2 days",
    "3-7 days",
    "> 7 days (ongoing)",
    "Custom"
];

function setupEventHandlers() {
    const saveBtn = document.getElementById('save-event');
    if (saveBtn) {
        saveBtn.ontouchstart = saveEvent;
        saveBtn.onclick = saveEvent;
    }
    
    const painSlider = document.getElementById('event-pain-slider');
    if (painSlider) {
        painSlider.oninput = (e) => {
            document.getElementById('event-pain-value').textContent = e.target.value;
        };
    }
}

function openEventModal(eventId = null) {
    const modal = document.getElementById('event-modal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    if (eventId) {
        // Edit existing event
        const event = DataManager.getEventById(eventId);
        if (event) {
            document.getElementById('event-id').value = event.id;
            document.getElementById('event-type').value = event.eventType;
            document.getElementById('event-date').value = event.date;
            document.getElementById('event-time').value = event.timestamp.split('T')[1].substring(0, 5);
            document.getElementById('event-pain-slider').value = event.painLevel;
            document.getElementById('event-pain-value').textContent = event.painLevel;
            document.getElementById('event-activity').value = event.activity;
            document.getElementById('event-duration').value = event.duration;
            document.getElementById('event-resolution').value = event.resolution;
            document.getElementById('event-notes').value = event.notes || '';
            
            // Red flags
            if (event.redFlags) {
                document.getElementById('flag-locking').checked = event.redFlags.locking || false;
                document.getElementById('flag-cant-bear-weight').checked = event.redFlags.cantBearWeight || false;
                document.getElementById('flag-severe-swelling').checked = event.redFlags.severeSwelling7Days || false;
                document.getElementById('flag-giving-way').checked = event.redFlags.suddenGivingWay || false;
            }
            
            document.getElementById('event-modal-title').textContent = 'Edit Significant Event';
        }
    } else {
        // New event - set defaults
        document.getElementById('event-id').value = '';
        document.getElementById('event-type').value = 'pain_spike';
        
        const now = new Date();
        document.getElementById('event-date').value = now.toISOString().split('T')[0];
        document.getElementById('event-time').value = now.toTimeString().substring(0, 5);
        
        document.getElementById('event-pain-slider').value = 5;
        document.getElementById('event-pain-value').textContent = '5';
        document.getElementById('event-activity').value = '';
        document.getElementById('event-duration').value = '1-6 hours';
        document.getElementById('event-resolution').value = '';
        document.getElementById('event-notes').value = '';
        
        // Reset red flags
        document.getElementById('flag-locking').checked = false;
        document.getElementById('flag-cant-bear-weight').checked = false;
        document.getElementById('flag-severe-swelling').checked = false;
        document.getElementById('flag-giving-way').checked = false;
        
        document.getElementById('event-modal-title').textContent = '⚠️ Log Significant Event';
    }
}

function closeEventModal() {
    document.getElementById('event-modal').style.display = 'none';
}

function saveEvent() {
    const eventId = document.getElementById('event-id').value;
    const eventType = document.getElementById('event-type').value;
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const painLevel = parseInt(document.getElementById('event-pain-slider').value);
    const activity = document.getElementById('event-activity').value.trim();
    const duration = document.getElementById('event-duration').value;
    const resolution = document.getElementById('event-resolution').value.trim();
    const notes = document.getElementById('event-notes').value.trim();
    
    // Validation
    if (!eventType) {
        alert('! Please select an event type');
        return;
    }
    if (!activity) {
        alert('! Please describe what you were doing');
        return;
    }
    
    // Red flags
    const redFlags = {
        locking: document.getElementById('flag-locking').checked,
        cantBearWeight: document.getElementById('flag-cant-bear-weight').checked,
        severeSwelling7Days: document.getElementById('flag-severe-swelling').checked,
        suddenGivingWay: document.getElementById('flag-giving-way').checked
    };
    
    // Check for red flags and warn user
    const hasRedFlags = Object.values(redFlags).some(v => v);
    if (hasRedFlags) {
        const flagNames = [];
        if (redFlags.locking) flagNames.push('knee locking');
        if (redFlags.cantBearWeight) flagNames.push('unable to bear weight');
        if (redFlags.severeSwelling7Days) flagNames.push('severe swelling >7 days');
        if (redFlags.suddenGivingWay) flagNames.push('sudden giving way');
        
        const warningMsg = `⚠️ RED FLAG SYMPTOMS DETECTED:\n\n${flagNames.join(', ')}\n\nThese symptoms may require immediate medical attention. Consider contacting your healthcare provider.`;
        alert(warningMsg);
    }
    
    const eventData = {
        eventType,
        date,
        timestamp: `${date}T${time}:00.000Z`,
        painLevel,
        activity,
        duration,
        resolution,
        notes,
        redFlags
    };
    
    let success = false;
    if (eventId) {
        // Update existing
        success = DataManager.updateEvent(eventId, eventData);
    } else {
        // Create new
        success = DataManager.saveSignificantEvent(eventData);
    }
    
    if (success) {
        alert(eventId ? 'Event updated!' : 'Event logged!');
        closeEventModal();
        renderRecentEventsPreview();
        renderEventsTimeline();
    } else {
        alert('! Failed to save event');
    }
}

function deleteEventWithConfirm(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    
    if (DataManager.deleteEvent(id)) {
        alert('Event deleted');
        renderRecentEventsPreview();
        renderEventsTimeline();
    } else {
        alert('! Failed to delete event');
    }
}

function renderRecentEventsPreview() {
    const container = document.getElementById('recent-events-preview');
    if (!container) return;
    
    const events = DataManager.getSignificantEvents(90);
    
    if (events.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-500); font-size: 12px;">No events logged</p>';
        return;
    }
    
    const recent = events.slice(0, 3);
    container.innerHTML = recent.map(e => {
        const date = new Date(e.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
        const type = EVENT_TYPES[e.eventType];
        return `<div style="font-size: 12px; color: var(--gray-600); margin-bottom: 4px;">
            ${type.icon} ${date}: ${type.label} (${e.painLevel}/10)
        </div>`;
    }).join('');
}

function renderEventsTimeline() {
    const container = document.getElementById('events-timeline');
    if (!container) return;
    
    const events = DataManager.getSignificantEvents(90);
    
    if (events.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--gray-500);">No significant events logged in the last 90 days</p>';
        return;
    }
    
    container.innerHTML = events.map(e => {
        const date = new Date(e.date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'});
        const type = EVENT_TYPES[e.eventType];
        
        // Check for red flags
        const hasRedFlags = e.redFlags && Object.values(e.redFlags).some(v => v);
        const redFlagHtml = hasRedFlags ? `
            <div style="background: #FFEBEE; border-left: 4px solid #F44336; padding: 8px; margin-top: 8px; border-radius: 4px;">
                <strong style="color: #F44336;">🚨 Red Flags:</strong>
                <div style="font-size: 12px; margin-top: 4px;">
                    ${e.redFlags.locking ? '• Knee locking/catching<br>' : ''}
                    ${e.redFlags.cantBearWeight ? '• Unable to bear weight<br>' : ''}
                    ${e.redFlags.severeSwelling7Days ? '• Severe swelling >7 days<br>' : ''}
                    ${e.redFlags.suddenGivingWay ? '• Sudden giving way<br>' : ''}
                </div>
            </div>
        ` : '';
        
        return `
            <div class="event-card" style="background: white; border-left: 4px solid ${type.color}; padding: 16px; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                        <div style="font-size: 18px; font-weight: 700; color: ${type.color};">
                            ${type.icon} ${type.label}
                        </div>
                        <div style="font-size: 13px; color: var(--gray-600); margin-top: 2px;">
                            ${date}
                        </div>
                    </div>
                    <div style="font-size: 24px; font-weight: 800; color: ${type.color};">
                        ${e.painLevel}/10
                    </div>
                </div>
                
                <div style="font-size: 14px; margin-bottom: 8px;">
                    <strong>Activity:</strong> ${e.activity}
                </div>
                <div style="font-size: 14px; margin-bottom: 8px;">
                    <strong>Duration:</strong> ${e.duration}
                </div>
                <div style="font-size: 14px; margin-bottom: 8px;">
                    <strong>Resolution:</strong> ${e.resolution}
                </div>
                ${e.notes ? `<div style="font-size: 13px; color: var(--gray-600); font-style: italic; margin-bottom: 8px;">
                    "${e.notes}"
                </div>` : ''}
                
                ${redFlagHtml}
                
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="secondary-button" onclick="openEventModal('${e.id}')" style="font-size: 12px; padding: 6px 12px;">
                        Edit
                    </button>
                    <button class="secondary-button" onclick="deleteEventWithConfirm('${e.id}')" style="font-size: 12px; padding: 6px 12px; color: #F44336;">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}
// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize data
    DataManager.init();
    AppState.kneeStatus = DataManager.getKneeStatus();
    
    // Setup all handlers
    setupCheckInHandlers();
    setupWorkoutHandlers();
    setupAnalyticsHandlers();
    setupMeasurementHandlers();
    setupEventHandlers();
    setupNavigation();
    Stopwatch.init();
    if (typeof populateAnalyticsExerciseSelect === 'function') {
        populateAnalyticsExerciseSelect();
    }
    
    // Initial rendering
    updateStreakDisplay();
    updateWeekSummary();
    updateMeasurementDisplay();
    renderRecentEventsPreview();
    renderEventsTimeline();
    loadTodayCheckIn();
    
});
