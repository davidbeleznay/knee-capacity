// KneeCapacity - Data Management

const DataManager = {
    
    init() {
        if (!localStorage.getItem('sessions')) localStorage.setItem('sessions', JSON.stringify([]));
        if (!localStorage.getItem('checkIns')) localStorage.setItem('checkIns', JSON.stringify([]));
        if (!localStorage.getItem('streak')) localStorage.setItem('streak', '0');
    },
    
    saveSession(sessionData) {
        const sessions = this.getSessions();
        sessions.push({
            ...sessionData,
            id: Date.now().toString(),
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('sessions', JSON.stringify(sessions));
        this.updateStreak();
    },
    
    getSessions() {
        return JSON.parse(localStorage.getItem('sessions') || '[]');
    },
    
    saveCheckIn(checkInData) {
        const checkIns = this.getCheckIns();
        const today = new Date().toISOString().split('T')[0];
        const existingIndex = checkIns.findIndex(c => c.date === today);
        
        if (existingIndex >= 0) {
            checkIns[existingIndex] = { ...checkInData, date: today };
        } else {
            checkIns.push({ ...checkInData, date: today });
        }
        localStorage.setItem('checkIns', JSON.stringify(checkIns));
    },
    
    getCheckIns() {
        return JSON.parse(localStorage.getItem('checkIns') || '[]');
    },
    
    getCheckIn(date) {
        return this.getCheckIns().find(c => c.date === date);
    },
    
    getRecentCheckIns(days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return this.getCheckIns()
            .filter(c => new Date(c.date) >= cutoff)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    
    canTrain() {
        const sessions = this.getSessions();
        if (sessions.length === 0) return true;
        const lastSession = sessions[sessions.length - 1];
        const hoursSince = (new Date() - new Date(lastSession.timestamp)) / (1000 * 60 * 60);
        return hoursSince >= 6;
    },
    
    hoursUntilReady() {
        const sessions = this.getSessions();
        if (sessions.length === 0) return 0;
        const lastSession = sessions[sessions.length - 1];
        const hoursSince = (new Date() - new Date(lastSession.timestamp)) / (1000 * 60 * 60);
        return Math.max(0, 6 - hoursSince);
    },
    
    updateStreak() {
        const sessions = this.getSessions();
        if (sessions.length === 0) {
            localStorage.setItem('streak', '0');
            return 0;
        }
        
        let streak = 1;
        const dates = sessions.map(s => s.timestamp.split('T')[0]);
        const uniqueDates = [...new Set(dates)].sort().reverse();
        
        for (let i = 1; i < uniqueDates.length; i++) {
            const daysDiff = (new Date(uniqueDates[i-1]) - new Date(uniqueDates[i])) / (1000 * 60 * 60 * 24);
            if (daysDiff <= 1.5) {
                streak++;
            } else {
                break;
            }
        }
        
        const longest = parseInt(localStorage.getItem('longestStreak') || '0');
        if (streak > longest) localStorage.setItem('longestStreak', streak.toString());
        
        localStorage.setItem('streak', streak.toString());
        return streak;
    },
    
    getCurrentStreak() {
        return parseInt(localStorage.getItem('streak') || '0');
    },
    
    exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            sessions: this.getSessions(),
            checkIns: this.getCheckIns(),
            summary: {
                totalSessions: this.getSessions().length,
                currentStreak: this.getCurrentStreak(),
                longestStreak: parseInt(localStorage.getItem('longestStreak') || '0')
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `knee-capacity-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
};
