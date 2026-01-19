// Stopwatch Module
const Stopwatch = {
    seconds: 0,
    isRunning: false,
    interval: null,
    audioContext: null,
    milestones: [30, 45, 60, 90, 120],
    hitMilestones: [],
    
    init() {
        const actionBtn = document.getElementById('stopwatch-action');
        const resetBtn = document.getElementById('reset-stopwatch');
        
        if (actionBtn) {
            const toggleHandler = () => {
                if (this.isRunning) this.stop();
                else this.start();
            };
            actionBtn.ontouchstart = toggleHandler;
            actionBtn.onclick = toggleHandler;
        }
        
        if (resetBtn) {
            const resetHandler = () => {
                if (confirm('Reset?')) this.reset();
            };
            resetBtn.ontouchstart = resetHandler;
            resetBtn.onclick = resetHandler;
        }
    },
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.hitMilestones = [];
        
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const actionBtn = document.getElementById('stopwatch-action');
        actionBtn.textContent = 'Stop';
        actionBtn.style.background = '#F44336';
        
        document.getElementById('reset-stopwatch').style.display = 'inline-block';
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
        
        const actionBtn = document.getElementById('stopwatch-action');
        actionBtn.textContent = 'Start';
        actionBtn.style.background = '';
        
        if (this.seconds >= 30) this.playSuccessSound();
    },
    
    reset() {
        clearInterval(this.interval);
        this.isRunning = false;
        this.seconds = 0;
        this.hitMilestones = [];
        
        this.updateDisplay();
        
        const actionBtn = document.getElementById('stopwatch-action');
        actionBtn.textContent = 'Start';
        actionBtn.style.background = '';
        
        document.getElementById('reset-stopwatch').style.display = 'none';
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
