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
    analyticsDays: 7
};

function updateState(key, value) {
    AppState[key] = value;
    console.log(`State updated: ${key} = ${value}`);
}

function getState(key) {
    return AppState[key];
}
