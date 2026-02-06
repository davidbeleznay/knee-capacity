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
            updateKneeStatusCard();
            updateWeekSummary();
        }
        if (viewName === 'log') {
            if (typeof renderExerciseTiles === 'function') renderExerciseTiles();
            if (typeof renderTodaysSummary === 'function') renderTodaysSummary();
        }
        if (viewName === 'history') {
            if (typeof renderAnalytics === 'function') renderAnalytics(AppState.analyticsDays);
            if (typeof renderMeasurementSummary === 'function') renderMeasurementSummary();
        }
        if (viewName === 'exercises') {
            if (typeof renderExerciseLibrary === 'function') renderExerciseLibrary('all');
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
