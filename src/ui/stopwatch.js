// Stopwatch Module
const Stopwatch = {
    seconds: 0,
    isRunning: false,
    interval: null,
    audioContext: null,
    milestones: [30, 45, 60, 90, 120],
    hitMilestones: [],
    
    init() {
        const startBtn = document.getElementById('stopwatch-start');
        const stopBtn = document.getElementById('stopwatch-stop');
        const resetBtn = document.getElementById('stopwatch-reset');
        
        if (startBtn) startBtn.onclick = () => this.start();
        if (stopBtn) stopBtn.onclick = () => this.stop();
        if (resetBtn) resetBtn.onclick = () => {
            if (this.seconds > 0 && confirm('Reset timer?')) this.reset();
            else if (this.seconds > 0) this.reset();
        };
    },
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.hitMilestones = [];
        
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        document.getElementById('stopwatch-start').disabled = true;
        document.getElementById('stopwatch-stop').disabled = false;
        document.getElementById('milestone-badges').style.display = 'flex';
        
        this.interval = setInterval(() => this.tick(), 1000);
    },
    
    tick() {
        this.seconds++;
        this.updateDisplay();
        this.checkMilestones();
    },
    
    stop() {
        if (!this.isRunning) return;
        
        clearInterval(this.interval);
        this.isRunning = false;
        
        document.getElementById('stopwatch-start').disabled = false;
        document.getElementById('stopwatch-stop').disabled = true;
        
        if (this.seconds >= 30) this.playSuccessSound();

        // Auto-sync with exercise log if open
        const holdTimeInput = document.getElementById('hold-time');
        const exerciseForm = document.getElementById('exercise-log-form');
        
        if (holdTimeInput && exerciseForm && exerciseForm.style.display !== 'none' && this.seconds > 0) {
            holdTimeInput.value = this.seconds;
            holdTimeInput.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
            holdTimeInput.style.transition = 'background-color 0.5s';
            setTimeout(() => { holdTimeInput.style.backgroundColor = ''; }, 1000);
        }
    },
    
    reset() {
        clearInterval(this.interval);
        this.isRunning = false;
        this.seconds = 0;
        this.hitMilestones = [];
        
        this.updateDisplay();
        
        document.getElementById('stopwatch-start').disabled = false;
        document.getElementById('stopwatch-stop').disabled = true;
        document.getElementById('milestone-badges').style.display = 'none';
        document.getElementById('milestone-badges').innerHTML = '';
    },
    
    updateDisplay() {
        const mins = Math.floor(this.seconds / 60);
        const secs = this.seconds % 60;
        document.getElementById('stopwatch-display').textContent = 
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    checkMilestones() {
        this.milestones.forEach(milestone => {
            if (this.seconds === milestone && !this.hitMilestones.includes(milestone)) {
                this.hitMilestones.push(milestone);
                this.celebrateMilestone(milestone);
            }
        });
    },
    
    celebrateMilestone(milestone) {
        this.playMilestoneSound(milestone);
        
        const badgesContainer = document.getElementById('milestone-badges');
        const badge = document.createElement('div');
        badge.className = 'milestone-badge milestone-new';
        badge.innerHTML = `<span class="milestone-icon">🎯</span><span class="milestone-text">${milestone}s!</span>`;
        badgesContainer.appendChild(badge);
        
        setTimeout(() => badge.classList.remove('milestone-new'), 500);
        
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    },
    
    playMilestoneSound(milestone) {
        if (!this.audioContext) return;
        
        const frequencies = { 30: 523, 45: 659, 60: 784, 90: 880, 120: 1047 };
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequencies[milestone] || 659;
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    },
    
    playSuccessSound() {
        if (!this.audioContext) return;
        
        [523, 659, 784].forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.3);
            }, i * 100);
        });
    }
};
