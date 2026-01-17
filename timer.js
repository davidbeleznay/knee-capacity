// KneeCapacity - Session Timer with Audio Cues

const Timer = {
    duration: 600,
    remaining: 600,
    isRunning: false,
    interval: null,
    audioContext: null,
    
    start(durationSeconds) {
        if (this.isRunning) return;
        
        this.duration = durationSeconds;
        this.remaining = durationSeconds;
        this.isRunning = true;
        
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const actionBtn = document.getElementById('timer-action');
        actionBtn.textContent = 'Stop Session';
        actionBtn.style.background = '#D32F2F';
        
        this.playAudioCue('start');
        this.interval = setInterval(() => this.tick(), 1000);
    },
    
    tick() {
        this.remaining--;
        
        const mins = Math.floor(this.remaining / 60);
        const secs = this.remaining % 60;
        document.getElementById('timer-minutes').textContent = mins;
        document.getElementById('timer-seconds').textContent = secs.toString().padStart(2, '0');
        
        const progress = ((this.duration - this.remaining) / this.duration) * 100;
        document.getElementById('timer-progress-fill').style.width = `${progress}%`;
        
        if (this.remaining === Math.floor(this.duration / 2)) {
            this.playAudioCue('halfway');
        }
        
        if (this.remaining === 0) {
            this.complete();
        }
    },
    
    stop() {
        clearInterval(this.interval);
        this.isRunning = false;
        this.remaining = this.duration;
        
        const actionBtn = document.getElementById('timer-action');
        actionBtn.textContent = 'Start Session';
        actionBtn.style.background = '';
        
        if (window.App) {
            App.updateTimerDisplay(this.duration);
        }
        document.getElementById('timer-progress-fill').style.width = '0%';
    },
    
    complete() {
        clearInterval(this.interval);
        this.isRunning = false;
        
        this.playAudioCue('complete');
        
        DataManager.saveSession({ duration: this.duration });
        
        alert('🎉 Session Complete!\\n\\nYour connective tissue thanks you.\\nRest for 6-8 hours before next session.');
        
        if (window.App) {
            App.updateRestStatus();
            App.updateStreakDisplay();
        }
        
        this.remaining = this.duration;
        const actionBtn = document.getElementById('timer-action');
        actionBtn.textContent = 'Start Session';
        actionBtn.style.background = '';
        if (window.App) App.updateTimerDisplay(this.duration);
        document.getElementById('timer-progress-fill').style.width = '0%';
    },
    
    playAudioCue(type) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        if (type === 'start') {
            oscillator.frequency.value = 440;
            gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.15);
        } else if (type === 'halfway') {
            oscillator.frequency.value = 523;
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
        } else if (type === 'complete') {
            oscillator.frequency.value = 659;
            gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.25);
            
            setTimeout(() => {
                const osc2 = this.audioContext.createOscillator();
                const gain2 = this.audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(this.audioContext.destination);
                osc2.frequency.value = 784;
                gain2.gain.setValueAtTime(0.25, this.audioContext.currentTime);
                osc2.start(this.audioContext.currentTime);
                osc2.stop(this.audioContext.currentTime + 0.3);
            }, 150);
        }
    }
};
