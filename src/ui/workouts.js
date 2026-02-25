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

    // Like / Dislike buttons in exercise detail modal (Phase 1 safe-write via DataManager.storage.set)
    const likeBtn = document.getElementById('exercise-like');
    const dislikeBtn = document.getElementById('exercise-dislike');
    if (likeBtn) {
        const h = () => {
            const ex = AppState.selectedExercise;
            if (!ex) return;
            const newLiked = !DataManager.isExerciseLiked(ex.id);
            DataManager.setExerciseLike(ex.id, newLiked);
            if (newLiked) DataManager.setExerciseDislike(ex.id, false);
            updateLikeDislikeButtons(ex.id);
            if (typeof renderExerciseTiles === 'function') renderExerciseTiles();
        };
        likeBtn.ontouchstart = h;
        likeBtn.onclick = h;
    }
    if (dislikeBtn) {
        const h = () => {
            const ex = AppState.selectedExercise;
            if (!ex) return;
            const newDisliked = !DataManager.isExerciseDisliked(ex.id);
            DataManager.setExerciseDislike(ex.id, newDisliked);
            if (newDisliked) DataManager.setExerciseLike(ex.id, false);
            updateLikeDislikeButtons(ex.id);
            if (typeof renderExerciseTiles === 'function') renderExerciseTiles();
        };
        dislikeBtn.ontouchstart = h;
        dislikeBtn.onclick = h;
    }
}

function updateLikeDislikeButtons(exerciseId) {
    const likeBtn = document.getElementById('exercise-like');
    const dislikeBtn = document.getElementById('exercise-dislike');
    if (!likeBtn || !dislikeBtn) return;
    const isLiked = DataManager.isExerciseLiked(exerciseId);
    const isDisliked = DataManager.isExerciseDisliked(exerciseId);
    likeBtn.classList.toggle('active', isLiked);
    dislikeBtn.classList.toggle('active', isDisliked);
    likeBtn.setAttribute('aria-pressed', isLiked);
    dislikeBtn.setAttribute('aria-pressed', isDisliked);
}

