// KneeCapacity - Data Management with Custom Workouts

const DataManager = {
    
    init() {
        if (!localStorage.getItem('sessions')) localStorage.setItem('sessions', JSON.stringify([]));
        if (!localStorage.getItem('checkIns')) localStorage.setItem('checkIns', JSON.stringify([]));
        if (!localStorage.getItem('exerciseLogs')) localStorage.setItem('exerciseLogs', JSON.stringify([]));
        if (!localStorage.getItem('customWorkouts')) localStorage.setItem('customWorkouts', JSON.stringify([]));
        if (!localStorage.getItem('streak')) localStorage.setItem('streak', '0');
    },
    
    // Sessions
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
    
    // Exercise Logs
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
    
    getExerciseHistory(exerciseId, days = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        
        return this.getExerciseLogs()
            .filter(log => log.exerciseId === exerciseId && new Date(log.date) >= cutoff)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    
    // Custom Workouts
    saveCustomWorkout(workoutData) {
        const workouts = this.getCustomWorkouts();
        workouts.push({
            ...workoutData,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        });
        localStorage.setItem('customWorkouts', JSON.stringify(workouts));
    },
    
    getCustomWorkouts() {
        return JSON.parse(localStorage.getItem('customWorkouts') || '[]');
    },
    
    getCustomWorkoutsByDate(date) {
        return this.getCustomWorkouts().filter(w => w.date === date);
    },
    
    getTodaysCustomWorkouts() {
        const today = new Date().toISOString().split('T')[0];
        return this.getCustomWorkoutsByDate(today);
    },
    
    getCustomWorkoutHistory(category, limit = 10) {
        return this.getCustomWorkouts()
            .filter(w => w.workoutCategory === category)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    },
    
    // Check-ins
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
    
    // Traffic light status
    getKneeStatus() {
        const today = new Date().toISOString().split('T')[0];
        const checkIn = this.getCheckIn(today);
        
        if (!checkIn) return 'unknown';
        
        const { swelling, pain } = checkIn;
        
        if (swelling === 'severe' || (swelling === 'moderate' && pain >= 6)) return 'red';
        if (swelling === 'moderate' || pain >= 4 || (swelling === 'mild' && pain >= 3)) return 'yellow';
        if (swelling === 'none' || (swelling === 'mild' && pain <= 2)) return 'green';
        
        return 'yellow';
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
                message: 'Modify intensity. Lighter loads.',
                action: 'Build mode (light) or Calm exercises only'
            },
            red: {
                icon: '🛑',
                title: 'RED - Stop and Recover',
                message: 'Knee needs rest. Focus on recovery.',
                action: 'Calm mode only: gentle ROM, isometrics, ice'
            },
            unknown: {
                icon: '❓',
                title: 'Complete Check-In First',
                message: 'Log swelling and pain to see status',
                action: 'Go to Home tab and complete Daily Check-In'
            }
        };
        return messages[status];
    },
    
    getKneeStatusForCheckIn(checkIn) {
        const { swelling, pain } = checkIn;
        if (swelling === 'severe' || (swelling === 'moderate' && pain >= 6)) return 'RED';
        if (swelling === 'moderate' || pain >= 4) return 'YELLOW';
        if (swelling === 'none' || (swelling === 'mild' && pain <= 2)) return 'GREEN';
        return 'YELLOW';
    },
    
    // Export
    exportData() {
        const checkIns = this.getCheckIns();
        const sessions = this.getSessions();
        const exerciseLogs = this.getExerciseLogs();
        const customWorkouts = this.getCustomWorkouts();
        
        const recentCheckIns = this.getRecentCheckIns(30);
        const avgPain = recentCheckIns.length > 0 ? 
            (recentCheckIns.reduce((sum, c) => sum + (c.pain || 0), 0) / recentCheckIns.length).toFixed(1) : 0;
        const swellingDays = recentCheckIns.filter(c => c.swelling !== 'none').length;
        
        const data = {
            exportDate: new Date().toISOString(),
            patientInfo: {
                note: "44-year-old with severe lateral compartment OA + degenerative meniscus",
                goal: "Avoid surgery, continue volleyball, using Keith Barr protocols"
            },
            summary: {
                totalSessions: sessions.length,
                totalExercises: exerciseLogs.length,
                totalCustomWorkouts: customWorkouts.length,
                currentStreak: this.getCurrentStreak(),
                longestStreak: parseInt(localStorage.getItem('longestStreak') || '0'),
                last30Days: {
                    averagePain: avgPain,
                    daysWithSwelling: swellingDays,
                    workoutDays: sessions.filter(s => {
                        const d = new Date(s.timestamp);
                        return (new Date() - d) / (1000*60*60*24) <= 30;
                    }).length
                }
            },
            dailyCheckIns: checkIns,
            trainingSessions: sessions,
            exerciseDetails: exerciseLogs,
            customWorkouts: customWorkouts,
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
        a.download = `knee-capacity-specialist-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
};
