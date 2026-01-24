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

// Patient Name Settings
function savePatientName() {
    const name = document.getElementById('patient-name').value.trim();
    if (!name) {
        alert('! Please enter a name');
        return;
    }
    localStorage.setItem('patientName', name);
    alert('Name saved!');
}

function loadPatientName() {
    const name = localStorage.getItem('patientName') || '';
    const input = document.getElementById('patient-name');
    if (input) {
        input.value = name;
    }
}
