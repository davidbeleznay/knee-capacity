// Utility Helpers
function getExerciseIcon(id) {
    const icons = {
        'spanish-squat': '🔷',
        'wall-sit': '🧱',
        'step-downs': '📉',
        'single-leg-rdl': '🦵',
        'hamstring-bridge': '🌉',
        'tke': '⚡',
        'lateral-band-walk': '↔️',
        'mini-squat': '⬇️',
        'calf-raise': '👟',
        'balance-single-leg': '⚖️',
        'quad-sets': '💪',
        'heel-slides': '↕️'
    };
    return icons[id] || '💪';
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
