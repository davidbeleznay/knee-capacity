// View Router Module
function switchView(viewName) {
    console.log('→', viewName);
    
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${viewName}-view`).classList.add('active');
    document.querySelector(`.nav-btn[data-view="${viewName}"]`).classList.add('active');
    
    AppState.currentView = viewName;
    
    // Trigger view-specific rendering
    if (viewName === 'home') {
        updateKneeStatusCard();
        updateWeekSummary();
    }
    if (viewName === 'log') {
        renderExerciseTiles();
        renderTodaysSummary();
    }
    if (viewName === 'history') {
        renderAnalytics(AppState.analyticsDays);
        renderMeasurementSummary();
    }
    if (viewName === 'exercises') {
        renderExerciseLibrary('all');
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const handler = function() { switchView(this.dataset.view); };
        btn.ontouchstart = handler;
        btn.onclick = handler;
    });
}
