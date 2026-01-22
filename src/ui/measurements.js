// Measurements Module

function setupMeasurementHandlers() {
    document.querySelectorAll('.posture-btn').forEach(btn => {
        const h = function() {
            document.querySelectorAll('.posture-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            AppState.posture = this.dataset.posture;
        };
        btn.ontouchstart = h;
        btn.onclick = h;
    });
    
    const saveBtn = document.getElementById('save-measurement');
    if (saveBtn) { saveBtn.ontouchstart = saveMeasurement; saveBtn.onclick = saveMeasurement; }
}

function openMeasurementModal() {
    document.getElementById('measurement-modal').style.display = 'flex';
    const latest = DataManager.getLatestBodyMeasurement();
    if (latest?.measurements) {
        const m = latest.measurements;
        if (m.knee_top_cm) {
            document.getElementById('knee-right').value = m.knee_top_cm.right || '';
            document.getElementById('knee-left').value = m.knee_top_cm.left || '';
        }
        if (m.thigh_cm) {
            document.getElementById('thigh-right').value = m.thigh_cm.right || '';
            document.getElementById('thigh-left').value = m.thigh_cm.left || '';
        }
        document.getElementById('height').value = m.height_cm || '';
        document.getElementById('waist').value = m.waist_cm || '';
        document.getElementById('weight').value = m.weight_lb || '';
    }
}

function closeMeasurementModal() {
    document.getElementById('measurement-modal').style.display = 'none';
}

function saveMeasurement() {
    const kneeRight = parseFloat(document.getElementById('knee-right').value);
    const kneeLeft = parseFloat(document.getElementById('knee-left').value);
    const thighRight = parseFloat(document.getElementById('thigh-right').value);
    const thighLeft = parseFloat(document.getElementById('thigh-left').value);
    const height = parseFloat(document.getElementById('height').value);
    
    if (!kneeRight || !kneeLeft) { alert('! Enter both knees'); return; }
    
    const data = { 
        measurements: { 
            knee_top_cm: { right: kneeRight, left: kneeLeft, method: '2cm above patella' },
            thigh_cm: { right: thighRight || 0, left: thighLeft || 0, method: 'mid-thigh' },
            height_cm: height || 0
        }, 
        posture: AppState.posture, 
        notes: document.getElementById('measurement-notes').value, 
        type: 'measurement' 
    };
    
    const waist = parseFloat(document.getElementById('waist').value);
    if (waist) data.measurements.waist_cm = waist;
    const weight = parseFloat(document.getElementById('weight').value);
    if (weight) data.measurements.weight_lb = weight;
    
    if (DataManager.saveBodyMeasurement(data)) {
        alert('Saved!');
        closeMeasurementModal();
        updateMeasurementDisplay();
        renderMeasurementSummary();
    }
}

function updateMeasurementDisplay() {
    const latest = DataManager.getLatestBodyMeasurement();
    const el = document.getElementById('last-measurement-date');
    if (!el) return;
    if (latest) el.textContent = `Last: ${new Date(latest.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}`;
    else el.textContent = 'Tap to add';
}

function renderMeasurementSummary() {
    const container = document.getElementById('measurement-summary');
    if (!container) return;
    const latest = DataManager.getLatestBodyMeasurement();
    if (!latest) { container.innerHTML = '<p style="text-align: center; padding: 20px;">No data</p>'; return; }
    
    const m = latest.measurements;
    const derived = DataManager.getDerivedMetrics();
    let html = '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">';
    
    if (derived.bmi) {
        const status = derived.bmi < 25 ? 'Normal' : 'Over';
        const color = derived.bmi < 25 ? '#4CAF50' : '#FFC107';
        html += `<div class="metric-card"><div class="metric-label">BMI</div><div class="metric-value">${derived.bmi}</div><div class="metric-status" style="color: ${color};">${status}</div></div>`;
    }
    if (derived.kneeDifference) {
        const diff = parseFloat(derived.kneeDifference);
        const color = Math.abs(diff) < 0.5 ? '#4CAF50' : '#FFC107';
        html += `<div class="metric-card"><div class="metric-label">R-L Diff</div><div class="metric-value">${derived.kneeDifference}cm</div><div class="metric-status" style="color: ${color};">${diff > 0 ? 'R larger' : 'Equal'}</div></div>`;
    }
    html += '</div>';
    if (m.knee_top_cm) html += `<div class="measurement-row"><span>Knee</span><span>R ${m.knee_top_cm.right} | L ${m.knee_top_cm.left} cm</span></div>`;
    if (m.thigh_cm) html += `<div class="measurement-row"><span>Thigh</span><span>R ${m.thigh_cm.right} | L ${m.thigh_cm.left} cm</span></div>`;
    if (m.height_cm) html += `<div class="measurement-row"><span>Height</span><span>${m.height_cm} cm</span></div>`;
    if (m.weight_lb) html += `<div class="measurement-row"><span>Weight</span><span>${m.weight_lb} lbs</span></div>`;
    container.innerHTML = html;
}
