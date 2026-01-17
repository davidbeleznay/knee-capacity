// KneeCapacity - Enhanced Data Management with Exercise Tracking

const DataManager = {
    
    init() {
        if (!localStorage.getItem('sessions')) localStorage.setItem('sessions', JSON.stringify([]));
        if (!localStorage.getItem('checkIns')) localStorage.setItem('checkIns', JSON.stringify([]));
        if (!localStorage.getItem('exerciseLogs')) localStorage.setItem('exerciseLogs', JSON.stringify([]));
        if (!localStorage.getItem('streak')) localStorage.setItem('streak', '0');
    },
    
    // Sessions (overall training sessions)
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
    
    // Exercise Logs (individual exercise tracking with sets/reps/time)
    saveExerciseLog(exerciseData) {
        const logs = this.getExerciseLogs();
        logs.push({
            ...exerciseData,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        });
        localStorage.setItem('exerciseLogs', JSON.stringify(logs));
    },
    
    getExerciseLogs() {
        return JSON.parse(localStorage.getItem('exerciseLogs') || '[]');
    },
    
    getExerciseLogsByDate(date) {
        return this.getExerciseLogs().filter(log => log.date === date);
    },
    
    getTodaysExerciseLogs() {
        const today = new Date().toISOString().split('T')[0];
        return this.getExerciseLogsByDate(today);
    },
    
    // Get exercise history for a specific exercise
    getExerciseHistory(exerciseId, days = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        
        return this.getExerciseLogs()
            .filter(log => log.exerciseId === exerciseId && new Date(log.date) >= cutoff)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    
    // Check-ins (daily status)
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
    
    // Rest period enforcement
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
    
    // Streak calculation
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
    
    // Traffic light status (Green/Yellow/Red)
    getKneeStatus() {
        const today = new Date().toISOString().split('T')[0];
        const checkIn = this.getCheckIn(today);
        
        if (!checkIn) return 'unknown';
        
        const { swelling, pain } = checkIn;
        
        // Red: Significant swelling or high pain
        if (swelling === 'severe' || (swelling === 'moderate' && pain >= 6)) {
            return 'red';
        }
        
        // Yellow: Mild-moderate issues
        if (swelling === 'moderate' || pain >= 4 || swelling === 'mild' && pain >= 3) {
            return 'yellow';
        }
        
        // Green: Minimal or no issues
        if (swelling === 'none' || (swelling === 'mild' && pain <= 2)) {
            return 'green';
        }
        
        return 'yellow'; // Default to caution
    },
    
    getKneeStatusMessage() {
        const status = this.getKneeStatus();
        const messages = {
            green: {
                icon: '✅',
                title: 'GREEN - Go for It',
                message: 'Full training approved. Knee is quiet.',
                action: 'Proceed with Build or Prime mode exercises'
            },
            yellow: {
                icon: '⚠️',
                title: 'YELLOW - Proceed with Caution',
                message: 'Modify intensity. Lighter loads, controlled movements.',
                action: 'Build mode (light) or recovery exercises only'
            },
            red: {
                icon: '🛑',
                title: 'RED - Stop and Recover',
                message: 'Knee needs rest. Focus on recovery.',
                action: 'Calm mode only: gentle ROM, isometrics, ice, rest'
            },
            unknown: {
                icon: '❓',
                title: 'Complete Check-In First',
                message: 'Log today\'s swelling and pain to determine status',
                action: 'Go to Home tab and complete Daily Check-In'
            }
        };
        
        return messages[status];
    },
    
    // Export comprehensive data for specialists
    exportData() {
        const checkIns = this.getCheckIns();
        const sessions = this.getSessions();
        const exerciseLogs = this.getExerciseLogs();
        
        // Calculate summary stats
        const recentCheckIns = this.getRecentCheckIns(30);
        const avgPain = recentCheckIns.reduce((sum, c) => sum + (c.pain || 0), 0) / recentCheckIns.length;
        const swellingDays = recentCheckIns.filter(c => c.swelling !== 'none').length;
        
        const data = {
            exportDate: new Date().toISOString(),
            patientInfo: {
                note: "44-year-old with severe lateral compartment OA + degenerative meniscus",
                goal: "Avoid surgery, continue volleyball, using Keith Barr protocols"
            },
            summary: {
                totalSessions: sessions.length,
                totalExercisesLogged: exerciseLogs.length,
                currentStreak: this.getCurrentStreak(),
                longestStreak: parseInt(localStorage.getItem('longestStreak') || '0'),
                last30Days: {
                    averagePain: avgPain.toFixed(1),
                    daysWithSwelling: swellingDays,
                    totalSessions: sessions.filter(s => {
                        const d = new Date(s.timestamp);
                        return (new Date() - d) / (1000*60*60*24) <= 30;
                    }).length
                }
            },
            dailyCheckIns: checkIns,
            trainingSessions: sessions,
            exerciseDetails: exerciseLogs,
            kneeStatusLog: checkIns.map(c => ({
                date: c.date,
                status: this.getKneeStatusForCheckIn(c),
                swelling: c.swelling,
                pain: c.pain
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `knee-capacity-specialist-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    getKneeStatusForCheckIn(checkIn) {
        const { swelling, pain } = checkIn;
        if (swelling === 'severe' || (swelling === 'moderate' && pain >= 6)) return 'RED';
        if (swelling === 'moderate' || pain >= 4) return 'YELLOW';
        if (swelling === 'none' || (swelling === 'mild' && pain <= 2)) return 'GREEN';
        return 'YELLOW';
    }
};
