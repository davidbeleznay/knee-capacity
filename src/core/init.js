// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize data
    DataManager.init();
    AppState.kneeStatus = DataManager.getKneeStatus();
    
    // Setup all handlers (all exposed on window by their defining files)
    if (typeof window.setupCheckInHandlers === 'function') window.setupCheckInHandlers();
    if (typeof window.setupWorkoutHandlers === 'function') window.setupWorkoutHandlers();
    if (typeof window.setupAnalyticsHandlers === 'function') window.setupAnalyticsHandlers();
    if (typeof window.setupMeasurementHandlers === 'function') window.setupMeasurementHandlers();
    if (typeof window.setupEventHandlers === 'function') window.setupEventHandlers();
    if (typeof window.setupNavigation === 'function') window.setupNavigation();
    if (typeof Stopwatch !== 'undefined' && Stopwatch.init) Stopwatch.init();
    if (typeof window.populateAnalyticsExerciseSelect === 'function') window.populateAnalyticsExerciseSelect();
    
    // Initial rendering
    if (typeof window.updateStreakDisplay === 'function') window.updateStreakDisplay();
    if (typeof window.updateWeekSummary === 'function') window.updateWeekSummary();
    if (typeof window.updateMeasurementDisplay === 'function') window.updateMeasurementDisplay();
    if (typeof window.renderRecentEventsPreview === 'function') window.renderRecentEventsPreview();
    if (typeof window.renderEventsTimeline === 'function') window.renderEventsTimeline();
    if (typeof window.loadTodayCheckIn === 'function') window.loadTodayCheckIn();
    
});
