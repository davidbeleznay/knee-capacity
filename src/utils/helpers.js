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

/**
 * @returns {{ currentStreak: number, nextMilestoneDay: number|null, daysRemaining: number|null, percentProgress: number|null }}
 */
function getStreakProgress() {
    var currentStreak = typeof DataManager !== 'undefined' ? DataManager.getCurrentStreak() : 0;
    var next = typeof window.getNextMilestone === 'function' ? window.getNextMilestone(currentStreak) : undefined;
    var nextMilestoneDay = next ? next.day : null;
    var daysRemaining = next ? (next.day - currentStreak) : null;
    var percentProgress = next ? Math.min(100, Math.round((currentStreak / next.day) * 100)) : (currentStreak > 0 ? 100 : null);
    return { currentStreak, nextMilestoneDay, daysRemaining, percentProgress };
}

function renderStreakProgress(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var p = getStreakProgress();
    if (p.nextMilestoneDay != null) {
        el.textContent = 'Day ' + p.currentStreak + ' → Next: Day ' + p.nextMilestoneDay + ' (' + p.daysRemaining + ' left, ' + p.percentProgress + '%)';
        el.style.display = '';
    } else if (p.currentStreak > 0) {
        el.textContent = 'Day ' + p.currentStreak + ' (max milestone reached)';
        el.style.display = '';
    } else {
        el.textContent = 'Log a workout to start your streak';
        el.style.display = '';
    }
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

    renderStreakProgress('home-streak-progress');

    // Update Header Badges
    const headerBadges = document.getElementById('header-badges');
    if (headerBadges) {
        headerBadges.innerHTML = badges.map(b => 
            `<span class="header-badge" title="${b.label}">${b.emoji}</span>`
        ).join('');
    }
}

function showPersistenceWarning() {
    var el = document.getElementById('persistence-warning-banner');
    if (!el) return;
    el.hidden = false;
    var dismiss = document.getElementById('persistence-warning-dismiss');
    if (dismiss && !dismiss._persistenceBound) {
        dismiss._persistenceBound = true;
        dismiss.addEventListener('click', function () { el.hidden = true; });
    }
}

/** Badge id -> placeholder emoji for celebration modal */
var CELEBRATION_BADGE_EMOJI = { spark: '✨', anchor: '⚓', double_digits: '🔟', two_weeks: '📅', habit_groove: '🎯', month_one: '🏆' };

function showCelebrationModal(celebration) {
    if (!celebration || typeof celebration.day !== 'number') return;
    var el = document.getElementById('celebration-modal');
    var badgeEl = document.getElementById('celebration-badge');
    var titleEl = document.getElementById('celebration-title');
    var subtitleEl = document.getElementById('celebration-subtitle');
    var progressEl = document.getElementById('celebration-progress');
    var dismissBtn = document.getElementById('celebration-dismiss');
    if (!el || !badgeEl || !titleEl || !subtitleEl || !progressEl) return;

    var badgeId = (celebration.badges && celebration.badges[0]) ? celebration.badges[0] : '';
    badgeEl.textContent = CELEBRATION_BADGE_EMOJI[badgeId] || '🏆';
    titleEl.textContent = celebration.title || 'Milestone';
    subtitleEl.textContent = celebration.subtitle || '';

    var next = typeof window.getNextMilestone === 'function' ? window.getNextMilestone(celebration.day) : undefined;
    if (next) {
        progressEl.textContent = 'Day ' + celebration.day + ' → Next: Day ' + next.day;
        progressEl.style.display = '';
    } else {
        progressEl.textContent = 'Day ' + celebration.day + ' – max milestone reached';
        progressEl.style.display = '';
    }

    el.hidden = false;

    if (dismissBtn && !dismissBtn._celebrationBound) {
        dismissBtn._celebrationBound = true;
        dismissBtn.addEventListener('click', function () {
            el.hidden = true;
            updateStreakDisplay();
        });
    }
}
