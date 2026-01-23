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
        <div style="text-align: left; margin-top: 16px;">
            <div style="margin-bottom: 12px;">
                <strong style="color: var(--primary); display: block; margin-bottom: 4px;">🛤️ Today's Lane:</strong>
                <span style="font-weight: 700; font-size: 16px;">${statusInfo.lane}</span>
            </div>
            <div style="margin-bottom: 12px;">
                <strong style="display: block; margin-bottom: 4px;">📝 Plan:</strong>
                <span style="font-size: 14px; line-height: 1.4;">${statusInfo.plan}</span>
            </div>
            <div style="font-size: 13px; color: var(--gray-600); font-style: italic; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.05);">
                ${statusInfo.reason}
            </div>
        </div>
    `;
    
    updateLaneGuidance();
}

function updateLaneGuidance() {
    const status = DataManager.getKneeStatus();
    const laneCard = document.getElementById('lane-guidance-card');
    const laneOptions = document.getElementById('lane-options');
    
    if (status === 'unknown') {
        laneCard.style.display = 'none';
        return;
    }
    
    laneCard.style.display = 'block';
    const recommendedLanes = DataManager.getRecommendedLanes();
    
    // Auto-select first recommended lane if none selected
    if (!AppState.selectedLane || !recommendedLanes.includes(AppState.selectedLane)) {
        AppState.selectedLane = recommendedLanes[0];
    }
    
    laneOptions.innerHTML = recommendedLanes.map(lane => `
        <button class="lane-btn lane-${lane.toLowerCase()} ${AppState.selectedLane === lane ? 'active' : ''}" 
                onclick="selectLane('${lane}')">
            ${lane}
        </button>
    `).join('');
    
    document.getElementById('lane-explanation').textContent = DataManager.getLaneDescription(AppState.selectedLane);
}

window.selectLane = (lane) => {
    AppState.selectedLane = lane;
    updateLaneGuidance();
    // Render exercise tiles if we switch to log view
    if (AppState.currentView === 'log') renderExerciseTiles();
};

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
    if (history.length < 2) { container.innerHTML = '<p style="text-align: center; padding: 20px;">Log more</p>'; return; }
    
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
                                <strong>Target:</strong> ${ex.target}
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
    
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) { exportBtn.ontouchstart = () => DataManager.exportData(); exportBtn.onclick = () => DataManager.exportData(); }
    
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
    setupNavigation();
    Stopwatch.init();
    if (typeof populateAnalyticsExerciseSelect === 'function') {
        populateAnalyticsExerciseSelect();
    }
    
    // Initial rendering
    updateStreakDisplay();
    updateKneeStatusCard();
    updateWeekSummary();
    updateMeasurementDisplay();
    loadTodayCheckIn();
    
});
