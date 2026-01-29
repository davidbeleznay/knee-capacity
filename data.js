// KneeCapacity - Enhanced Data Management with Body Measurements

const DataManager = {
    
    // Robust Storage Wrapper
    storage: {
        set(key, value) {
            let localSuccess = false;
            try {
                const serializedValue = JSON.stringify(value);
                localStorage.setItem(key, serializedValue);
                // Mobile browsers sometimes delay writing to disk. 
                // Accessing the item immediately can help force a sync in some environments.
                localStorage.getItem(key); 
                localSuccess = true;
            } catch (e) {
                console.error(`Storage Error (set ${key}):`, e);
            }
            
            // Always attempt a backup write (even if localStorage fails).
            if (typeof DataManager !== 'undefined' && DataManager.backup) {
                DataManager.backup.set(key, value);
            }

            return localSuccess;
        },
        get(key, defaultValue = []) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error(`Storage Error (get ${key}):`, e);
                return defaultValue;
            }
        }
    },

    // IndexedDB Backup (for mobile persistence fallback)
    backup: {
        dbName: 'knee-capacity-backup',
        storeName: 'kv',
        dbPromise: null,

        isAvailable() {
            return typeof indexedDB !== 'undefined';
        },

        open() {
            if (!this.isAvailable()) return Promise.reject(new Error('IndexedDB not available'));
            if (this.dbPromise) return this.dbPromise;

            this.dbPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, 1);

                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName, { keyPath: 'key' });
                    }
                };

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            return this.dbPromise;
        },

        set(key, value) {
            if (!this.isAvailable()) return Promise.resolve(false);

            return this.open()
                .then(db => new Promise(resolve => {
                    const tx = db.transaction(this.storeName, 'readwrite');
                    const store = tx.objectStore(this.storeName);
                    store.put({ key, value });
                    tx.oncomplete = () => resolve(true);
                    tx.onerror = () => resolve(false);
                }))
                .catch(() => false);
        },

        get(key) {
            if (!this.isAvailable()) return Promise.resolve(null);

            return this.open()
                .then(db => new Promise(resolve => {
                    const tx = db.transaction(this.storeName, 'readonly');
                    const store = tx.objectStore(this.storeName);
                    const request = store.get(key);
                    request.onsuccess = () => resolve(request.result ? request.result.value : null);
                    request.onerror = () => resolve(null);
                }))
                .catch(() => null);
        },

        getAll() {
            if (!this.isAvailable()) return Promise.resolve([]);

            return this.open()
                .then(db => new Promise(resolve => {
                    const tx = db.transaction(this.storeName, 'readonly');
                    const store = tx.objectStore(this.storeName);
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => resolve([]);
                }))
                .catch(() => []);
        }
    },

    init() {
        try {
            console.log('📦 Initializing DataManager...');
            // Verify localStorage is available
            if (!this.isLocalStorageAvailable()) {
                alert('! Storage not available. Data may not persist.');
                return;
            }
            
            // Initialize all data stores with robust wrapper
            const stores = [
                'sessions', 'checkIns', 'exerciseLogs', 
                'customWorkouts', 'bodyMeasurements', 
                'significantEvents', 'likedExercises', 'dislikedExercises'
            ];
            
            stores.forEach(store => {
                if (localStorage.getItem(store) === null) {
                    this.storage.set(store, []);
                }
            });
            
            // Initialize kneeProfile storage (object, not array)
            if (localStorage.getItem('kneeProfile') === null) {
                // Don't initialize - let it be null until user completes onboarding
            }

            if (localStorage.getItem('streak') === null) localStorage.setItem('streak', '0');
            if (localStorage.getItem('longestStreak') === null) localStorage.setItem('longestStreak', '0');

            this.requestPersistentStorage();
            
            // Add baseline measurement if none exist
            this.initializeBaselineMeasurement();
            this.normalizeCheckIns();
            console.log('✅ DataManager initialized');
        } catch (e) {
            console.error('Initialization error:', e);
        }
    },

    requestPersistentStorage() {
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist()
                .then(granted => {
                    console.log(granted ? '📌 Persistent storage granted' : '⚠️ Persistent storage not granted');
                })
                .catch(() => {
                    console.log('⚠️ Persistent storage request failed');
                });
        }
    },

    seedBackupFromStorage() {
        const stores = [
            'sessions', 'checkIns', 'exerciseLogs',
            'customWorkouts', 'bodyMeasurements',
            'significantEvents', 'likedExercises', 'dislikedExercises', 'kneeProfile'
        ];

        stores.forEach(store => {
            const value = this.storage.get(store, null);
            if (Array.isArray(value) && value.length > 0) {
                this.backup.set(store, value);
            }
        });
        
        // Backup kneeProfile (object, not array)
        const kneeProfile = this.getKneeProfile();
        if (kneeProfile) {
            this.backup.set('kneeProfile', kneeProfile);
        }

        const streak = localStorage.getItem('streak');
        const longestStreak = localStorage.getItem('longestStreak');
        if (streak !== null) this.backup.set('streak', streak);
        if (longestStreak !== null) this.backup.set('longestStreak', longestStreak);
    },

    restoreFromBackup() {
        return this.backup.getAll().then(records => {
            if (!records || records.length === 0) return false;

            const storeKeys = new Set([
                'sessions', 'checkIns', 'exerciseLogs',
                'customWorkouts', 'bodyMeasurements',
                'significantEvents', 'likedExercises', 'dislikedExercises', 'kneeProfile'
            ]);

            let restored = false;

            records.forEach(({ key, value }) => {
                if (storeKeys.has(key)) {
                    const localValue = this.storage.get(key, null);
                    const hasLocalData = Array.isArray(localValue) ? localValue.length > 0 : localValue !== null;
                    const hasBackupData = Array.isArray(value) ? value.length > 0 : (value !== null && typeof value === 'object');
                    if (!hasLocalData && hasBackupData) {
                        this.storage.set(key, value);
                        restored = true;
                    }
                }

                if (key === 'streak' && localStorage.getItem('streak') === null && value !== null) {
                    localStorage.setItem('streak', value);
                    restored = true;
                }

                if (key === 'longestStreak' && localStorage.getItem('longestStreak') === null && value !== null) {
                    localStorage.setItem('longestStreak', value);
                    restored = true;
                }
            });

            if (restored) {
                console.log('✅ Restored data from IndexedDB backup');
                this.normalizeCheckIns();
            }

            return restored;
        }).catch(() => false);
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

    getLocalDateKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    parseLocalDate(dateString) {
        if (!dateString) return null;
        const parts = dateString.split('-').map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
        return new Date(parts[0], parts[1] - 1, parts[2]);
    },

    getInferredCheckInDate(checkIn) {
        const baseDate = this.parseLocalDate(checkIn.date) || new Date();
        const timeOfDay = checkIn.timeOfDay || 'morning';
        const hourMap = { morning: 9, afternoon: 14, evening: 19 };
        const hour = hourMap[timeOfDay] ?? 9;
        const inferred = new Date(baseDate);
        inferred.setHours(hour, 0, 0, 0);
        return inferred;
    },

    normalizeCheckIns() {
        const checkIns = this.getCheckIns();
        if (!Array.isArray(checkIns) || checkIns.length === 0) return;

        const now = new Date();
        const todayKey = this.getLocalDateKey();
        const futureThreshold = new Date(now.getTime() + 60 * 60 * 1000);
        let changed = false;
        let fixedCount = 0;

        checkIns.forEach(checkIn => {
            if (!checkIn.createdAt) {
                let inferredAt = this.getInferredCheckInDate(checkIn);
                const originalDate = checkIn.date;
                
                while (inferredAt > futureThreshold) {
                    inferredAt.setDate(inferredAt.getDate() - 1);
                    changed = true;
                }

                checkIn.createdAt = inferredAt.getTime();
                const normalizedDate = this.getLocalDateKey(inferredAt);
                if (checkIn.date !== normalizedDate) {
                    console.log(`🔧 Normalizing check-in date: ${checkIn.date} → ${normalizedDate}`);
                    checkIn.date = normalizedDate;
                    changed = true;
                    fixedCount++;
                } else {
                    checkIn.createdAt = inferredAt.getTime();
                    changed = true;
                }
            }
            
            // Also fix any check-ins that have today's date but were created before today
            if (checkIn.date === todayKey && checkIn.createdAt) {
                const createdAt = new Date(checkIn.createdAt);
                const createdAtDate = this.getLocalDateKey(createdAt);
                if (createdAtDate !== todayKey) {
                    console.log(`🔧 Fixing check-in dated today but created on: ${createdAtDate}`);
                    // This check-in was created on a different day, so it shouldn't be for today
                    const yesterdayDate = new Date();
                    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                    checkIn.date = this.getLocalDateKey(yesterdayDate);
                    changed = true;
                    fixedCount++;
                }
            }
        });

        if (changed) {
            console.log(`✅ Normalized ${fixedCount} check-in(s)`);
            this.storage.set('checkIns', checkIns);
        }
    },
    
    // Body Measurements
    initializeBaselineMeasurement() {
        const measurements = this.getBodyMeasurements();
        if (measurements.length === 0) {
            const baseline = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                date: this.getLocalDateKey(),
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
            
            this.storage.set('bodyMeasurements', [baseline]);
        }
    },
    
    saveBodyMeasurement(data) {
        const measurements = this.getBodyMeasurements();
        measurements.push({
            ...data,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            date: this.getLocalDateKey()
        });
        return this.storage.set('bodyMeasurements', measurements);
    },
    
    getBodyMeasurements() {
        return this.storage.get('bodyMeasurements');
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
        const sessions = this.getSessions();
        sessions.push({
            ...sessionData,
            id: Date.now().toString(),
            timestamp: new Date().toISOString()
        });
        const success = this.storage.set('sessions', sessions);
        if (success) this.updateStreak();
        return success;
    },
    
    getSessions() {
        return this.storage.get('sessions');
    },
    
    // Exercise Logs
    saveExerciseLog(exerciseData) {
        const logs = this.getExerciseLogs();
        const newLog = {
            ...exerciseData,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            date: this.getLocalDateKey()
        };
        logs.push(newLog);
        const success = this.storage.set('exerciseLogs', logs);
        if (success) this.updateStreak();
        return success;
    },
    
    getExerciseLogs() {
        return this.storage.get('exerciseLogs');
    },
    
    getExerciseLogsByDate(date) {
        return this.getExerciseLogs().filter(log => log.date === date);
    },
    
    getTodaysExerciseLogs() {
        const today = this.getLocalDateKey();
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
            date: this.getLocalDateKey()
        });
        const success = this.storage.set('customWorkouts', workouts);
        if (success) this.updateStreak();
        return success;
    },
    
    getCustomWorkouts() {
        return this.storage.get('customWorkouts');
    },
    
    getCustomWorkoutsByDate(date) {
        return this.getCustomWorkouts().filter(w => w.date === date);
    },
    
    getTodaysCustomWorkouts() {
        const today = this.getLocalDateKey();
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
        const today = this.getLocalDateKey();
        const now = Date.now();
        
        console.log('💾 saveCheckIn called for date:', today);
        console.log('📅 Current time:', new Date().toISOString());
        
        // Get existing check-ins for today
        const todayCheckIns = checkIns.filter(c => {
            if (c.date === today) {
                if (c.createdAt) {
                    const createdDate = this.getLocalDateKey(new Date(c.createdAt));
                    return createdDate === today;
                }
                return true; // Old check-in without createdAt, assume it's for today
            }
            return false;
        });
        
        console.log('📋 Existing check-ins for today:', todayCheckIns.length);
        
        // Always create a new check-in (allow multiple per day)
        const kciScore = this.calculateKCI(checkInData);
        const enrichedData = { 
            ...checkInData, 
            id: `checkin-${now}`, // Unique ID for this check-in
            date: today, 
            kciScore,
            createdAt: now
        };
        
        // Fix any check-ins with today's date but created on a different day
        checkIns.forEach((checkIn, index) => {
            if (checkIn.date === today && checkIn.createdAt) {
                const createdDate = this.getLocalDateKey(new Date(checkIn.createdAt));
                if (createdDate !== today) {
                    console.warn('⚠️ Fixing check-in dated today but created on:', createdDate);
                    checkIns[index].date = createdDate;
                }
            }
        });
        
        // Add the new check-in
        checkIns.push(enrichedData);
        
        const success = this.storage.set('checkIns', checkIns);
        if (success) {
            // Verify the save by getting all check-ins for today again
            const verifyCheckIns = this.getCheckInsForDate(today);
            console.log('✅ New check-in saved for', today, 'KCI:', kciScore);
            console.log('📊 Total check-ins for today after save:', verifyCheckIns.length);
            console.log('📋 All check-ins for today:', verifyCheckIns.map(c => ({
                id: c.id,
                time: c.timeOfDay,
                pain: c.pain,
                swelling: c.swelling,
                createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : 'missing'
            })));
            return enrichedData;
        }
        return null;
    },
    
    getCheckIns() {
        return this.storage.get('checkIns');
    },
    
    getCheckIn(date) {
        // Return the most recent check-in for the given date
        const checkIns = this.getCheckIns();
        const dateCheckIns = checkIns.filter(c => {
            if (c.date === date) {
                if (c.createdAt) {
                    const createdDate = this.getLocalDateKey(new Date(c.createdAt));
                    return createdDate === date;
                }
                return true; // Old check-in without createdAt
            }
            return false;
        });
        
        // Return the most recent one (highest createdAt)
        if (dateCheckIns.length === 0) return null;
        return dateCheckIns.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
    },
    
    getCheckInsForDate(date) {
        // Return all check-ins for a given date, sorted by most recent first
        const checkIns = this.getCheckIns();
        const dateCheckIns = checkIns.filter(c => {
            if (c.date === date) {
                if (c.createdAt) {
                    const createdDate = this.getLocalDateKey(new Date(c.createdAt));
                    return createdDate === date;
                }
                return true; // Old check-in without createdAt
            }
            return false;
        });
        
        return dateCheckIns.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
            this.backup.set('streak', '0');
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
            this.backup.set('streak', '0');
            return 0;
        }
        
        const uniqueDates = [...new Set(dates)].sort().reverse();
        
        const today = this.getLocalDateKey();
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = this.getLocalDateKey(yesterdayDate);
        
        // If no workout today or yesterday, streak is broken
        if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
            localStorage.setItem('streak', '0');
            this.backup.set('streak', '0');
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
        if (streak > longest) {
            localStorage.setItem('longestStreak', streak.toString());
            this.backup.set('longestStreak', streak.toString());
        }
        
        localStorage.setItem('streak', streak.toString());
        this.backup.set('streak', streak.toString());
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
            { count: 1, emoji: '🦵', label: 'Starter' }
        ];
        
        return milestones.filter(m => totalWorkouts >= m.count);
    },

    getTotalWorkouts() {
        return this.getExerciseLogs().length + this.getCustomWorkouts().length;
    },
    
    // Traffic light status
    getKneeStatus() {
        const today = this.getLocalDateKey();
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
        // Check if personalized profile exists
        const profile = this.getKneeProfile();
        
        if (profile) {
            // Use personalized calculation
            return this.calculatePersonalizedKCI(checkInData, profile);
        } else {
            // Fallback to fixed calculation
            return this.calculateFixedKCI(checkInData);
        }
    },
    
    calculatePersonalizedKCI(checkInData, profile) {
        const { swelling, pain } = checkInData;
        const swellingValues = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
        
        // Step 1: Calculate irritation score (swelling-weighted)
        const S = (swellingValues[swelling] || 0) / 3; // Normalize swelling to 0-1
        const P = (pain || 0) / 10; // Normalize pain to 0-1
        const irritation = (profile.swellingWeight || 0.65) * S + (profile.painWeight || 0.35) * P;
        
        // Step 2: Calculate irritation at target, baseline, and redline
        const I_target = (profile.swellingWeight || 0.65) * (profile.targetSwelling || 0) / 3 + 
                         (profile.painWeight || 0.35) * (profile.targetPain || 0) / 10;
        const I_baseline = (profile.swellingWeight || 0.65) * (profile.baselineSwelling || 0) / 3 + 
                           (profile.painWeight || 0.35) * (profile.baselinePain || 0) / 10;
        const I_redline = (profile.swellingWeight || 0.65) * (profile.redlineSwelling || 0) / 3 + 
                          (profile.painWeight || 0.35) * (profile.redlinePain || 0) / 10;
        
        // Step 3: Map current irritation to 0-100 capacity scale
        // Capacity = 100 × clamp(1 - (I - I_target) / (I_redline - I_target), 0, 1)
        let capacity = 100;
        
        if (I_redline > I_target) {
            const normalizedIrritation = (irritation - I_target) / (I_redline - I_target);
            capacity = 100 * Math.max(0, Math.min(1, 1 - normalizedIrritation));
        } else {
            // Edge case: if redline equals target, use simple comparison
            if (irritation <= I_target) capacity = 100;
            else capacity = 0;
        }
        
        // Step 4: Safety guardrail - swelling ≥ moderate (2) caps capacity at 40
        const currentSwellingValue = swellingValues[swelling] || 0;
        if (currentSwellingValue >= 2) {
            capacity = Math.min(40, capacity);
        }
        
        // Step 5: Apply trend bonuses/penalties (similar to fixed calculation)
        const recentCheckIns = this.getRecentCheckIns(4);
        
        // Activity spike logic
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = this.getCheckIn(this.getLocalDateKey(yesterdayDate));
        if (yesterday && yesterday.activityLevel === 'Active' && checkInData.activityLevel === 'Active') {
            capacity -= 10;
        }
        
        // Trend detection (getting worse)
        if (recentCheckIns.length >= 3) {
            const todayPain = pain;
            const prevPain = recentCheckIns[1].pain || 0;
            const todaySwelling = swellingValues[swelling] || 0;
            const prevSwelling = swellingValues[recentCheckIns[1].swelling] || 0;
            
            if (todayPain >= prevPain + 2 || todaySwelling > prevSwelling) {
                capacity -= 5;
            }
        }
        
        // Improving trend bonus
        if (recentCheckIns.length >= 2) {
            const prevPain = recentCheckIns[1].pain || 0;
            const prevSwelling = swellingValues[recentCheckIns[1].swelling] || 0;
            if (pain < prevPain || swellingValues[swelling] < prevSwelling) {
                capacity += 5;
            }
        }
        
        // Consistent workouts bonus
        const last7DaysLogs = this.getExerciseLogs().filter(log => {
            const diff = (new Date() - new Date(log.date)) / (1000 * 60 * 60 * 24);
            return diff <= 7;
        });
        if (last7DaysLogs.length >= 2) {
            capacity += 5;
        }
        
        // Streak bonus
        let greenStreak = 0;
        const allCheckInsSorted = this.getCheckIns().sort((a, b) => new Date(b.date) - new Date(a.date));
        for (const c of allCheckInsSorted) {
            if (c.kciScore > 70) greenStreak++;
            else break;
        }
        if (greenStreak >= 7) {
            capacity += 10;
        }

        // Round to nearest whole number for display, and clamp 0-100
        return Math.max(0, Math.min(100, Math.round(capacity)));
    },
    
    calculateFixedKCI(checkInData) {
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
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = this.getCheckIn(this.getLocalDateKey(yesterdayDate));
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
        const events = this.getSignificantEvents(null);
        const event = {
            ...eventData,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            date: eventData.date || this.getLocalDateKey()
        };
        events.push(event);
        return this.storage.set('significantEvents', events);
    },
    
    getSignificantEvents(days = 90) {
        const events = this.storage.get('significantEvents');
        if (!days) return events;
        
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        
        return events
            .filter(e => new Date(e.date) >= cutoff)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    
    getEventById(id) {
        return this.getSignificantEvents(null).find(e => e.id === id);
    },
    
    updateEvent(id, updates) {
        const events = this.getSignificantEvents(null);
        const index = events.findIndex(e => e.id === id);
        if (index === -1) return false;
        
        events[index] = { ...events[index], ...updates };
        return this.storage.set('significantEvents', events);
    },
    
    deleteEvent(id) {
        const events = this.getSignificantEvents(null);
        const filtered = events.filter(e => e.id !== id);
        return this.storage.set('significantEvents', filtered);
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
        const likedIds = this.getLikedExerciseIds();
        if (!limit) return likedIds;
        return likedIds.slice(0, limit);
    },

    getLikedExerciseIds() {
        return this.storage.get('likedExercises', []);
    },

    isExerciseLiked(exerciseId) {
        return this.getLikedExerciseIds().includes(exerciseId);
    },

    setExerciseLike(exerciseId, liked) {
        const likedIds = this.getLikedExerciseIds();
        const index = likedIds.indexOf(exerciseId);
        
        if (liked && index === -1) {
            likedIds.unshift(exerciseId);
        }
        
        if (!liked && index !== -1) {
            likedIds.splice(index, 1);
        }
        
        this.storage.set('likedExercises', likedIds);
        return likedIds;
    },

    toggleExerciseLike(exerciseId) {
        const liked = !this.isExerciseLiked(exerciseId);
        this.setExerciseLike(exerciseId, liked);
        return liked;
    },
    
    // Dislike functionality
    getDislikedExerciseIds() {
        return this.storage.get('dislikedExercises', []);
    },
    
    isExerciseDisliked(exerciseId) {
        return this.getDislikedExerciseIds().includes(exerciseId);
    },
    
    setExerciseDislike(exerciseId, disliked) {
        const dislikedIds = this.getDislikedExerciseIds();
        const index = dislikedIds.indexOf(exerciseId);
        
        if (disliked && index === -1) {
            dislikedIds.push(exerciseId);
        }
        
        if (!disliked && index !== -1) {
            dislikedIds.splice(index, 1);
        }
        
        this.storage.set('dislikedExercises', dislikedIds);
        return dislikedIds;
    },
    
    toggleExerciseDislike(exerciseId) {
        const disliked = !this.isExerciseDisliked(exerciseId);
        this.setExerciseDislike(exerciseId, disliked);
        return disliked;
    },
    
    // Personal Knee Profile (Capacity Calibration)
    getKneeProfile() {
        return this.storage.get('kneeProfile', null);
    },
    
    hasKneeProfile() {
        const profile = this.getKneeProfile();
        return profile !== null && profile !== undefined;
    },
    
    setKneeProfile(profile) {
        const enrichedProfile = {
            ...profile,
            calibratedAt: this.getLocalDateKey(),
            version: 1
        };
        const success = this.storage.set('kneeProfile', enrichedProfile);
        if (success && this.backup) {
            this.backup.set('kneeProfile', enrichedProfile);
        }
        return success;
    },
    
    saveKneeProfile(profileData) {
        // Convert swelling strings to numbers
        const swellingValues = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
        
        const profile = {
            baselineSwelling: typeof profileData.baselineSwelling === 'string' 
                ? swellingValues[profileData.baselineSwelling] 
                : profileData.baselineSwelling,
            baselinePain: parseInt(profileData.baselinePain) || 0,
            redlineSwelling: typeof profileData.redlineSwelling === 'string'
                ? swellingValues[profileData.redlineSwelling]
                : profileData.redlineSwelling,
            redlinePain: parseInt(profileData.redlinePain) || 0,
            targetSwelling: typeof profileData.targetSwelling === 'string'
                ? swellingValues[profileData.targetSwelling]
                : profileData.targetSwelling,
            targetPain: parseInt(profileData.targetPain) || 0,
            baselineContext: profileData.baselineContext || '',
            redlineContext: profileData.redlineContext || '',
            swellingWeight: 0.65,
            painWeight: 0.35
        };
        
        return this.setKneeProfile(profile);
    },
    
    // Calculate deltas vs baseline for personalized display
    calculateDeltas(checkIn) {
        const profile = this.getKneeProfile();
        if (!profile || !checkIn) return null;
        
        const swellingValues = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3 };
        const currentSwelling = swellingValues[checkIn.swelling] || 0;
        const currentPain = checkIn.pain || 0;
        
        const swellingDelta = currentSwelling - profile.baselineSwelling;
        const painDelta = currentPain - profile.baselinePain;
        
        // Determine main driver (largest absolute delta)
        const absSwellingDelta = Math.abs(swellingDelta);
        const absPainDelta = Math.abs(painDelta);
        
        let mainDriver = '';
        if (absSwellingDelta > absPainDelta) {
            const sign = swellingDelta > 0 ? '+' : '';
            mainDriver = `Swelling ${sign}${swellingDelta.toFixed(1)} above baseline`;
        } else if (absPainDelta > absSwellingDelta) {
            const sign = painDelta > 0 ? '+' : '';
            mainDriver = `Pain ${sign}${painDelta.toFixed(1)} above baseline`;
        } else if (absSwellingDelta > 0 || absPainDelta > 0) {
            mainDriver = `Swelling ${swellingDelta > 0 ? '+' : ''}${swellingDelta.toFixed(1)}, Pain ${painDelta > 0 ? '+' : ''}${painDelta.toFixed(1)}`;
        } else {
            mainDriver = 'At baseline';
        }
        
        return {
            swellingDelta: swellingDelta.toFixed(1),
            painDelta: painDelta.toFixed(1),
            mainDriver
        };
    },
    
    // Track recovery trends for personalized display
    getRecoveryTrend() {
        const profile = this.getKneeProfile();
        if (!profile) return null;
        
        const checkIns = this.getCheckIns().sort((a, b) => {
            const dateA = this.parseLocalDate(a.date);
            const dateB = this.parseLocalDate(b.date);
            return dateB - dateA; // Most recent first
        });
        
        // Days since last Capacity ≥70
        let daysSinceGreen = null;
        const todayKey = this.getLocalDateKey();
        const today = this.parseLocalDate(todayKey);
        
        for (let i = 0; i < checkIns.length; i++) {
            const checkIn = checkIns[i];
            if (checkIn.kciScore >= 70) {
                const checkInDate = this.parseLocalDate(checkIn.date);
                const diffDays = Math.floor((today - checkInDate) / (1000 * 60 * 60 * 24));
                daysSinceGreen = diffDays;
                break;
            }
        }
        
        // Calculate average recovery time (days from <70 to ≥70)
        let recoveryTimes = [];
        let inRecovery = false;
        let recoveryStartDate = null;
        
        // Sort chronologically (oldest first) for recovery tracking
        const sortedCheckIns = [...checkIns].sort((a, b) => {
            const dateA = this.parseLocalDate(a.date);
            const dateB = this.parseLocalDate(b.date);
            return dateA - dateB;
        });
        
        for (let i = 0; i < sortedCheckIns.length; i++) {
            const checkIn = sortedCheckIns[i];
            const checkInDate = this.parseLocalDate(checkIn.date);
            
            if (checkIn.kciScore < 70 && !inRecovery) {
                inRecovery = true;
                recoveryStartDate = checkInDate;
            } else if (checkIn.kciScore >= 70 && inRecovery && recoveryStartDate) {
                const recoveryDays = Math.floor((checkInDate - recoveryStartDate) / (1000 * 60 * 60 * 24));
                if (recoveryDays > 0) {
                    recoveryTimes.push(recoveryDays);
                }
                inRecovery = false;
                recoveryStartDate = null;
            }
        }
        
        const avgRecoveryTime = recoveryTimes.length > 0
            ? (recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length).toFixed(1)
            : null;
        
        // Determine trend (improving/stable/declining)
        if (checkIns.length < 3) {
            return { daysSinceGreen, avgRecoveryTime, trend: 'insufficient_data' };
        }
        
        const recent = checkIns.slice(0, 3).map(c => c.kciScore || 0);
        const older = checkIns.slice(3, 6).map(c => c.kciScore || 0);
        
        if (older.length === 0) {
            return { daysSinceGreen, avgRecoveryTime, trend: 'insufficient_data' };
        }
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        let trend = 'stable';
        if (recentAvg > olderAvg + 5) trend = 'improving';
        else if (recentAvg < olderAvg - 5) trend = 'declining';
        
        return { daysSinceGreen, avgRecoveryTime, trend };
    },
    
    // Calculate progress to target zone (≥70)
    getTargetProgress(currentScore) {
        const profile = this.getKneeProfile();
        if (!profile) return null;
        
        const targetZone = 70;
        const pointsFromTarget = targetZone - currentScore;
        
        return {
            pointsFromTarget: pointsFromTarget > 0 ? pointsFromTarget : 0,
            isInTargetZone: currentScore >= targetZone
        };
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

    getRecommendedExercises(lane, kciScore = null) {
        const allExercises = window.EXERCISES || [];
        const logs = this.getExerciseLogs();
        const likedIds = this.getLikedExerciseIds();
        const dislikedIds = this.getDislikedExerciseIds();
        
        // Determine capacity tier based on KCI score
        const isBuildPrime = kciScore !== null && kciScore >= 70;
        
        // Get exercises done in last 3 days for variety
        const today = this.getLocalDateKey();
        const todayDate = this.parseLocalDate(today);
        const threeDaysAgo = new Date(todayDate);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const threeDaysAgoKey = this.getLocalDateKey(threeDaysAgo);
        
        const recentExerciseIds = new Set(
            logs
                .filter(log => {
                    if (!log.date) return false;
                    // Compare date strings directly (YYYY-MM-DD format sorts correctly)
                    return log.date >= threeDaysAgoKey;
                })
                .map(log => log.exerciseId)
        );
        
        // Category mappings
        const categoryMap = {
            'BUILD/PRIME': {
                'Knee-Tendon + Control': 'Quad Strength',
                'Hip + Pelvis Control': 'Hip Stability',
                'Hamstrings + Posterior Chain': 'Posterior Chain',
                'Calf/Ankle + Foot': 'Ankle/Foot'
            },
            'CALM': {
                'Knee-Tendon + Control': 'Isometric Quad',
                'Hip + Pelvis Control': 'Hip Control',
                'Knee Mobility + ROM': 'Mobility'
            }
        };
        
        const categories = isBuildPrime 
            ? ['Knee-Tendon + Control', 'Hip + Pelvis Control', 'Hamstrings + Posterior Chain', 'Calf/Ankle + Foot']
            : ['Knee-Tendon + Control', 'Hip + Pelvis Control', 'Knee Mobility + ROM'];
        
        // Normalize lane to uppercase and handle compound lanes (done once outside loop)
        const normalizedLane = lane.toUpperCase();
        const lanePhases = normalizedLane.includes('OR') 
            ? normalizedLane.split('OR').map(l => l.trim())
            : [normalizedLane];
        
        const recommendations = [];
        
        // Select one exercise from each category
        categories.forEach(category => {
            // Filter exercises by category, lane, and exclude disliked
            let candidates = allExercises.filter(ex => {
                const categoryMatch = ex.category === category;
                // Check if exercise phase matches any of the lane phases (case-insensitive)
                const phaseMatch = ex.phase.some(phase => 
                    lanePhases.some(lp => phase.toUpperCase() === lp || phase.toUpperCase().includes(lp))
                );
                const notDisliked = !dislikedIds.includes(ex.id);
                const notRecent = !recentExerciseIds.has(ex.id); // Prefer variety
                
                return categoryMatch && phaseMatch && notDisliked;
            });
            
            // If no candidates excluding recent, allow recent ones (better than nothing)
            if (candidates.length === 0) {
                candidates = allExercises.filter(ex => {
                    const categoryMatch = ex.category === category;
                    const phaseMatch = ex.phase.some(phase => 
                        lanePhases.some(lp => phase.toUpperCase() === lp || phase.toUpperCase().includes(lp))
                    );
                    const notDisliked = !dislikedIds.includes(ex.id);
                    return categoryMatch && phaseMatch && notDisliked;
                });
            }
            
            if (candidates.length === 0) return; // Skip if no exercises in category
            
            // Sort by: liked first, then not recent, then variety
            candidates.sort((a, b) => {
                const aLiked = likedIds.includes(a.id);
                const bLiked = likedIds.includes(b.id);
                const aRecent = recentExerciseIds.has(a.id);
                const bRecent = recentExerciseIds.has(b.id);
                
                // Liked exercises first
                if (aLiked && !bLiked) return -1;
                if (!aLiked && bLiked) return 1;
                
                // Non-recent exercises preferred
                if (!aRecent && bRecent) return -1;
                if (aRecent && !bRecent) return 1;
                
                // Then by variety (last done date - compare date strings)
                const exerciseLogsA = logs.filter(l => l.exerciseId === a.id);
                const exerciseLogsB = logs.filter(l => l.exerciseId === b.id);
                
                const lastA = exerciseLogsA.length > 0 
                    ? exerciseLogsA.sort((x, y) => {
                        if (!x.date || !y.date) return 0;
                        return y.date.localeCompare(x.date); // Most recent first
                    })[0]
                    : null;
                const lastB = exerciseLogsB.length > 0
                    ? exerciseLogsB.sort((x, y) => {
                        if (!x.date || !y.date) return 0;
                        return y.date.localeCompare(x.date); // Most recent first
                    })[0]
                    : null;
                
                const dateA = lastA ? lastA.date : null;
                const dateB = lastB ? lastB.date : null;
                
                if (!dateA && dateB) return -1; // Never done preferred
                if (dateA && !dateB) return 1;
                if (!dateA && !dateB) return 0;
                
                return dateA.localeCompare(dateB); // Older first (earlier date string)
            });
            
            // Randomly select from top candidates (top 3 if available, otherwise all)
            const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
            const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
            
            if (selected) {
                const categoryLabel = (isBuildPrime ? categoryMap['BUILD/PRIME'] : categoryMap['CALM'])[category] || category;
                recommendations.push({
                    exercise: selected,
                    categoryLabel: categoryLabel
                });
            }
        });
        
        // Ensure no duplicates (shouldn't happen, but safety check)
        const seenIds = new Set();
        return recommendations.filter(rec => {
            if (seenIds.has(rec.exercise.id)) return false;
            seenIds.add(rec.exercise.id);
            return true;
        });
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
