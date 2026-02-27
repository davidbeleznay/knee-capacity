// Calibration UI Module

let calibrationState = {
    baseline: { swelling: null, pain: null, context: '' },
    redline: { swelling: null, pain: null, context: '' },
    target: { swelling: null, pain: null }
};

function setupCalibrationHandlers() {
    // Pain buttons
    document.querySelectorAll('.calibration-pain-num').forEach(btn => {
        btn.onclick = function() {
            const parent = this.parentElement;
            const stateKey = parent.dataset.state;
            const pain = parseInt(this.dataset.pain);

            // UI update
            parent.querySelectorAll('.calibration-pain-num').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // State update
            if (calibrationState[stateKey]) {
                calibrationState[stateKey].pain = pain;
            }
            
            // Enable next button check
            checkCalibrationStep(stateKey);
        };
    });

    // Swelling buttons (calibration specific)
    document.querySelectorAll('.swelling-btn[data-screen]').forEach(btn => {
        btn.onclick = function() {
            const screen = this.dataset.screen; // baseline, redline, target
            const level = this.dataset.level;
            
            // UI update within this group
            const group = this.parentElement;
            group.querySelectorAll('.swelling-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // State update
            if (calibrationState[screen]) {
                calibrationState[screen].swelling = level;
            }
            
            // Enable next button check
            checkCalibrationStep(screen);
        };
    });

    // Navigation
    const next1 = document.getElementById('calibration-next-1');
    if (next1) next1.onclick = () => showCalibrationScreen(2);

    const next2 = document.getElementById('calibration-next-2');
    if (next2) next2.onclick = () => showCalibrationScreen(3);

    const back2 = document.getElementById('calibration-back-2');
    if (back2) back2.onclick = () => showCalibrationScreen(1);

    const back3 = document.getElementById('calibration-back-3');
    if (back3) back3.onclick = () => showCalibrationScreen(2);

    const skip = document.getElementById('calibration-skip');
    if (skip) skip.onclick = closeCalibrationModal;

    const complete = document.getElementById('calibration-complete');
    if (complete) complete.onclick = saveCalibration;
    
    // Recalibrate button in settings
    const recalibrateBtn = document.getElementById('recalibrate-btn');
    if (recalibrateBtn) {
        recalibrateBtn.onclick = openCalibrationModal;
    }
}

function checkCalibrationStep(step) {
    const s = calibrationState[step];
    let valid = s.swelling && s.pain !== null;
    
    if (step === 'baseline') {
        const btn = document.getElementById('calibration-next-1');
        if (btn) btn.disabled = !valid;
    } else if (step === 'redline') {
        const btn = document.getElementById('calibration-next-2');
        if (btn) btn.disabled = !valid;
    } else if (step === 'target') {
        const btn = document.getElementById('calibration-complete');
        if (btn) btn.disabled = !valid;
    }
}

function showCalibrationScreen(screenNum) {
    document.querySelectorAll('.calibration-screen').forEach(s => s.style.display = 'none');
    const screen = document.getElementById(`calibration-screen-${screenNum}`);
    if (screen) {
        screen.style.display = 'block';
        // Update header progress text if needed, though it's static in HTML
    }
}

function openCalibrationModal() {
    const modal = document.getElementById('calibration-modal');
    if (modal) {
        modal.style.display = 'flex';
        showCalibrationScreen(1);
    }
}

function closeCalibrationModal() {
    const modal = document.getElementById('calibration-modal');
    if (modal) modal.style.display = 'none';
}

function saveCalibration() {
    // Gather context inputs
    const baseCtx = document.getElementById('baseline-context');
    const redCtx = document.getElementById('redline-context');
    
    if (baseCtx) calibrationState.baseline.context = baseCtx.value;
    if (redCtx) calibrationState.redline.context = redCtx.value;

    const profileData = {
        baselineSwelling: calibrationState.baseline.swelling,
        baselinePain: calibrationState.baseline.pain,
        baselineContext: calibrationState.baseline.context,
        redlineSwelling: calibrationState.redline.swelling,
        redlinePain: calibrationState.redline.pain,
        redlineContext: calibrationState.redline.context,
        targetSwelling: calibrationState.target.swelling,
        targetPain: calibrationState.target.pain
    };

    if (DataManager.saveKneeProfile(profileData)) {
        // alert('Calibration saved!'); // Optional: remove alert for smoother flow
        closeCalibrationModal();
        
        // Update settings status if function exists
        if (typeof renderCalibrationStatus === 'function') renderCalibrationStatus();
        
        // If we are on home screen, maybe refresh KCI?
        if (AppState.currentView === 'home' && typeof loadTodayCheckIn === 'function') {
            loadTodayCheckIn();
        }
    } else {
        alert('Error saving profile');
    }
}

// Expose for cross-file calls
if (typeof window !== 'undefined') {
    window.setupCalibrationHandlers = setupCalibrationHandlers;
    window.openCalibrationModal = openCalibrationModal;
}
