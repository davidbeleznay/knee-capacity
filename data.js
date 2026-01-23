// KneeCapacity - Enhanced Data Management with Body Measurements

const DataManager = {
    
    init() {
        try {
            // Verify localStorage is available
            if (!this.isLocalStorageAvailable()) {
                alert('! Storage not available. Data may not persist.');
                return;
            }
            
            // Initialize all data stores
            if (!localStorage.getItem('sessions')) localStorage.setItem('sessions', JSON.stringify([]));
            if (!localStorage.getItem('checkIns')) localStorage.setItem('checkIns', JSON.stringify([]));
            if (!localStorage.getItem('exerciseLogs')) localStorage.setItem('exerciseLogs', JSON.stringify([]));
            if (!localStorage.getItem('customWorkouts')) localStorage.setItem('customWorkouts', JSON.stringify([]));
            if (!localStorage.getItem('bodyMeasurements')) localStorage.setItem('bodyMeasurements', JSON.stringify([]));
            if (!localStorage.getItem('significantEvents')) localStorage.setItem('significantEvents', JSON.stringify([]));
            if (!localStorage.getItem('streak')) localStorage.setItem('streak', '0');
            if (!localStorage.getItem('longestStreak')) localStorage.setItem('longestStreak', '0');
            
            // Add baseline measurement if none exist
            this.initializeBaselineMeasurement();
            
        } catch (e) {
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
            return true;
        } catch (e) {
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
            return true;
        } catch (e) {
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
            this.updateStreak();
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
            this.updateStreak();
            return true;
        } catch (e) {
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
        const exerciseLogs = this.getExerciseLogs();
        const customWorkouts = this.getCustomWorkouts();
        
        const allWorkouts = [...exerciseLogs, ...customWorkouts];
        if (allWorkouts.length === 0) {
            localStorage.setItem('streak', '0');
            return 0;
        }
        
        const dates = allWorkouts.map(w => w.date || w.timestamp.split('T')[0]);
        const uniqueDates = [...new Set(dates)].sort().reverse();
        
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        // If no workout today or yesterday, streak is broken
        if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
            localStorage.setItem('streak', '0');
            return 0;
        }
        
        let streak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
            const d1 = new Date(uniqueDates[i]);
            const d2 = new Date(uniqueDates[i+1]);
            const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
            
            if (diff <= 1.1) { // Allowing some buffer for timezones
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
        return this.updateStreak(); // Always recalculate to ensure accuracy
    },

    getBadges() {
        const totalWorkouts = this.getTotalWorkouts();
        const milestones = [
            { count: 100, emoji: '👑', label: 'King' },
            { count: 50, emoji: '⭐', label: 'Star' },
            { count: 20, emoji: '🔥', label: 'Elite' },
            { count: 10, emoji: '🏆', label: 'Champ' },
            { count: 1, emoji: '💪', label: 'Starter' }
        ];
        
        return milestones.filter(m => totalWorkouts >= m.count);
    },

    getTotalWorkouts() {
        return this.getExerciseLogs().length + this.getCustomWorkouts().length;
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
                lane: 'BUILD or PRIME',
                plan: 'You can do a strength session (BUILD) or prep for sport (PRIME).',
                reason: 'Your knee is baseline or better - build capacity or get ready to play.'
            },
            yellow: {
                icon: '⚠️',
                title: 'YELLOW - Caution',
                lane: 'CALM or Light BUILD',
                plan: 'Modify intensity. Do CALM exercises (isometrics, light movement) or a light BUILD session with reduced load.',
                reason: 'Your knee is reactive - don\'t provoke it further.'
            },
            red: {
                icon: '🛑',
                title: 'RED - Recover',
                lane: 'CALM ONLY',
                plan: 'Strategic rest. Do CALM exercises only (isometrics, pain-free movement).',
                reason: 'Your knee needs to settle before you can build again.'
            },
            unknown: {
                icon: '❓',
                title: 'Check In First',
                lane: 'Select after check-in',
                plan: 'Log swelling and pain to get guidance.',
                reason: 'Complete your daily check-in to see your recommended training lane.'
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

    getRecommendedLanes() {
        const status = this.getKneeStatus();
        if (status === 'green') return ['BUILD', 'PRIME'];
        if (status === 'yellow') return ['CALM', 'BUILD'];
        if (status === 'red') return ['CALM'];
        return [];
    },

    getLaneDescription(lane) {
        const descriptions = {
            'CALM': 'Focus on ROM, quad sets, and gentle swelling control. No impact.',
            'BUILD': 'Focus on strength, isometrics, and eccentric control. Minimal impact.',
            'PRIME': 'Focus on power, impact introduction, and athletic mechanics.'
        };
        return descriptions[lane] || '';
    },
    
    // Significant Events
    saveSignificantEvent(eventData) {
        try {
            const events = this.getSignificantEvents();
            const event = {
                ...eventData,
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                date: eventData.date || new Date().toISOString().split('T')[0]
            };
            events.push(event);
            localStorage.setItem('significantEvents', JSON.stringify(events));
            return true;
        } catch (e) {
            return false;
        }
    },
    
    getSignificantEvents(days = 90) {
        try {
            const events = JSON.parse(localStorage.getItem('significantEvents') || '[]');
            if (!days) return events;
            
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            
            return events
                .filter(e => new Date(e.date) >= cutoff)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (e) {
            return [];
        }
    },
    
    getEventById(id) {
        try {
            const events = JSON.parse(localStorage.getItem('significantEvents') || '[]');
            return events.find(e => e.id === id);
        } catch (e) {
            return null;
        }
    },
    
    updateEvent(id, updates) {
        try {
            const events = JSON.parse(localStorage.getItem('significantEvents') || '[]');
            const index = events.findIndex(e => e.id === id);
            if (index === -1) return false;
            
            events[index] = { ...events[index], ...updates };
            localStorage.setItem('significantEvents', JSON.stringify(events));
            return true;
        } catch (e) {
            return false;
        }
    },
    
    deleteEvent(id) {
        try {
            const events = JSON.parse(localStorage.getItem('significantEvents') || '[]');
            const filtered = events.filter(e => e.id !== id);
            localStorage.setItem('significantEvents', JSON.stringify(filtered));
            return true;
        } catch (e) {
            return false;
        }
    },
    
    generateSpecialistSummary() {
        const events = this.getSignificantEvents(90);
        const checkIns = this.getRecentCheckIns(90);
        const exercises = this.getExerciseLogs().filter(e => {
            const daysDiff = (new Date() - new Date(e.date)) / (1000 * 60 * 60 * 24);
            return daysDiff <= 90;
        });
        
        let summary = "=== KNEE CAPACITY SPECIALIST SUMMARY ===\n\n";
        
        // Patient info
        summary += "Patient: 44yo, Severe Lateral OA + Degenerative Meniscus\n";
        summary += "Goal: Avoid surgery, continue volleyball\n";
        const startDate = new Date(Date.now() - 90*24*60*60*1000).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
        const endDate = new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
        summary += `Report Period: ${startDate} - ${endDate}\n\n`;
        
        // Significant Events
        summary += "SIGNIFICANT EVENTS (Last 90 Days):\n";
        if (events.length === 0) {
            summary += "- No significant events logged\n\n";
        } else {
            events.forEach(e => {
                const date = new Date(e.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
                const eventTypes = {
                    pain_spike: 'Pain Spike',
                    instability: 'Instability Event',
                    mechanical: 'Mechanical Symptoms',
                    swelling_spike: 'Swelling Spike',
                    post_activity_flare: 'Post-Activity Flare',
                    other: 'Other'
                };
                const type = eventTypes[e.eventType] || e.eventType;
                summary += `- ${date}: ${type} (Pain: ${e.painLevel}/10)\n`;
                summary += `  Activity: ${e.activity}\n`;
                summary += `  Duration: ${e.duration}\n`;
                summary += `  Resolution: ${e.resolution}\n`;
                
                // Red flags
                if (e.redFlags) {
                    const flags = Object.entries(e.redFlags)
                        .filter(([k, v]) => v)
                        .map(([k]) => {
                            const flagNames = {
                                locking: 'Knee locking/catching',
                                cantBearWeight: 'Unable to bear weight',
                                severeSwelling7Days: 'Severe swelling >7 days',
                                suddenGivingWay: 'Sudden giving way'
                            };
                            return flagNames[k] || k;
                        });
                    if (flags.length > 0) {
                        summary += `  🚨 RED FLAGS: ${flags.join(', ')}\n`;
                    }
                }
                summary += '\n';
            });
        }
        
        // Pain trend
        if (checkIns.length > 0) {
            const avgPain = checkIns.reduce((s, c) => s + (c.pain || 0), 0) / checkIns.length;
            summary += `PAIN TREND:\n`;
            summary += `- Average pain: ${avgPain.toFixed(1)}/10\n`;
            summary += `- Check-ins logged: ${checkIns.length}\n\n`;
        }
        
        // Activity summary
        summary += `ACTIVITY SUMMARY:\n`;
        summary += `- Exercise sessions: ${exercises.length}\n`;
        summary += `- Current streak: ${this.getCurrentStreak()} days\n\n`;
        
        return summary;
    },
    
    // Export
    exportData() {
        try {
            const data = {
                exportDate: new Date().toISOString(),
                specialistSummary: this.generateSpecialistSummary(),
                patientInfo: {
                    note: "44yo severe lateral OA + degenerative meniscus",
                    goal: "Avoid surgery, continue volleyball"
                },
                summary: {
                    totalExercises: this.getExerciseLogs().length,
                    totalCustomWorkouts: this.getCustomWorkouts().length,
                    totalBodyMeasurements: this.getBodyMeasurements().length,
                    totalSignificantEvents: this.getSignificantEvents().length,
                    currentStreak: this.getCurrentStreak(),
                    last30Days: {
                        avgPain: this.getRecentCheckIns(30).reduce((s, c) => s + (c.pain || 0), 0) / Math.max(this.getRecentCheckIns(30).length, 1)
                    }
                },
                significantEvents: this.getSignificantEvents(90),
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
        } catch (e) {
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
