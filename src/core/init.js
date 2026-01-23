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
