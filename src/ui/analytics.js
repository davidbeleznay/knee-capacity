// Analytics Module

function setupAnalyticsHandlers() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const h = function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            AppState.analyticsDays = parseInt(this.dataset.days);
            renderAnalytics(AppState.analyticsDays);
        };
        btn.ontouchstart = h;
        btn.onclick = h;
    });
    
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) { exportBtn.ontouchstart = () => DataManager.exportData(); exportBtn.onclick = () => DataManager.exportData(); }
}

function renderAnalytics(days) {
    renderSummaryStats(days);
    renderSwellingTrend(days);
    renderPainTrend(days);
    renderHistory(days);
}

function renderSummaryStats(days) {
    const exercises = DataManager.getExerciseLogs().filter(e => (new Date() - new Date(e.date)) / (1000*60*60*24) <= days);
    const custom = DataManager.getCustomWorkouts().filter(w => (new Date() - new Date(w.date)) / (1000*60*60*24) <= days);
    const checkIns = DataManager.getRecentCheckIns(days);
    
    const avgPain = checkIns.length > 0 ? (checkIns.reduce((s, c) => s + (c.pain || 0), 0) / checkIns.length).toFixed(1) : 0;
    const greenDays = checkIns.filter(c => DataManager.getKneeStatusForCheckIn(c) === 'GREEN').length;
    
    document.getElementById('total-workouts').textContent = exercises.length + custom.length;
    document.getElementById('total-exercises').textContent = exercises.length;
    document.getElementById('avg-pain').textContent = avgPain;
    document.getElementById('green-days').textContent = greenDays;
}

function renderSwellingTrend(days) {
    const checkIns = DataManager.getRecentCheckIns(days);
    const container = document.getElementById('swelling-chart');
    if (checkIns.length < 2) { container.innerHTML = '<p style="text-align: center; padding: 20px;">Track more</p>'; return; }
    
    const values = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
    const reversed = [...checkIns].reverse();
    
    container.innerHTML = `<div class="chart-row">${reversed.map(c => {
        const val = values[c.swelling] || 0;
        const height = (val / 3) * 100 || 5;
        const colors = ['#4CAF50', '#FFC107', '#FF9800', '#F44336'];
        return `<div class="chart-bar" style="height: ${height}%; background: ${colors[val]}; min-height: 10px;">
            <span class="chart-label">${new Date(c.date).getDate()}</span></div>`;
    }).join('')}</div><div style="text-align: center; margin-top: 16px; font-size: 13px;">🟢 None | 🟡 Mild | 🟠 Mod | 🔴 Severe</div>`;
}

function renderPainTrend(days) {
    const checkIns = DataManager.getRecentCheckIns(days);
    const container = document.getElementById('pain-chart');
    if (checkIns.length < 2) { container.innerHTML = '<p style="text-align: center; padding: 20px;">Track more</p>'; return; }
    
    const reversed = [...checkIns].reverse();
    const max = Math.max(...reversed.map(c => c.pain || 0), 1);
    const avg = (reversed.reduce((s, c) => s + (c.pain || 0), 0) / reversed.length).toFixed(1);
    
    container.innerHTML = `<div style="text-align: center; margin-bottom: 12px;">Avg: <strong style="font-size: 18px;">${avg}</strong></div>
        <div class="chart-row">${reversed.map(c => {
            const val = c.pain || 0;
            const height = (val / max) * 100 || 5;
            const color = val <= 2 ? '#4CAF50' : val <= 5 ? '#FFC107' : '#F44336';
            return `<div class="chart-bar" style="height: ${height}%; background: ${color}; min-height: 10px;">
                <span class="chart-value">${val}</span><span class="chart-label">${new Date(c.date).getDate()}</span></div>`;
        }).join('')}</div>`;
}

function renderHistory(days) {
    const checkIns = DataManager.getRecentCheckIns(days);
    const list = document.getElementById('history-list');
    if (checkIns.length === 0) { list.innerHTML = '<div class="card"><p style="text-align: center; padding: 40px;">No data</p></div>'; return; }
    
    list.innerHTML = checkIns.map(c => {
        const status = DataManager.getKneeStatusForCheckIn(c);
        const colors = { GREEN: '#4CAF50', YELLOW: '#FFC107', RED: '#F44336' };
        return `<div class="history-item" style="background: white; padding: 16px; border-radius: 12px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between;">
                <div style="font-weight: 700;">${new Date(c.date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}</div>
                <div style="font-weight: 800; color: ${colors[status]};">${status}</div>
            </div>
            <div style="font-size: 14px; color: #666; margin-top: 8px;">
                ${c.swelling} | Pain ${c.pain}/10 | ${c.activityLevel} | ${c.timeOfDay}
            </div></div>`;
    }).join('');
}
