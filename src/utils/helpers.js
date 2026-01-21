// Utility Helpers
function getExerciseIcon(id) {
    // Return empty string - no icons/badges needed
    return '';
}

function adjustValue(inputId, delta) {
    const input = document.getElementById(inputId);
    let value = parseInt(input.value) || 0;
    value = Math.max(0, value + delta);
    
    const limits = {
        'sets-completed': 10,
        'reps-completed': 50,
        'hold-time': 120,
        'weight-used': 500,
        'custom-duration': 180
    };
    
    if (limits[inputId]) {
        value = Math.min(limits[inputId], value);
    }
    
    input.value = value;
}

function updateStreakDisplay() {
    const el = document.getElementById('streak-count');
    if (el) el.textContent = DataManager.getCurrentStreak();
}