function renderExerciseTiles() {
    const container = document.getElementById('exercise-tiles');
    if (!container) return;
    const exercises = window.EXERCISES || [];
    if (!exercises.length) {
        container.innerHTML = '<p style="padding:16px;color:var(--gray-600);">Exercises did not load. Refresh the page (Ctrl+F5 to clear cache). If it persists, open DevTools (F12) and check the Console for errors.</p>';
        return;
    }

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

    // Ensure we always get arrays (Phase 1 storage may return status objects in some code paths)
    const ensureIdArray = (v) => Array.isArray(v) ? v : (v && v.value && Array.isArray(v.value)) ? v.value : [];
    const likedIds = ensureIdArray(DataManager.getLikedExerciseIds());
    const dislikedIds = ensureIdArray(DataManager.getDislikedExerciseIds());
    const favoriteIds = ensureIdArray(DataManager.getFavoriteExerciseIds(5));
    
    const sections = groups.map(group => {
        const exercises = (window.EXERCISES || []).filter(ex => {
            const phaseMatch = ex.phase.some(p => group.phases.includes(p.toUpperCase()));
            if (!phaseMatch) return false;
            if (ex.availability === 'GREEN-only' && kneeStatus !== 'green') return false;
            return true;
        });

        // Sort: LIKED exercises first (top of recommended list), then by name
        exercises.sort((a, b) => {
            const aLiked = likedIds.indexOf(a.id);
            const bLiked = likedIds.indexOf(b.id);
            const aIsLiked = aLiked !== -1;
            const bIsLiked = bLiked !== -1;
            if (aIsLiked && !bIsLiked) return -1;
            if (!aIsLiked && bIsLiked) return 1;
            if (aIsLiked && bIsLiked) return aLiked - bLiked;
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
            const aLiked = likedIds.indexOf(a.id);
            const bLiked = likedIds.indexOf(b.id);
            const aIsLiked = aLiked !== -1;
            const bIsLiked = bLiked !== -1;
            if (aIsLiked && !bIsLiked) return -1;
            if (!aIsLiked && bIsLiked) return 1;
            if (aIsLiked && bIsLiked) return aLiked - bLiked;
            return a.name.localeCompare(b.name);
        });

        sectionExercises.forEach(ex => {
            const icon = getExerciseIcon(ex.id);
            const name = ex.name.replace(' (Isometric)', '').replace(' (Eccentric)', '');
            const isNotRecommended = section.type === 'not-recommended';
            const isFavorite = favoriteIds.includes(ex.id);
            const isLiked = likedIds.includes(ex.id);
            const isDisliked = dislikedIds.includes(ex.id);
            const isNew = ex.isNew === true;
            const heartIcon = isLiked ? '<span style="color: #E53935; font-size: 14px;">❤️</span>' : isDisliked ? '<span style="color: #1565C0; font-size: 14px;">💔</span>' : '';
            
            html += `
                <div id="tile-${ex.id}" class="exercise-tile ${isNotRecommended ? 'not-recommended' : ''} ${isFavorite ? 'favorite-tile' : ''} ${isDisliked ? 'disliked-tile' : ''} ${isNew ? 'exercise-tile-new' : ''}" onclick="toggleExerciseDetails('${ex.id}')">
                    <div class="tile-header">
                        <div class="tile-info">
                            <div class="tile-category">
                                ${ex.category}
                                ${isFavorite ? '<span style="color: #FFD700; font-size: 14px;">⭐</span>' : ''}
                                ${heartIcon}
                                ${isNew ? '<span class="tile-new-badge">NEW</span>' : ''}
                            </div>
                            <div class="tile-name">${name}</div>
                            <div class="tile-meta">${ex.dosage}</div>
                        </div>
                        <button class="log-action-btn" onclick="event.stopPropagation(); selectExerciseForLogging('${ex.id}')">
                            Log
                        </button>
                    </div>
                    
                    <div class="tile-details">
                        <div style="margin-bottom: 12px;">
                            <strong style="font-size: 12px; text-transform: uppercase; color: var(--gray-600);">Setup:</strong>
                            <ul style="margin: 4px 0 0 16px; padding: 0; font-size: 13px; line-height: 1.4;">
                                ${(ex.setup || []).map(s => `<li>${s}</li>`).join('')}
                            </ul>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <strong style="font-size: 12px; text-transform: uppercase; color: var(--gray-600);">Execution:</strong>
                            <ul style="margin: 4px 0 0 16px; padding: 0; font-size: 13px; line-height: 1.4;">
                                ${(ex.execution || []).map(e => `<li>${e}</li>`).join('')}
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
    const targetDetails = targetTile ? targetTile.querySelector('.tile-details') : null;
    if (!targetTile || !targetDetails) return;
    const isExpanding = (targetDetails.style && targetDetails.style.display === 'none');

    // Accordion: Collapse all others (only tiles with .tile-details)
    allTiles.forEach(tile => {
        if (!tile) return;
        tile.classList.remove('expanded');
        const details = tile.querySelector('.tile-details');
        if (details && details.style) details.style.display = 'none';
    });

    if (isExpanding) {
        targetTile.classList.add('expanded');
        if (targetDetails.style) targetDetails.style.display = 'block';
        // Scroll into view if needed
        targetTile.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function selectExerciseForLogging(id) {
    if (typeof window.getExerciseById !== 'function') {
        console.error('selectExerciseForLogging: exercises.js not loaded (getExerciseById missing)');
        return;
    }
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

    // Show "Consider (slant board / upgrade)" section when exercise has enhancement tips
    const enhEl = document.getElementById('instructions-enhancement');
    const enhText = document.getElementById('enhancement-text');
    if (enhEl && enhText) {
        if (ex.enhancement) {
            enhText.textContent = ex.enhancement;
            enhEl.style.display = 'block';
        } else {
            enhEl.style.display = 'none';
        }
    }

    // Update Like/Dislike button states
    updateLikeDislikeButtons(id);

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

    var result = DataManager.saveExerciseLog({
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

    var btn = document.getElementById('save-exercise');
    btn.textContent = 'Logged!';
    btn.style.background = '#4CAF50';
    setTimeout(function () {
        btn.textContent = 'Log';
        btn.style.background = '';
        closeExerciseForm();
        renderTodaysSummary();
        updateWeekSummary();
        updateStreakDisplay();
        if (result && result.success && result.celebration && typeof showCelebrationModal === 'function') {
            showCelebrationModal(result.celebration);
        }
        if (result && !result.success && result.error === 'persistence_failed' && typeof showPersistenceWarning === 'function') {
            showPersistenceWarning();
        }
    }, 1000);
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

    var result = DataManager.saveCustomWorkout({
        workoutCategory: AppState.selectedCustomWorkout,
        workoutType: document.getElementById('custom-workout-type').value || AppState.selectedCustomWorkout,
        durationMinutes: parseInt(document.getElementById('custom-duration').value),
        intensity: parseInt(document.getElementById('custom-intensity').value),
        kneeImpact: AppState.kneeImpact,
        lane: AppState.selectedLane,
        notes: document.getElementById('custom-notes').value
    });

    var btn = document.getElementById('save-custom-workout');
    btn.textContent = 'Logged!';
    btn.style.background = '#4CAF50';
    setTimeout(function () {
        btn.textContent = 'Log';
        btn.style.background = '';
        closeCustomForm();
        renderTodaysSummary();
        updateStreakDisplay();
        if (result && result.success && result.celebration && typeof showCelebrationModal === 'function') {
            showCelebrationModal(result.celebration);
        }
        if (result && !result.success && result.error === 'persistence_failed' && typeof showPersistenceWarning === 'function') {
            showPersistenceWarning();
        }
    }, 1000);
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

    const activeFilter = AppState.libraryFilter || 'All';
    const filters = [
        { label: 'All', id: 'All' },
        { label: '⭐ Favorites', id: 'Favorites' },
        { label: 'Quads', id: 'Quads' },
        { label: 'Hamstrings', id: 'Hamstrings' },
        { label: 'Hips & Glutes', id: 'Hips' },
        { label: 'Calves', id: 'Calves' },
        { label: 'Isometrics', id: 'Isometrics' }
    ];

    // 1. Render Filter Bar
    let html = `
        <div class="filter-bar" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 16px; -webkit-overflow-scrolling: touch;">
            ${filters.map(f => `
                <button 
                    class="library-filter-btn ${activeFilter === f.id ? 'active' : ''}" 
                    onclick="setLibraryFilter('${f.id}')"
                    style="white-space: nowrap; flex-shrink: 0;"
                >
                    ${f.label}
                </button>
            `).join('')}
        </div>
        <div class="exercise-cards-grid">
    `;

    // 2. Filter Exercises
    const likedIds = DataManager.getLikedExerciseIds() || [];
    let exercises = window.EXERCISES || [];

    if (activeFilter === 'Favorites') {
        exercises = exercises.filter(ex => likedIds.includes(ex.id));
    } else if (activeFilter === 'Quads') {
        exercises = exercises.filter(ex => ex.targetMuscles && ex.targetMuscles.includes('Quad'));
    } else if (activeFilter === 'Hamstrings') {
        exercises = exercises.filter(ex => ex.targetMuscles && ex.targetMuscles.includes('Hamstring'));
    } else if (activeFilter === 'Hips') {
        exercises = exercises.filter(ex => ex.targetMuscles && (ex.targetMuscles.includes('Glute') || ex.targetMuscles.includes('Hip')));
    } else if (activeFilter === 'Calves') {
        exercises = exercises.filter(ex => ex.targetMuscles && (ex.targetMuscles.includes('Calf') || ex.targetMuscles.includes('Ankle') || ex.targetMuscles.includes('Soleus') || ex.targetMuscles.includes('Gastrocnemius')));
    } else if (activeFilter === 'Isometrics') {
        exercises = exercises.filter(ex => ex.trackingFocus === 'hold');
    }

    // 3. Sort: Favorites first, then alphabetical
    exercises.sort((a, b) => {
        const aLiked = likedIds.includes(a.id);
        const bLiked = likedIds.includes(b.id);
        if (aLiked && !bLiked) return -1;
        if (!aLiked && bLiked) return 1;
        return a.name.localeCompare(b.name);
    });

    // 4. Render Cards
    if (exercises.length === 0) {
        html += `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--gray-600);">No exercises found for this filter.</div>`;
    } else {
        html += exercises.map(ex => {
            const isLiked = likedIds.includes(ex.id);
            const heartIcon = isLiked ? '<span style="color: #E53935; font-size: 14px; margin-left: 4px;">❤️</span>' : '';
            
            return `
                <div class="exercise-card" style="margin-bottom: 0; height: 100%; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <h4 style="margin: 0; color: var(--primary); font-size: 16px; line-height: 1.3;">
                            ${ex.name} ${heartIcon}
                        </h4>
                        <div style="display: flex; gap: 4px; flex-shrink: 0;">
                            ${(ex.phase || []).map(p => `<span class="tile-phase-badge badge-${p.toLowerCase()}">${p}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div style="font-size: 11px; font-weight: 700; color: var(--gray-600); text-transform: uppercase; margin-bottom: 8px;">
                        ${ex.category}
                    </div>

                    <p style="font-size: 14px; margin-bottom: 12px; line-height: 1.4; flex-grow: 1;">${ex.description}</p>
                    
                    <div style="font-size: 13px; color: var(--gray-600); margin-bottom: 8px;">
                        <strong>Target:</strong> ${ex.targetMuscles}
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 8px; border-radius: 6px; font-size: 13px; margin-top: auto;">
                        <strong>Why:</strong> ${ex.why}
                    </div>
                </div>
            `;
        }).join('');
    }

    html += `</div>`; // Close grid
    container.innerHTML = html;
}

function setLibraryFilter(filter) {
    AppState.libraryFilter = filter;
    renderExerciseLibrary();
}

// Expose for cross-file calls (router.js, init.js)
if (typeof window !== 'undefined') {
    window.setupWorkoutHandlers = setupWorkoutHandlers;
    window.renderExerciseTiles = renderExerciseTiles;
    window.renderTodaysSummary = renderTodaysSummary;
    window.renderExerciseLibrary = renderExerciseLibrary;
    window.setLibraryFilter = setLibraryFilter;
    window.toggleExerciseDetails = toggleExerciseDetails;
    window.selectExerciseForLogging = selectExerciseForLogging;
    window.closeExerciseForm = closeExerciseForm;
    window.selectCustomWorkout = selectCustomWorkout;
    window.closeCustomForm = closeCustomForm;
}
