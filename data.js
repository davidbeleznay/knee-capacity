// KneeCapacity - Enhanced Data Management with Body Measurements

const DataManager = {
    
    init() {
        try {
            // Verify localStorage is available
            if (!this.isLocalStorageAvailable()) {
                console.error('LocalStorage not available!');
                alert('! Storage not available. Data may not persist.');
                return;
            }
            
            // Initialize all data stores
            if (!localStorage.getItem('sessions')) localStorage.setItem('sessions', JSON.stringify([]));
            if (!localStorage.getItem('checkIns')) localStorage.setItem('checkIns', JSON.stringify([]));
            if (!localStorage.getItem('exerciseLogs')) localStorage.setItem('exerciseLogs', JSON.stringify([]));
            if (!localStorage.getItem('customWorkouts')) localStorage.setItem('customWorkouts', JSON.stringify([]));
            if (!localStorage.getItem('bodyMeasurements')) localStorage.setItem('bodyMeasurements', JSON.stringify([]));
            if (!localStorage.getItem('streak')) localStorage.setItem('streak', '0');
            if (!localStorage.getItem('longestStreak')) localStorage.setItem('longestStreak', '0');
            
            // Add baseline measurement if none exist
            this.initializeBaselineMeasurement();
            
            console.log('✅ DataManager initialized successfully');
            this.logStorageStatus();
        } catch (e) {
            console.error('Init error:', e);
            alert('Storage error: ' + e.message);
        }
    },
    
    isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    logStorageStatus() {
        console.log('📊 Storage Status:');
        console.log('Check-ins:', this.getCheckIns().length);
        console.log('Exercise logs:', this.getExerciseLogs().length);
        console.log('Custom workouts:', this.getCustomWorkouts().length);
        console.log('Body measurements:', this.getBodyMeasurements().length);
    },
    
    // Body Measurements
    initializeBaselineMeasurement() {
        const measurements = this.getBodyMeasurements();
        if (measurements.length === 0) {
            const baseline = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0],
                measurements: {
                    knee_top_cm: { right: 38.5, left: 37.5, method: '2cm above patella' },
                    thigh_cm: { right: 50, left: 49, method: 'mid-thigh' },
                    calf_cm: { right: 38, left: 38, method: 'widest point' },
                    waist_cm: 92,
                    weight_lb: 192,
                    height_cm: 189
                },
                posture: 'relaxed/unflexed',
                notes: 'Baseline - measured at top of knee where effusion shows',
                type: 'weekly'
            };
            
            const measurements_array = [baseline];
            localStorage.setItem('bodyMeasurements', JSON.stringify(measurements_array));
            console.log('✅ Baseline measurement created');
        }
    },
    
    saveBodyMeasurement(data) {
        try {
            const measurements = this.getBodyMeasurements();
            measurements.push({
                ...data,
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0]
            });
            localStorage.setItem('bodyMeasurements', JSON.stringify(measurements));
            console.log('✅ Body measurement saved');
            return true;
        } catch (e) {
            console.error('Save measurement error:', e);
            return false;
        }
    },
    
    getBodyMeasurements() {
        try {
            return JSON.parse(localStorage.getItem('bodyMeasurements') || '[]');
        } catch (e) {
            console.error('Get measurements error:', e);
            return [];
        }
    },
    
    getLatestBodyMeasurement() {
        const measurements = this.getBodyMeasurements();
        return measurements.length > 0 ? measurements[measurements.length - 1] : null;
    },
    
    getBodyMeasurementHistory(days = 90) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        
        return this.getBodyMeasurements()
            .filter(m => new Date(m.date) >= cutoff)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    
    // Derived metrics
    calculateBMI(weight_lb, height_cm) {
        const weight_kg = weight_lb * 0.453592;
        const height_m = height_cm / 100;
        return (weight_kg / (height_m * height_m)).toFixed(1);
    },
    
    calculateWaistToHeight(waist_cm, height_cm) {
        return (waist_cm / height_cm).toFixed(3);
    },
    
    getKneeDifference(measurement) {
        if (!measurement?.measurements?.knee_top_cm) return null;
        const { right, left } = measurement.measurements.knee_top_cm;
        return (right - left).toFixed(1);
    },
    
    getSwellingTrend(days = 7) {
        const checkIns = this.getRecentCheckIns(days);
        if (checkIns.length < 2) return 'insufficient_data';
        
        const swellingValues = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
        const recent = checkIns.slice(0, 3).map(c => swellingValues[c.swelling] || 0);
        const older = checkIns.slice(3, 6).map(c => swellingValues[c.swelling] || 0);
        
        if (older.length === 0) return 'stable';
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        if (recentAvg > olderAvg + 0.5) return 'worsening';
        if (recentAvg < olderAvg - 0.5) return 'improving';
        return 'stable';
    },
    
    // Sessions
    saveSession(sessionData) {
        try {
            const sessions = this.getSessions();
            sessions.push({
                ...sessionData,
                id: Date.now().toString(),
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('sessions', JSON.stringify(sessions));
            this.updateStreak();
            console.log('✅ Session saved');
            return true;
        } catch (e) {
            console.error('Save session error:', e);
            alert('! Failed to save session: ' + e.message);
            return false;
        }
    },
    
    getSessions() {
        try {
            return JSON.parse(localStorage.getItem('sessions') || '[]');
        } catch (e) {
            console.error('Get sessions error:', e);
            return [];
        }
    },
    
    // Exercise Logs
    saveExerciseLog(exerciseData) {
        try {
            const logs = this.getExerciseLogs();
            const newLog = {
                ...exerciseData,
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0]
            };
            logs.push(newLog);
            localStorage.setItem('exerciseLogs', JSON.stringify(logs));
            console.log('✅ Exercise logged:', exerciseData.exerciseName);
            this.logStorageStatus();
            return true;
        } catch (e) {
            console.error('Save exercise error:', e);
            alert('! Failed to save: ' + e.message);
            return false;
        }
    },
    
    getExerciseLogs() {
        try {
            const data = localStorage.getItem('exerciseLogs');
            return JSON.parse(data || '[]');
        } catch (e) {
            console.error('Get exercises error:', e);
            return [];
        }
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
        try {
            const workouts = this.getCustomWorkouts();
            workouts.push({
                ...workoutData,
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0]
            });
            localStorage.setItem('customWorkouts', JSON.stringify(workouts));
            console.log('✅ Custom workout saved:', workoutData.workoutCategory);
            return true;
        } catch (e) {
            console.error('Save custom workout error:', e);
            return false;
        }
    },
    
    getCustomWorkouts() {
        try {
            return JSON.parse(localStorage.getItem('customWorkouts') || '[]');
        } catch (e) {
            console.error('Get custom workouts error:', e);
            return [];
        }
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
        try {
            const checkIns = this.getCheckIns();
            const today = new Date().toISOString().split('T')[0];
            const existingIndex = checkIns.findIndex(c => c.date === today);
            
            if (existingIndex >= 0) {
                checkIns[existingIndex] = { ...checkInData, date: today };
            } else {
                checkIns.push({ ...checkInData, date: today });
            }
            localStorage.setItem('checkIns', JSON.stringify(checkIns));
            console.log('✅ Check-in saved for', today);
            return true;
        } catch (e) {
            console.error('Save check-in error:', e);
            alert('! Failed to save check-in: ' + e.message);
            return false;
        }
    },
    
    getCheckIns() {
        try {
            return JSON.parse(localStorage.getItem('checkIns') || '[]');
        } catch (e) {
            console.error('Get check-ins error:', e);
            return [];
        }
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
        
        // RED: Severe swelling OR moderate swelling with high pain
        if (swelling === 'severe' || (swelling === 'moderate' && pain >= 6)) return 'red';
        
        // YELLOW: Moderate swelling OR high pain OR mild swelling with high pain
        if (swelling === 'moderate' || pain >= 5 || (swelling === 'mild' && pain >= 5)) return 'yellow';
        
        // GREEN: No swelling OR mild swelling with low-moderate pain
        if (swelling === 'none' || (swelling === 'mild' && pain <= 4)) return 'green';
        
        return 'yellow';
    },
    
    getKneeStatusMessage() {
        const status = this.getKneeStatus();
        const messages = {
            green: {
                icon: '✅',
                title: 'GREEN - Go for It',
                message: 'Full training approved',
                action: 'Build or Prime exercises'
            },
            yellow: {
                icon: '⚠️',
                title: 'YELLOW - Caution',
                message: 'Modify intensity',
                action: 'Build (light) or Calm only'
            },
            red: {
                icon: '🛑',
                title: 'RED - Recover',
                message: 'Knee needs rest',
                action: 'Calm mode: gentle ROM, ice'
            },
            unknown: {
                icon: '❓',
                title: 'Check In First',
                message: 'Log swelling and pain',
                action: 'Complete Daily Check-In'
            }
        };
        return messages[status];
    },
    
    getKneeStatusForCheckIn(checkIn) {
        const { swelling, pain } = checkIn;
        // RED: Severe swelling OR moderate swelling with high pain
        if (swelling === 'severe' || (swelling === 'moderate' && pain >= 6)) return 'RED';
        
        // YELLOW: Moderate swelling OR high pain OR mild swelling with high pain
        if (swelling === 'moderate' || pain >= 5 || (swelling === 'mild' && pain >= 5)) return 'YELLOW';
        
        // GREEN: No swelling OR mild swelling with low-moderate pain
        if (swelling === 'none' || (swelling === 'mild' && pain <= 4)) return 'GREEN';
        
        return 'YELLOW';
    },
    
    // Export
    exportData() {
        try {
            const data = {
                exportDate: new Date().toISOString(),
                patientInfo: {
                    note: "44yo severe lateral OA + degenerative meniscus",
                    goal: "Avoid surgery, continue volleyball"
                },
                summary: {
                    totalExercises: this.getExerciseLogs().length,
                    totalCustomWorkouts: this.getCustomWorkouts().length,
                    totalBodyMeasurements: this.getBodyMeasurements().length,
                    currentStreak: this.getCurrentStreak(),
                    last30Days: {
                        avgPain: this.getRecentCheckIns(30).reduce((s, c) => s + (c.pain || 0), 0) / Math.max(this.getRecentCheckIns(30).length, 1)
                    }
                },
                dailyCheckIns: this.getCheckIns(),
                exerciseDetails: this.getExerciseLogs(),
                customWorkouts: this.getCustomWorkouts(),
                bodyMeasurements: this.getBodyMeasurements(),
                derivedMetrics: this.getDerivedMetrics()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kneecapacity-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            console.log('✅ Data exported');
        } catch (e) {
            console.error('Export error:', e);
            alert('Export failed: ' + e.message);
        }
    },
    
    getDerivedMetrics() {
        const latest = this.getLatestBodyMeasurement();
        if (!latest) return {};
        
        const m = latest.measurements;
        
        return {
            bmi: m.weight_lb && m.height_cm ? this.calculateBMI(m.weight_lb, m.height_cm) : null,
            waistToHeight: m.waist_cm && m.height_cm ? this.calculateWaistToHeight(m.waist_cm, m.height_cm) : null,
            kneeDifference: this.getKneeDifference(latest),
            swellingTrend: this.getSwellingTrend(7)
        };
    }
};
