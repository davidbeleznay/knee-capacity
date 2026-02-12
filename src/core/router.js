// View Router Module
function switchView(viewName) {
    
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${viewName}-view`).classList.add('active');
    document.querySelector(`.nav-btn[data-view="${viewName}"]`).classList.add('active');
    
    AppState.currentView = viewName;
    
    // Trigger view-specific rendering (catch so one view cannot break the app)
    try {
        if (viewName === 'home') {
            if (typeof window.updateKneeStatusCard === 'function') window.updateKneeStatusCard();
            if (typeof window.updateWeekSummary === 'function') window.updateWeekSummary();
        }
        if (viewName === 'log') {
            if (typeof window.renderExerciseTiles === 'function') window.renderExerciseTiles();
            if (typeof window.renderTodaysSummary === 'function') window.renderTodaysSummary();
        }
        if (viewName === 'history') {
            if (typeof window.renderAnalytics === 'function') window.renderAnalytics(AppState.analyticsDays);
            if (typeof window.renderMeasurementSummary === 'function') window.renderMeasurementSummary();
        }
        if (viewName === 'exercises') {
            if (typeof window.renderExerciseLibrary === 'function') window.renderExerciseLibrary('all');
        }
    } catch (e) {
        console.error('[switchView] render error for view:', viewName, e.message, e);
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const handler = function() { switchView(this.dataset.view); };
        btn.ontouchstart = handler;
        btn.onclick = handler;
    });
}

// Expose for cross-file calls
if (typeof window !== 'undefined') {
    window.switchView = switchView;
    window.setupNavigation = setupNavigation;
}
