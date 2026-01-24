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
            
            const kciScore = this.calculateKCI(checkInData);
            const enrichedData = { ...checkInData, date: today, kciScore };
            
            if (existingIndex >= 0) {
                checkIns[existingIndex] = enrichedData;
            } else {
                checkIns.push(enrichedData);
            }
            localStorage.setItem('checkIns', JSON.stringify(checkIns));
            console.log('✅ Check-in saved for', today, 'KCI:', kciScore);
            return enrichedData;
        } catch (e) {
            console.error('Save check-in error:', e);
            alert('! Failed to save check-in: ' + e.message);
            return null;
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
        
        // Extract dates, handling both old (timestamp only) and new (date field) formats
        const dates = allWorkouts.map(w => {
            if (w.date) return w.date;
            if (w.timestamp) return w.timestamp.split('T')[0];
            return null;
        }).filter(d => d !== null);
        
        if (dates.length === 0) {
            localStorage.setItem('streak', '0');
            return 0;
        }
        
        const uniqueDates = [...new Set(dates)].sort().reverse();
        
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        console.log('🔍 Streak Debug:', {
            totalWorkouts: allWorkouts.length,
            uniqueDates: uniqueDates,
            today: today,
            yesterday: yesterday,
            mostRecentWorkout: uniqueDates[0]
        });
        
        // If no workout today or yesterday, streak is broken
        if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
            console.log('❌ Streak broken: No workout today or yesterday');
            localStorage.setItem('streak', '0');
            return 0;
        }
        
        let streak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
            const d1 = new Date(uniqueDates[i]);
            const d2 = new Date(uniqueDates[i+1]);
            const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
            
            console.log(`  Day ${i} -> ${i+1}: ${uniqueDates[i]} to ${uniqueDates[i+1]} = ${diff.toFixed(2)} days apart`);
            
            if (diff <= 1.1) { // Allowing some buffer for timezones
                streak++;
            } else {
                console.log(`  ⛔ Streak broken at ${diff.toFixed(2)} days gap`);
                break;
            }
        }
        
        console.log(`✅ Final streak: ${streak} days`);
        
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

    calculateKCI(checkInData) {
        let score = 100;
        const { swelling, pain, activityLevel } = checkInData;

        // 1. Swelling Deductions
        const swellingDeductions = { 'none': 0, 'mild': 10, 'moderate': 25, 'severe': 40 };
        score -= (swellingDeductions[swelling] || 0);

        // 2. Pain Deductions
        if (pain >= 9) score -= 40;
        else if (pain >= 7) score -= 25;
        else if (pain >= 5) score -= 15;
        else if (pain >= 3) score -= 5;

        // 3. Activity Spike Logic (High followed by High)
        const checkIns = this.getCheckIns();
        const yesterday = this.getCheckIn(new Date(Date.now() - 86400000).toISOString().split('T')[0]);
        if (yesterday && yesterday.activityLevel === 'Active' && activityLevel === 'Active') {
            score -= 10;
        }

        // 4. Trend Detection (Getting Worse)
        const recentCheckIns = this.getRecentCheckIns(4); // Today + last 3
        if (recentCheckIns.length >= 3) {
            const todayPain = pain;
            const prevPain = recentCheckIns[1].pain || 0;
            const swellingValues = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
            const todaySwelling = swellingValues[swelling] || 0;
            const prevSwelling = swellingValues[recentCheckIns[1].swelling] || 0;

            if (todayPain >= prevPain + 2 || todaySwelling > prevSwelling) {
                score -= 5;
            }
        }

        // 5. Bonuses
        // Improving trend
        if (recentCheckIns.length >= 2) {
            const prevPain = recentCheckIns[1].pain || 0;
            const swellingValues = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
            const prevSwelling = swellingValues[recentCheckIns[1].swelling] || 0;
            if (pain < prevPain || swellingValues[swelling] < prevSwelling) {
                score += 5;
            }
        }

        // Consistent workouts (2+ in last 7 days)
        const last7DaysLogs = this.getExerciseLogs().filter(log => {
            const diff = (new Date() - new Date(log.date)) / (1000 * 60 * 60 * 24);
            return diff <= 7;
        });
        if (last7DaysLogs.length >= 2) {
            score += 5;
        }

        // Streak (7+ days with KCI > 70)
        let greenStreak = 0;
        const allCheckInsSorted = this.getCheckIns().sort((a, b) => new Date(b.date) - new Date(a.date));
        for (const c of allCheckInsSorted) {
            if (c.kciScore > 70) greenStreak++;
            else break;
        }
        if (greenStreak >= 7) {
            score += 10;
        }

        return Math.max(0, Math.min(100, score));
    },

    getKCIMessage(score) {
        if (score >= 85) return {
            text: `Good day 👍 Your knee is ready to work.`,
            lane: 'BUILD or PRIME',
            plan: 'Do a strength session (2-3 exercises, 20-30 min)',
            color: '#4CAF50',
            range: 'excellent'
        };
        if (score >= 70) return {
            text: `You're doing well. Keep building - you're trending up! 💪`,
            lane: 'BUILD',
            plan: 'Consistent strength work is key today.',
            color: '#8BC34A',
            range: 'good'
        };
        if (score >= 50) return {
            text: `Tough day 💛 - modify if needed. Listen to your body today.`,
            lane: 'CALM or light BUILD',
            plan: 'Focus on isometrics and controlled movement.',
            color: '#FFC107',
            range: 'caution'
        };
        if (score >= 30) return {
            text: `Your knee needs care today. Rest if you need it.`,
            lane: 'CALM',
            plan: 'Stick to gentle range of motion and quad sets.',
            color: '#FF9800',
            range: 'rest'
        };
        return {
            text: `Recover and rest up - this will pass.`,
            lane: 'CALM + rest emphasis',
            plan: 'Strategic rest and pain management.',
            color: '#F44336',
            range: 'recover'
        };
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
    
    // PDF Export for Specialists
    exportPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 90*24*60*60*1000);
            
            // Helper function for page numbers
            let pageNum = 1;
            const addPageNumber = () => {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text(`Page ${pageNum}`, 105, 285, { align: 'center' });
                doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 290, { align: 'center' });
                pageNum++;
            };
            
            // PAGE 1: Cover & Summary Stats
            doc.setFontSize(28);
            doc.setTextColor(46, 125, 50);
            doc.text('KNEE CAPACITY', 105, 30, { align: 'center' });
            
            doc.setFontSize(18);
            doc.setTextColor(100);
            doc.text('Progress Summary', 105, 45, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 20, 65);
            
            // Summary Stats
            const checkIns = this.getRecentCheckIns(90);
            const statusDist = this.getStatusDistribution(90);
            const avgPain = checkIns.length > 0 ? (checkIns.reduce((s, c) => s + (c.pain || 0), 0) / checkIns.length).toFixed(1) : 0;
            
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('SUMMARY STATS', 20, 90);
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text(`• Total days tracked: ${checkIns.length}`, 25, 100);
            doc.text(`• Green days: ${statusDist.green}%`, 25, 108);
            doc.text(`• Yellow days: ${statusDist.yellow}%`, 25, 116);
            doc.text(`• Red days: ${statusDist.red}%`, 25, 124);
            doc.text(`• Average pain: ${avgPain}/10`, 25, 132);
            doc.text(`• Total workouts: ${this.getTotalWorkouts()}`, 25, 140);
            doc.text(`• Current streak: ${this.getCurrentStreak()} days`, 25, 148);
            
            addPageNumber();
            
            // PAGE 2: Trends & Charts
            doc.addPage();
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('TRENDS & CHARTS', 20, 20);
            
            // Swelling Trend (30 days)
            doc.setFontSize(12);
            doc.text('Swelling Trend (30 days)', 20, 35);
            
            const swellingData = this.getRecentCheckIns(30).reverse();
            const swellingValues = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
            const swellingColors = [[76, 175, 80], [255, 193, 7], [255, 152, 0], [244, 67, 54]];
            
            swellingData.slice(0, 30).forEach((c, i) => {
                const val = swellingValues[c.swelling] || 0;
                const height = val * 10;
                const color = swellingColors[val];
                doc.setFillColor(color[0], color[1], color[2]);
                doc.rect(25 + i * 5, 80 - height, 4, height, 'F');
            });
            
            // Pain Trend (30 days)
            doc.setFontSize(12);
            doc.text('Pain Trend (30 days)', 20, 95);
            
            const painData = this.getRecentCheckIns(30).reverse();
            painData.slice(0, 30).forEach((c, i) => {
                const val = c.pain || 0;
                const height = val * 3;
                const color = val <= 2 ? [76, 175, 80] : val <= 5 ? [255, 193, 7] : [244, 67, 54];
                doc.setFillColor(color[0], color[1], color[2]);
                doc.rect(25 + i * 5, 140 - height, 4, height, 'F');
            });
            
            // Status Distribution
            doc.setFontSize(12);
            doc.text('Knee Status Distribution', 20, 155);
            
            doc.setFillColor(76, 175, 80);
            doc.rect(25, 165, statusDist.green * 1.5, 10, 'F');
            doc.text(`Green: ${statusDist.green}%`, 25 + statusDist.green * 1.5 + 5, 172);
            
            doc.setFillColor(255, 193, 7);
            doc.rect(25, 180, statusDist.yellow * 1.5, 10, 'F');
            doc.text(`Yellow: ${statusDist.yellow}%`, 25 + statusDist.yellow * 1.5 + 5, 187);
            
            doc.setFillColor(244, 67, 54);
            doc.rect(25, 195, statusDist.red * 1.5, 10, 'F');
            doc.text(`Red: ${statusDist.red}%`, 25 + statusDist.red * 1.5 + 5, 202);
            
            addPageNumber();
            
            // PAGE 3: Exercise History
            doc.addPage();
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('EXERCISE HISTORY', 20, 20);
            
            const topExercises = this.getTopExercises(5);
            doc.setFontSize(12);
            doc.text('Top 5 Exercises', 20, 35);
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            topExercises.forEach((ex, i) => {
                doc.text(`${i + 1}. ${ex.name} - ${ex.count}x`, 25, 45 + i * 8);
            });
            
            // Progressive Overload (top 3)
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Progressive Overload (Top 3)', 20, 95);
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            let yPos = 105;
            topExercises.slice(0, 3).forEach((ex) => {
                const exerciseId = window.EXERCISES.find(e => e.name === ex.name)?.id;
                if (exerciseId) {
                    const progression = this.getExerciseProgression(exerciseId);
                    if (progression) {
                        doc.text(`${ex.name}:`, 25, yPos);
                        doc.text(`  Start: ${progression.startWeight}lb`, 30, yPos + 7);
                        doc.text(`  End: ${progression.endWeight}lb`, 30, yPos + 14);
                        doc.text(`  Volume change: ${progression.volumeChange}%`, 30, yPos + 21);
                        yPos += 35;
                    }
                }
            });
            
            addPageNumber();
            
            // PAGE 4: Significant Events
            doc.addPage();
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('SIGNIFICANT EVENTS (90 days)', 20, 20);
            
            const events = this.getSignificantEvents(90);
            
            if (events.length === 0) {
                doc.setFontSize(11);
                doc.setFont(undefined, 'normal');
                doc.text('No significant events logged', 25, 35);
            } else {
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                let yPos = 35;
                
                events.slice(0, 8).forEach((e) => {
                    const date = new Date(e.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
                    const eventTypes = {
                        pain_spike: 'Pain Spike',
                        instability: 'Instability',
                        mechanical: 'Mechanical',
                        swelling_spike: 'Swelling Spike',
                        post_activity_flare: 'Post-Activity Flare',
                        other: 'Other'
                    };
                    const type = eventTypes[e.eventType] || e.eventType;
                    
                    doc.setFont(undefined, 'bold');
                    doc.text(`${date}: ${type} (Pain: ${e.painLevel}/10)`, 25, yPos);
                    doc.setFont(undefined, 'normal');
                    doc.text(`Activity: ${e.activity}`, 30, yPos + 7);
                    doc.text(`Duration: ${e.duration}`, 30, yPos + 14);
                    doc.text(`Resolution: ${e.resolution}`, 30, yPos + 21);
                    
                    // Red flags
                    if (e.redFlags && Object.values(e.redFlags).some(v => v)) {
                        doc.setTextColor(244, 67, 54);
                        doc.text('RED FLAGS', 30, yPos + 28);
                        doc.setTextColor(0);
                    }
                    
                    yPos += 40;
                    if (yPos > 250) return;
                });
            }
            
            addPageNumber();
            
            // PAGE 5: Body Measurements
            doc.addPage();
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('BODY MEASUREMENTS', 20, 20);
            
            const measurements = this.getBodyMeasurements();
            if (measurements.length >= 2) {
                const baseline = measurements[0];
                const current = measurements[measurements.length - 1];
                const trend = this.getMeasurementTrend();
                
                doc.setFontSize(12);
                doc.text('Knee Circumference', 20, 40);
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.text(`Baseline: R ${baseline.measurements.knee_top_cm.right} | L ${baseline.measurements.knee_top_cm.left} cm`, 25, 50);
                doc.text(`Current:  R ${current.measurements.knee_top_cm.right} | L ${current.measurements.knee_top_cm.left} cm`, 25, 58);
                doc.text(`Change:   R ${trend.kneeChange.right} | L ${trend.kneeChange.left} cm`, 25, 66);
                
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Thigh Circumference', 20, 85);
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.text(`Baseline: R ${baseline.measurements.thigh_cm.right} | L ${baseline.measurements.thigh_cm.left} cm`, 25, 95);
                doc.text(`Current:  R ${current.measurements.thigh_cm.right} | L ${current.measurements.thigh_cm.left} cm`, 25, 103);
                doc.text(`Change:   R ${trend.thighChange.right} | L ${trend.thighChange.left} cm`, 25, 111);
            } else {
                doc.setFontSize(11);
                doc.setFont(undefined, 'normal');
                doc.text('Insufficient measurement data', 25, 40);
            }
            
            addPageNumber();
            
            // PAGE 6: Notes Section
            doc.addPage();
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('OBSERVATIONS & NOTES', 20, 20);
            
            doc.setFontSize(12);
            doc.text('Patterns Observed:', 20, 35);
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            // Auto-generate insights
            const insights = [];
            if (statusDist.green > 50) {
                insights.push('• Knee status predominantly GREEN - good progress');
            }
            if (avgPain < 3) {
                insights.push('• Low average pain levels - well-managed');
            }
            if (this.getCurrentStreak() > 7) {
                insights.push(`• Strong consistency - ${this.getCurrentStreak()} day streak`);
            }
            if (topExercises.length > 0) {
                insights.push(`• Most frequent exercise: ${topExercises[0].name}`);
            }
            
            insights.forEach((insight, i) => {
                doc.text(insight, 25, 45 + i * 8);
            });
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('What\'s Working:', 20, 45 + insights.length * 8 + 15);
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text('• Consistent exercise logging', 25, 45 + insights.length * 8 + 25);
            doc.text('• Regular check-ins for monitoring', 25, 45 + insights.length * 8 + 33);
            
            addPageNumber();
            
            // Save PDF
            doc.save(`knee-capacity-summary-${new Date().toISOString().split('T')[0]}.pdf`);
            
        } catch (e) {
            alert('PDF export failed: ' + e.message);
        }
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

    getFavoriteExerciseIds(limit = 5) {
        const logs = this.getExerciseLogs();
        const counts = {};
        logs.forEach(log => {
            counts[log.exerciseId] = (counts[log.exerciseId] || 0) + 1;
        });
        
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(entry => entry[0]);
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
    },
    
    // PDF Export Helper Methods
    getStatusDistribution(days = 30) {
        const checkIns = this.getRecentCheckIns(days);
        const total = checkIns.length;
        if (total === 0) return { green: 0, yellow: 0, red: 0 };
        
        const counts = { green: 0, yellow: 0, red: 0 };
        checkIns.forEach(c => {
            const status = this.getKneeStatusForCheckIn(c);
            counts[status.toLowerCase()]++;
        });
        
        return {
            green: Math.round((counts.green / total) * 100),
            yellow: Math.round((counts.yellow / total) * 100),
            red: Math.round((counts.red / total) * 100)
        };
    },
    
    getTopExercises(limit = 5) {
        const logs = this.getExerciseLogs();
        const counts = {};
        
        logs.forEach(log => {
            counts[log.exerciseName] = (counts[log.exerciseName] || 0) + 1;
        });
        
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));
    },

    getRecommendedExercises(lane) {
        const allExercises = window.EXERCISES || [];
        const logs = this.getExerciseLogs();
        
        // Filter by lane
        const laneExercises = allExercises.filter(ex => ex.phase.includes(lane));
        
        // Sort by variety (last done date)
        const sorted = laneExercises.sort((a, b) => {
            const lastA = logs.filter(l => l.exerciseId === a.id).sort((x, y) => new Date(y.date) - new Date(x.date))[0];
            const lastB = logs.filter(l => l.exerciseId === b.id).sort((x, y) => new Date(y.date) - new Date(x.date))[0];
            
            const dateA = lastA ? new Date(lastA.date) : new Date(0);
            const dateB = lastB ? new Date(lastB.date) : new Date(0);
            
            return dateA - dateB; // Oldest first
        });
        
        return sorted.slice(0, 3);
    },

    getExerciseProgression(exerciseId) {
        const logs = this.getExerciseHistory(exerciseId, 90);
        if (logs.length < 2) return null;
        
        const first = logs[logs.length - 1];
        const last = logs[0];
        
        const firstVolume = first.setsCompleted * first.repsPerSet;
        const lastVolume = last.setsCompleted * last.repsPerSet;
        const volumeChange = ((lastVolume - firstVolume) / firstVolume) * 100;
        
        return {
            startWeight: first.weightUsed,
            endWeight: last.weightUsed,
            volumeChange: volumeChange.toFixed(0)
        };
    },
    
    getMeasurementTrend() {
        const measurements = this.getBodyMeasurements();
        if (measurements.length < 2) return null;
        
        const baseline = measurements[0];
        const current = measurements[measurements.length - 1];
        
        return {
            kneeChange: {
                right: (current.measurements.knee_top_cm.right - baseline.measurements.knee_top_cm.right).toFixed(1),
                left: (current.measurements.knee_top_cm.left - baseline.measurements.knee_top_cm.left).toFixed(1)
            },
            thighChange: {
                right: (current.measurements.thigh_cm.right - baseline.measurements.thigh_cm.right).toFixed(1),
                left: (current.measurements.thigh_cm.left - baseline.measurements.thigh_cm.left).toFixed(1)
            }
        };
    }
};
