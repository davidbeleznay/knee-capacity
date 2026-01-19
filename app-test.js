// KneeCapacity - MINIMAL WORKING VERSION

let selectedSwelling = null;
let selectedActivityLevel = 'light';
let selectedTimeOfDay = 'morning';
let currentKneeStatus = 'unknown';

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting...');
    DataManager.init();
    setupSimpleHandlers();
    updateKneeStatusCard();
    loadTodayCheckIn();
    console.log('✅ Ready');
});

function setupSimpleHandlers() {
    // Swelling - ONCLICK
    document.querySelectorAll('.swelling-btn').forEach(btn => {
        btn.onclick = function() {
            console.log('✓ Swelling:', this.dataset.level);
            document.querySelectorAll('.swelling-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedSwelling = this.dataset.level;
        };
    });
    
    // Activity level
    document.querySelectorAll('.activity-level-btn').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.activity-level-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedActivityLevel = this.dataset.level;
        };
    });
    
    // Time
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedTimeOfDay = this.dataset.time;
        };
    });
    
    // Toggle
    const ex = document.getElementById('toggle-exercises');
    const cu = document.getElementById('toggle-custom');
    
    if (ex) ex.onclick = () => {
        console.log('→ Exercises');
        ex.classList.add('active');
        cu.classList.remove('active');
        document.getElementById('exercise-tiles').style.display = 'grid';
        document.getElementById('custom-workout-tiles').style.display = 'none';
    };
    
    if (cu) cu.onclick = () => {
        console.log('→ Custom');
        cu.classList.add('active');
        ex.classList.remove('active');
        document.getElementById('exercise-tiles').style.display = 'none';
        document.getElementById('custom-workout-tiles').style.display = 'grid';
    };
    
    // Sliders
    document.getElementById('pain-slider').oninput = (e) => {
        document.getElementById('pain-value').textContent = e.target.value;
    };
    
    // Save
    document.getElementById('save-checkin').onclick = saveCheckIn;
    
    // Nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = function() { switchView(this.dataset.view); };
    });
}

function saveCheckIn() {
    if (!selectedSwelling) {
        alert('⚠️ Select swelling');
        return;
    }
    
    console.log('💾 Saving...');
    
    DataManager.saveCheckIn({ 
        swelling: selectedSwelling, 
        pain: parseInt(document.getElementById('pain-slider').value), 
        activityLevel: selectedActivityLevel,
        timeOfDay: selectedTimeOfDay,
        notes: document.getElementById('checkin-notes').value
    });
    
    updateKneeStatusCard();
    alert('✅ Saved!');
}

function loadTodayCheckIn() {
    const checkIn = DataManager.getCheckIn(new Date().toISOString().split('T')[0]);
    if (checkIn) {
        if (checkIn.swelling) {
            const btn = document.querySelector(`.swelling-btn[data-level="${checkIn.swelling}"]`);
            if (btn) {
                btn.classList.add('active');
                selectedSwelling = checkIn.swelling;
            }
        }
    }
}

function updateKneeStatusCard() {
    const statusInfo = DataManager.getKneeStatusMessage();
    const status = DataManager.getKneeStatus();
    currentKneeStatus = status;
    
    const card = document.getElementById('knee-status-card');
    card.className = `status-card status-${status} text-center`;
    card.innerHTML = `
        <div class="status-icon">${statusInfo.icon}</div>
        <h2>${statusInfo.title}</h2>
        <p>${statusInfo.message}</p>
        <div style="background: rgba(0,0,0,0.05); padding: 12px; border-radius: 10px; margin-top: 12px;">
            ${statusInfo.action}
        </div>
    `;
}

function switchView(viewName) {
    console.log('→', viewName);
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`${viewName}-view`).classList.add('active');
    document.querySelector(`.nav-btn[data-view="${viewName}"]`).classList.add('active');
}

window.openMeasurementModal = () => { document.getElementById('measurement-modal').style.display = 'flex'; };
window.closeMeasurementModal = () => { document.getElementById('measurement-modal').style.display = 'none'; };
window.App = {};
