// Events Module - Significant Event Logging

const EVENT_TYPES = {
    pain_spike: { label: "Pain Spike", icon: "⚡", color: "#F44336" },
    instability: { label: "Instability Event", icon: "⚠️", color: "#FF9800" },
    mechanical: { label: "Mechanical Symptoms", icon: "⚙️", color: "#9C27B0" },
    swelling_spike: { label: "Swelling Spike", icon: "💧", color: "#2196F3" },
    post_activity_flare: { label: "Post-Activity Flare", icon: "🔥", color: "#FF5722" },
    other: { label: "Other", icon: "📝", color: "#607D8B" }
};

const DURATION_OPTIONS = [
    "< 1 hour",
    "1-6 hours",
    "6-24 hours",
    "1-2 days",
    "3-7 days",
    "> 7 days (ongoing)",
    "Custom"
];

function setupEventHandlers() {
    const saveBtn = document.getElementById('save-event');
    if (saveBtn) {
        saveBtn.ontouchstart = saveEvent;
        saveBtn.onclick = saveEvent;
    }
    
    const painSlider = document.getElementById('event-pain-slider');
    if (painSlider) {
        painSlider.oninput = (e) => {
            document.getElementById('event-pain-value').textContent = e.target.value;
        };
    }
}

function openEventModal(eventId = null) {
    const modal = document.getElementById('event-modal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    if (eventId) {
        // Edit existing event
        const event = DataManager.getEventById(eventId);
        if (event) {
            document.getElementById('event-id').value = event.id;
            document.getElementById('event-type').value = event.eventType;
            document.getElementById('event-date').value = event.date;
            document.getElementById('event-time').value = event.timestamp.split('T')[1].substring(0, 5);
            document.getElementById('event-pain-slider').value = event.painLevel;
            document.getElementById('event-pain-value').textContent = event.painLevel;
            document.getElementById('event-activity').value = event.activity;
            document.getElementById('event-duration').value = event.duration;
            document.getElementById('event-resolution').value = event.resolution;
            document.getElementById('event-notes').value = event.notes || '';
            
            // Red flags
            if (event.redFlags) {
                document.getElementById('flag-locking').checked = event.redFlags.locking || false;
                document.getElementById('flag-cant-bear-weight').checked = event.redFlags.cantBearWeight || false;
                document.getElementById('flag-severe-swelling').checked = event.redFlags.severeSwelling7Days || false;
                document.getElementById('flag-giving-way').checked = event.redFlags.suddenGivingWay || false;
            }
            
            document.getElementById('event-modal-title').textContent = 'Edit Significant Event';
        }
    } else {
        // New event - set defaults
        document.getElementById('event-id').value = '';
        document.getElementById('event-type').value = 'pain_spike';
        
        const now = new Date();
        document.getElementById('event-date').value = now.toISOString().split('T')[0];
        document.getElementById('event-time').value = now.toTimeString().substring(0, 5);
        
        document.getElementById('event-pain-slider').value = 5;
        document.getElementById('event-pain-value').textContent = '5';
        document.getElementById('event-activity').value = '';
        document.getElementById('event-duration').value = '1-6 hours';
        document.getElementById('event-resolution').value = '';
        document.getElementById('event-notes').value = '';
        
        // Reset red flags
        document.getElementById('flag-locking').checked = false;
        document.getElementById('flag-cant-bear-weight').checked = false;
        document.getElementById('flag-severe-swelling').checked = false;
        document.getElementById('flag-giving-way').checked = false;
        
        document.getElementById('event-modal-title').textContent = '⚠️ Log Significant Event';
    }
}

function closeEventModal() {
    document.getElementById('event-modal').style.display = 'none';
}

