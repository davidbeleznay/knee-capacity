// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 KneeCapacity starting...');
    
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
    
    // Initial rendering
    updateStreakDisplay();
    updateKneeStatusCard();
    updateWeekSummary();
    updateMeasurementDisplay();
    loadTodayCheckIn();
    
    console.log('✅ Ready!');
});
