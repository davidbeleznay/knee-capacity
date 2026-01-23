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
    
    const exerciseSelect = document.getElementById('analytics-exercise-select');
    if (exerciseSelect) {
        exerciseSelect.onchange = (e) => {
            if (e.target.value) renderIndividualExerciseAnalytics(e.target.value, AppState.analyticsDays);
        };
    }
}

function renderAnalytics(days) {
    renderSummaryStats(days);
    renderSwellingTrend(days);
    renderPainTrend(days);
    renderWorkoutFrequency(days);
    renderExerciseBreakdown(days);
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

function populateAnalyticsExerciseSelect() {
    const select = document.getElementById('analytics-exercise-select');
    if (!select) return;
    
    // Avoid duplicating options if called multiple times
    select.innerHTML = '<option value="">Select an exercise</option>';
    
    (window.EXERCISES || []).forEach(ex => {
        const option = document.createElement('option');
        option.value = ex.id;
        option.textContent = ex.name;
        select.appendChild(option);
    });
}

function renderWorkoutFrequency(days) {
    const container = document.getElementById('workout-frequency-chart');
    if (!container) return;
    
    const exercises = DataManager.getExerciseLogs();
    const custom = DataManager.getCustomWorkouts();
    
    const dateMap = {};
    [...exercises, ...custom].forEach(item => {
        const date = item.date || item.timestamp.split('T')[0];
        dateMap[date] = (dateMap[date] || 0) + 1;
    });
    
    const daysArray = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        daysArray.push({ date: dateStr, count: dateMap[dateStr] || 0 });
    }
    
    const max = Math.max(...daysArray.map(d => d.count), 1);
    
    container.innerHTML = `
        <div class="chart-row" style="height: 100px;">
            ${daysArray.map(d => {
                const height = (d.count / max) * 100 || 5;
                const color = d.count === 0 ? 'var(--gray-300)' : d.count === 1 ? 'var(--green)' : d.count === 2 ? 'var(--primary)' : 'var(--orange)';
                
                return `
                    <div class="chart-bar" style="height: ${height}%; background: ${color}; min-height: 8px;">
                        ${d.count > 0 ? `<span class="chart-value">${d.count}</span>` : ''}
                        <span class="chart-label">${new Date(d.date).getDate()}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderExerciseBreakdown(days) {
    const container = document.getElementById('exercise-breakdown');
    if (!container) return;
    
    const exercises = DataManager.getExerciseLogs().filter(e => (new Date() - new Date(e.date)) / (1000*60*60*24) <= days);
    
    if (exercises.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">None yet</p>';
        return;
    }
    
    const counts = {};
    exercises.forEach(e => counts[e.exerciseId] = (counts[e.exerciseId] || 0) + 1);
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0][1];
    
    container.innerHTML = sorted.map(([id, count]) => {
        const ex = window.getExerciseById(id);
        const icon = getExerciseIcon(id);
        const width = (count / max) * 100;
        
        return `
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-weight: 600;">${icon} ${ex.name.split('(')[0].trim()}</span>
                    <span style="color: var(--primary); font-weight: 700;">${count}x</span>
                </div>
                <div style="height: 8px; background: var(--gray-200); border-radius: 4px;">
                    <div style="height: 100%; width: ${width}%; background: var(--primary); border-radius: 4px;"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderIndividualExerciseAnalytics(id, days) {
    const container = document.getElementById('exercise-analytics');
    if (!container) return;
    
    const history = DataManager.getExerciseHistory(id, days);
    
    if (history.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 20px;">No data</p>';
        return;
    }
    
    const icon = getExerciseIcon(id);
    const total = history.length;
    const avgSets = (history.reduce((s, h) => s + h.setsCompleted, 0) / total).toFixed(1);
    const avgReps = (history.reduce((s, h) => s + h.repsPerSet, 0) / total).toFixed(1);
    const avgHold = (history.reduce((s, h) => s + (h.holdTimeSeconds || 0), 0) / total).toFixed(1);
    const avgWeight = (history.reduce((s, h) => s + (h.weightUsed || 0), 0) / total).toFixed(1);
    const avgRPE = (history.reduce((s, h) => s + h.rpe, 0) / total).toFixed(1);
    const avgPain = (history.reduce((s, h) => s + (h.pain || 0), 0) / total).toFixed(1);
    
    const recent = history.slice(0, 10).reverse();
    
    container.innerHTML = `
        <div style="text-align: center; font-size: 40px; margin: 20px 0;">${icon}</div>
        
        <div style="background: var(--gray-50); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 14px;">
                <div><div style="color: var(--gray-600);">Sessions</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${total}</div></div>
                <div><div style="color: var(--gray-600);">Avg Pain</div><div style="font-weight: 700; font-size: 20px; color: ${avgPain > 3 ? 'var(--red)' : 'var(--primary)'}">${avgPain}</div></div>
                <div><div style="color: var(--gray-600);">RPE</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgRPE}</div></div>
                <div><div style="color: var(--gray-600);">Sets</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgSets}</div></div>
                <div><div style="color: var(--gray-600);">Reps</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgReps}</div></div>
                ${avgHold > 0 ? `<div><div style="color: var(--gray-600);">Hold</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgHold}s</div></div>` : ''}
                ${avgWeight > 0 ? `<div><div style="color: var(--gray-600);">Weight</div><div style="font-weight: 700; font-size: 20px; color: var(--primary)">${avgWeight}lb</div></div>` : ''}
            </div>
        </div>
        
        ${avgHold > 0 ? renderMetricTrend(recent, 'hold', 'Hold (s)') : ''}
        ${avgWeight > 0 ? renderMetricTrend(recent, 'weight', 'Weight (lbs)') : ''}
        ${renderMetricTrend(recent, 'rpe', 'RPE')}
        ${renderMetricTrend(recent, 'pain', 'Knee Pain')}
    `;
}

function renderMetricTrend(sessions, metric, label) {
    const getValue = (l) => metric === 'weight' ? l.weightUsed : metric === 'hold' ? l.holdTimeSeconds : metric === 'pain' ? (l.pain || 0) : l.rpe;
    const values = sessions.map(getValue);
    const max = Math.max(...values, 1);
    const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
    
    return `
        <div style="margin-top: 20px;">
            <div style="font-weight: 700; margin-bottom: 8px;">${label}</div>
            <div style="text-align: center; font-size: 13px; margin-bottom: 8px;">Avg: <strong style="color: var(--primary)">${avg}</strong></div>
            <div class="chart-row" style="height: 120px;">
                ${sessions.map((l, i) => {
                    const val = getValue(l);
                    const height = (val / max) * 100;
                    const improved = i > 0 && val > getValue(sessions[i-1]);
                    const color = (metric === 'rpe' || metric === 'pain') ? (val >= 8 ? 'var(--red)' : val >= 6 ? 'var(--yellow)' : 'var(--green)') : improved ? 'var(--green)' : 'var(--primary)';
                    
                    return `
                        <div class="chart-bar" style="height: ${height}%; background: ${color};">
                            <span class="chart-value">${val}</span>
                            <span class="chart-label">${new Date(l.date).getDate()}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
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
    }).join('')}</div><div style="text-align: center; margin-top: 16px; font-size: 13px;">&#128994; None | &#128993; Mild | &#128992; Mod | &#128308; Severe</div>`;
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
    const exerciseLogs = DataManager.getExerciseLogs().filter(e => (new Date() - new Date(e.date)) / (1000*60*60*24) <= days);
    const customWorkouts = DataManager.getCustomWorkouts().filter(w => (new Date() - new Date(w.date)) / (1000*60*60*24) <= days);
    
    const list = document.getElementById('history-list');
    if (checkIns.length === 0 && exerciseLogs.length === 0 && customWorkouts.length === 0) { 
        list.innerHTML = '<div class="card"><p style="text-align: center; padding: 40px;">No data</p></div>'; 
        return; 
    }
    
    // Create a combined map of date -> checkin/workouts
    const dates = [...new Set([
        ...checkIns.map(c => c.date),
        ...exerciseLogs.map(e => e.date),
        ...customWorkouts.map(w => w.date)
    ])].sort().reverse();

    list.innerHTML = dates.map(date => {
        const checkIn = checkIns.find(c => c.date === date);
        const dayEx = exerciseLogs.filter(e => e.date === date);
        const dayCu = customWorkouts.filter(w => w.date === date);
        
        let html = `<div class="history-item" style="background: white; padding: 18px; border-radius: 12px; margin-bottom: 12px;">
            <div style="font-weight: 800; font-size: 16px; margin-bottom: 10px;">${new Date(date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}</div>`;
        
        if (checkIn) {
            const status = DataManager.getKneeStatusForCheckIn(checkIn);
            const statusColors = { GREEN: '#4CAF50', YELLOW: '#FFC107', RED: '#F44336' };
            html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--gray-100);">
                <span style="font-size: 14px; font-weight: 600;">Status: <span style="color: ${statusColors[status]}">${status}</span></span>
                <span style="font-size: 12px; color: var(--gray-600);">${checkIn.swelling} | Pain ${checkIn.pain}/10</span>
            </div>`;
        }

        if (dayEx.length > 0 || dayCu.length > 0) {
            const lane = (dayEx[0] || dayCu[0])?.lane;
            const laneColors = { CALM: '#4CAF50', BUILD: '#FF9800', PRIME: '#F44336' };
            if (lane) {
                html += `<div style="margin-top: 8px; font-size: 13px; font-weight: 700; color: ${laneColors[lane] || 'var(--primary)'}">
                    Lane: ${lane}
                </div>`;
            }
            
            html += `<div style="margin-top: 8px; font-size: 13px; color: var(--gray-600);">
                ${dayEx.map(e => `<div>• ${e.exerciseName.split('(')[0].trim()} (${e.setsCompleted}x${e.repsPerSet})</div>`).join('')}
                ${dayCu.map(w => `<div>• ${w.workoutType} (${w.durationMinutes}m)</div>`).join('')}
            </div>`;
        }
        
        html += '</div>';
        return html;
    }).join('');
}

// "Exports" for the concatenated bundle model (optional, but useful for debugging / inline handlers)
window.populateAnalyticsExerciseSelect = populateAnalyticsExerciseSelect;
window.renderIndividualExerciseAnalytics = renderIndividualExerciseAnalytics;