function saveEvent() {
    const eventId = document.getElementById('event-id').value;
    const eventType = document.getElementById('event-type').value;
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const painLevel = parseInt(document.getElementById('event-pain-slider').value);
    const activity = document.getElementById('event-activity').value.trim();
    const duration = document.getElementById('event-duration').value;
    const resolution = document.getElementById('event-resolution').value.trim();
    const notes = document.getElementById('event-notes').value.trim();
    
    // Validation
    if (!eventType) {
        alert('! Please select an event type');
        return;
    }
    if (!activity) {
        alert('! Please describe what you were doing');
        return;
    }
    
    // Red flags
    const redFlags = {
        locking: document.getElementById('flag-locking').checked,
        cantBearWeight: document.getElementById('flag-cant-bear-weight').checked,
        severeSwelling7Days: document.getElementById('flag-severe-swelling').checked,
        suddenGivingWay: document.getElementById('flag-giving-way').checked
    };
    
    // Check for red flags and warn user
    const hasRedFlags = Object.values(redFlags).some(v => v);
    if (hasRedFlags) {
        const flagNames = [];
        if (redFlags.locking) flagNames.push('knee locking');
        if (redFlags.cantBearWeight) flagNames.push('unable to bear weight');
        if (redFlags.severeSwelling7Days) flagNames.push('severe swelling >7 days');
        if (redFlags.suddenGivingWay) flagNames.push('sudden giving way');
        
        const warningMsg = `⚠️ RED FLAG SYMPTOMS DETECTED:\n\n${flagNames.join(', ')}\n\nThese symptoms may require immediate medical attention. Consider contacting your healthcare provider.`;
        alert(warningMsg);
    }
    
    const eventData = {
        eventType,
        date,
        timestamp: `${date}T${time}:00.000Z`,
        painLevel,
        activity,
        duration,
        resolution,
        notes,
        redFlags
    };
    
    let success = false;
    if (eventId) {
        // Update existing
        success = DataManager.updateEvent(eventId, eventData);
    } else {
        // Create new
        success = DataManager.saveSignificantEvent(eventData);
    }
    
    if (success) {
        alert(eventId ? 'Event updated!' : 'Event logged!');
        closeEventModal();
        renderRecentEventsPreview();
        renderEventsTimeline();
    } else {
        alert('! Failed to save event');
    }
}

function deleteEventWithConfirm(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    
    if (DataManager.deleteEvent(id)) {
        alert('Event deleted');
        renderRecentEventsPreview();
        renderEventsTimeline();
    } else {
        alert('! Failed to delete event');
    }
}

function renderRecentEventsPreview() {
    const container = document.getElementById('recent-events-preview');
    if (!container) return;
    
    const events = DataManager.getSignificantEvents(90);
    
    if (events.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-500); font-size: 12px;">No events logged</p>';
        return;
    }
    
    const recent = events.slice(0, 3);
    container.innerHTML = recent.map(e => {
        const date = new Date(e.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
        const type = EVENT_TYPES[e.eventType];
        return `<div style="font-size: 12px; color: var(--gray-600); margin-bottom: 4px;">
            ${type.icon} ${date}: ${type.label} (${e.painLevel}/10)
        </div>`;
    }).join('');
}

function renderEventsTimeline() {
    const container = document.getElementById('events-timeline');
    if (!container) return;
    
    const events = DataManager.getSignificantEvents(90);
    
    if (events.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--gray-500);">No significant events logged in the last 90 days</p>';
        return;
    }
    
    container.innerHTML = events.map(e => {
        const date = new Date(e.date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'});
        const type = EVENT_TYPES[e.eventType];
        
        // Check for red flags
        const hasRedFlags = e.redFlags && Object.values(e.redFlags).some(v => v);
        const redFlagHtml = hasRedFlags ? `
            <div style="background: #FFEBEE; border-left: 4px solid #F44336; padding: 8px; margin-top: 8px; border-radius: 4px;">
                <strong style="color: #F44336;">🚨 Red Flags:</strong>
                <div style="font-size: 12px; margin-top: 4px;">
                    ${e.redFlags.locking ? '• Knee locking/catching<br>' : ''}
                    ${e.redFlags.cantBearWeight ? '• Unable to bear weight<br>' : ''}
                    ${e.redFlags.severeSwelling7Days ? '• Severe swelling >7 days<br>' : ''}
                    ${e.redFlags.suddenGivingWay ? '• Sudden giving way<br>' : ''}
                </div>
            </div>
        ` : '';
        
        return `
            <div class="event-card" style="background: white; border-left: 4px solid ${type.color}; padding: 16px; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                        <div style="font-size: 18px; font-weight: 700; color: ${type.color};">
                            ${type.icon} ${type.label}
                        </div>
                        <div style="font-size: 13px; color: var(--gray-600); margin-top: 2px;">
                            ${date}
                        </div>
                    </div>
                    <div style="font-size: 24px; font-weight: 800; color: ${type.color};">
                        ${e.painLevel}/10
                    </div>
                </div>
                
                <div style="font-size: 14px; margin-bottom: 8px;">
                    <strong>Activity:</strong> ${e.activity}
                </div>
                <div style="font-size: 14px; margin-bottom: 8px;">
                    <strong>Duration:</strong> ${e.duration}
                </div>
                <div style="font-size: 14px; margin-bottom: 8px;">
                    <strong>Resolution:</strong> ${e.resolution}
                </div>
                ${e.notes ? `<div style="font-size: 13px; color: var(--gray-600); font-style: italic; margin-bottom: 8px;">
                    "${e.notes}"
                </div>` : ''}
                
                ${redFlagHtml}
                
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="secondary-button" onclick="openEventModal('${e.id}')" style="font-size: 12px; padding: 6px 12px;">
                        Edit
                    </button>
                    <button class="secondary-button" onclick="deleteEventWithConfirm('${e.id}')" style="font-size: 12px; padding: 6px 12px; color: #F44336;">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}
