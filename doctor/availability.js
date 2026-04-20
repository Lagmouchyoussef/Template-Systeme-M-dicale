// ── Auth Guard ─────────────────────────────────────────────────────────────
(function() {
    const role = localStorage.getItem('userRole');
    if (!role || (role !== 'doctor' && role !== 'medecin')) {
        window.location.replace('../login/index.html');
    }
})();

// Utilities
function showStyledMessage(message, type = 'info', duration = 5000) {
    let messageContainer = document.getElementById('styled-message-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'styled-message-container';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(messageContainer);
    }

    const messageCard = document.createElement('div');
    messageCard.style.cssText = `
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 16px 20px;
        margin-bottom: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        pointer-events: auto;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
    `;
    
    const colors = {
        success: '#155724',
        error: '#721c24',
        warning: '#856404',
        info: '#0c5460'
    };
    
    messageCard.style.color = colors[type] || colors.info;
    messageCard.innerHTML = `<div style="font-size: 14px;">${message}</div>`;
    messageContainer.appendChild(messageCard);
    
    setTimeout(() => {
        messageCard.style.transform = 'translateX(0)';
        messageCard.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        messageCard.style.transform = 'translateX(100%)';
        messageCard.style.opacity = '0';
        setTimeout(() => messageCard.remove(), 300);
    }, duration);
}

// ── App Initialization ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('doctor-availability.html')) return;
    
    initAvailabilitySettings();
    initInvitationSystem();
    loadDashboardData();
    
    // Listen for live updates from the Patient portal (cross-tab sync)
    window.addEventListener('storage', (e) => {
        if (e.key === 'appointmentRequests' || e.key === 'sentInvitations') {
            loadDashboardData();
        }
    });
});

// ── 1. Availability Settings ─────────────────────────────────────────────

function initAvailabilitySettings() {
    loadAvailability();
    
    const saveBtn = document.getElementById('save-availability-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveAvailability);
    
    const viewBtn = document.getElementById('view-schedule-btn');
    if (viewBtn) viewBtn.addEventListener('click', () => {
        document.querySelector('.availability-table-container').scrollIntoView({ behavior: 'smooth' });
    });
}

async function loadAvailability() {
    try {
        // Mock API Fetch: GET /api/availability
        const saved = localStorage.getItem('doctorAvailability');
        if (saved) {
            const data = JSON.parse(saved);
            
            // Populate days
            data.days.forEach(day => {
                const cb = document.getElementById(`cb-${day}`);
                if (cb) cb.checked = true;
            });
            
            // Populate times
            document.getElementById('start-time').value = data.startTime || '09:00';
            document.getElementById('end-time').value = data.endTime || '17:00';
        }
    } catch (e) {
        console.error('Failed to load availability', e);
    }
}

async function saveAvailability() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const selectedDays = days.filter(day => document.getElementById(`cb-${day}`).checked);
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;

    if (selectedDays.length === 0) {
        showStyledMessage('Please select at least one day.', 'warning');
        return;
    }
    if (!startTime || !endTime) {
        showStyledMessage('Please set both start and end times.', 'warning');
        return;
    }

    const payload = { days: selectedDays, startTime, endTime };

    // Mock API Save: POST /api/availability
    localStorage.setItem('doctorAvailability', JSON.stringify(payload));
    showStyledMessage('Availability saved successfully!', 'success');
    
    // Refresh current availability table
    renderCurrentAvailability(payload);
}

// ── 2. Invitation System ─────────────────────────────────────────────────

async function initInvitationSystem() {
    await fetchPatientsList();
    
    document.getElementById('invitation-date').addEventListener('change', (e) => {
        updateAvailableTimes(new Date(e.target.value));
    });
    
    document.getElementById('send-invitation-btn').addEventListener('click', sendInvitation);
    document.getElementById('preview-invitation-btn').addEventListener('click', () => {
        showStyledMessage('Preview modal feature is active.', 'info');
    });
    
    // Default tomorrow
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    document.getElementById('invitation-date').value = tmrw.toISOString().split('T')[0];
    updateAvailableTimes(tmrw);
}

async function fetchPatientsList() {
    // Fetch from real data source
    const select = document.getElementById('patient-select');
    select.innerHTML = '<option value="">Select a patient...</option>';
    
    const patients = JSON.parse(localStorage.getItem('registeredPatients') || '[]');
    
    patients.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.email})`;
        opt.dataset.patient = JSON.stringify(p);
        select.appendChild(opt);
    });
}

function updateAvailableTimes(date) {
    const timeSelect = document.getElementById('invitation-time');
    timeSelect.innerHTML = '<option value="">Select time...</option>';
    
    const saved = JSON.parse(localStorage.getItem('doctorAvailability') || '{"days":[]}');
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const selectedDayName = dayNames[date.getDay()];

    if (!saved.days.includes(selectedDayName)) {
        timeSelect.innerHTML = '<option value="">Doctor not available this day</option>';
        return;
    }

    const startHour = parseInt((saved.startTime || '09:00').split(':')[0]);
    const endHour = parseInt((saved.endTime || '17:00').split(':')[0]);
    
    for (let h = startHour; h < endHour; h++) {
        timeSelect.innerHTML += `<option value="${String(h).padStart(2, '0')}:00">${String(h).padStart(2, '0')}:00</option>`;
        timeSelect.innerHTML += `<option value="${String(h).padStart(2, '0')}:30">${String(h).padStart(2, '0')}:30</option>`;
    }
}

async function sendInvitation() {
    const patientSelect = document.getElementById('patient-select');
    const pSel = patientSelect.value;
    const date = document.getElementById('invitation-date').value;
    const time = document.getElementById('invitation-time').value;
    const typeSelect = document.getElementById('appointment-type').value;
    const notes = document.getElementById('invitation-notes').value;
    
    if (!pSel || !date || !time) {
        showStyledMessage('Please complete all required fields.', 'warning');
        return;
    }
    
    const selectedOption = patientSelect.options[patientSelect.selectedIndex];
    const patientData = JSON.parse(selectedOption.dataset.patient);
    const doctorName = localStorage.getItem('userName') || '';
    const doctorEmail = localStorage.getItem('email') || '';

    const invitationData = {
        id: Date.now().toString(),
        patient: patientData,
        doctor: { name: doctorName, email: doctorEmail },
        date: date,
        time: time,
        type: typeSelect,
        notes: notes,
        sentAt: new Date().toISOString(),
        status: 'pending'
    };

    // Save to real storage
    const existingInvitations = JSON.parse(localStorage.getItem('sentInvitations') || '[]');
    existingInvitations.push(invitationData);
    localStorage.setItem('sentInvitations', JSON.stringify(existingInvitations));

    const patientInvitations = JSON.parse(localStorage.getItem(`patient_${patientData.id}_invitations`) || '[]');
    patientInvitations.push(invitationData);
    localStorage.setItem(`patient_${patientData.id}_invitations`, JSON.stringify(patientInvitations));

    showStyledMessage('Invitation sent successfully!', 'success');

    // Reset form
    patientSelect.value = '';
    document.getElementById('invitation-notes').value = '';
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    document.getElementById('invitation-date').value = tmrw.toISOString().split('T')[0];
    updateAvailableTimes(tmrw);
    
    // Refresh the dashboard to show the new invitation
    loadDashboardData();
}

// ── 3. Data Fetching (Requests & Current Schedule) ───────────────────────

async function loadDashboardData() {
    const doctorId = localStorage.getItem('userId');
    const allRequests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
    
    // In demo mode, show all requests so they are always visible
    let requests = allRequests;
    
    const isValid = (val) => val && val !== 'undefined' && val !== 'null';
    
    // Map them to the format expected by render functions
    requests = requests.map(r => ({
        id: r.id,
        patient: isValid(r.patientName) ? r.patientName : 
                 (isValid(r.patient) && typeof r.patient === 'string' ? r.patient : 
                 (r.patient && isValid(r.patient.name) ? r.patient.name : 'Unknown Patient')),
        email: isValid(r.email) ? r.email : (r.patient && isValid(r.patient.email) ? r.patient.email : ''),
        phone: isValid(r.phone) ? r.phone : (r.patient && isValid(r.patient.phone) ? r.patient.phone : ''),
        status: r.status || 'pending',
        date: r.date,
        time: r.time,
        type: r.type || 'Consultation',
        notes: isValid(r.reason) ? r.reason : (isValid(r.notes) ? r.notes : 'No reason provided')
    }));
    
    // Fetch and render Sent Invitations
    let sentInvitations = JSON.parse(localStorage.getItem('sentInvitations') || '[]');
    // In demo mode, show all invitations
    renderSentInvitations(sentInvitations);
    
    renderStats(requests, sentInvitations);
    renderRequests(requests);
    
    // 2. Fetch Current Availability summary
    const saved = JSON.parse(localStorage.getItem('doctorAvailability') || '{"days":[], "startTime": "-", "endTime": "-"}');
    renderCurrentAvailability(saved);
}

function renderStats(requests, invitations = []) {
    const allItems = [...requests, ...invitations];
    const total = allItems.length;
    const pending = allItems.filter(r => r.status === 'pending').length;
    const accepted = allItems.filter(r => r.status === 'accepted').length;
    const rejected = allItems.filter(r => r.status === 'declined' || r.status === 'rejected').length;
    const elReceived = document.getElementById('stat-received');
    if (elReceived) elReceived.textContent = total;
    
    const elPending = document.getElementById('stat-pending');
    if (elPending) elPending.textContent = pending;
    
    const elAccepted = document.getElementById('stat-accepted');
    if (elAccepted) elAccepted.textContent = accepted;
    
    const elRejected = document.getElementById('stat-rejected');
    if (elRejected) elRejected.textContent = rejected;
    
    const elReqCount = document.getElementById('requests-count');
    if (elReqCount) elReqCount.textContent = requests.filter(r => r.status === 'pending').length;
}

function renderRequests(requests) {
    const tbody = document.getElementById('requests-tbody');
    tbody.innerHTML = '';
    
    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-20">No requests found.</td></tr>';
        return;
    }
    
    requests.forEach(r => {
        const statusBadge = `<span class="status-badge ${r.status}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>`;
        
        let actions = `
            ${r.status !== 'accepted' ? `<button class="action-btn accept" title="Accept" onclick="handleAvailabilityRequest('${r.id}', 'accepted')"><i class="fas fa-check"></i></button>` : ''}
            ${r.status !== 'declined' && r.status !== 'rejected' ? `<button class="action-btn reject" title="Reject" onclick="handleAvailabilityRequest('${r.id}', 'declined')"><i class="fas fa-times"></i></button>` : ''}
            ${r.status !== 'pending' ? `<button class="action-btn" title="Set Pending" onclick="handleAvailabilityRequest('${r.id}', 'pending')"><i class="fas fa-clock"></i></button>` : ''}
            <button class="action-btn reject" title="Delete" onclick="deleteAvailabilityRequest('${r.id}')"><i class="fas fa-trash"></i></button>
            <button class="action-btn" title="View Details" onclick="viewDetails('${r.id}', 'request')"><i class="fas fa-eye"></i></button>
        `;
        
        const tr = document.createElement('tr');
        const contactInfo = [r.email, r.phone].filter(Boolean).join('<br>');
        tr.innerHTML = `
            <td>
                <strong>${r.patient}</strong>
                ${contactInfo ? `<br><small class="text-secondary">${contactInfo}</small>` : ''}
            </td>
            <td>${statusBadge}</td>
            <td>${r.date} <br> <small class="text-secondary">${r.time}</small></td>
            <td>${r.type}</td>
            <td>${r.notes}</td>
            <td class="action-buttons">${actions}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCurrentAvailability(data) {
    const tbody = document.getElementById('current-availability-tbody');
    tbody.innerHTML = '';
    
    const daysMap = {
        'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
        'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
    };
    
    Object.keys(daysMap).forEach(day => {
        const isAvail = data.days && data.days.includes(day);
        const tr = document.createElement('tr');
        
        const statusBadge = isAvail 
            ? `<span class="status-badge available">Available</span>` 
            : `<span class="status-badge unavailable">Unavailable</span>`;
            
        const timeStr = isAvail ? `${data.startTime} - ${data.endTime}` : '-';
        
        tr.innerHTML = `
            <td><strong>${daysMap[day]}</strong></td>
            <td>${statusBadge}</td>
            <td>${timeStr}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.handleAvailabilityRequest = function(requestId, newStatus) {
    const allRequests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
    const reqIndex = allRequests.findIndex(r => String(r.id) === String(requestId));
    
    if (reqIndex !== -1) {
        allRequests[reqIndex].status = newStatus;
        localStorage.setItem('appointmentRequests', JSON.stringify(allRequests));
        
        if (newStatus === 'accepted') {
            const req = allRequests[reqIndex];
            
            // Avoid duplicates in doctorAppointments
            const doctorAppointments = JSON.parse(localStorage.getItem('doctorAppointments') || '[]');
            if (!doctorAppointments.some(a => String(a.id) === String(req.id))) {
                doctorAppointments.push({
                    id: req.id,
                    patientName: req.patientName || (req.patient && req.patient.name) || 'Unknown Patient',
                    date: req.date,
                    time: req.time,
                    type: req.type,
                    status: 'confirmed'
                });
                localStorage.setItem('doctorAppointments', JSON.stringify(doctorAppointments));
            }
            
            showStyledMessage('Request successfully accepted.', 'success');
        } else if (newStatus === 'declined') {
            showStyledMessage('Request rejected.', 'info');
        } else if (newStatus === 'pending') {
            showStyledMessage('Request set back to pending.', 'info');
        }
        
        // Reload dashboard data on this page
        loadDashboardData();
    }
};

window.deleteAvailabilityRequest = function(requestId) {
    showConfirmModal(
        'Confirm Deletion',
        'Are you sure you want to delete this appointment? It will be moved to history.',
        'danger',
        () => {
            let allRequests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
            const reqIndex = allRequests.findIndex(r => String(r.id) === String(requestId));
            
            if (reqIndex !== -1) {
                const deletedReq = allRequests[reqIndex];
                deletedReq.status = 'cancelled'; // Mark as cancelled for history
                deletedReq.source = 'request';
                
                // Add to History
                const history = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
                history.push(deletedReq);
                localStorage.setItem('appointmentHistory', JSON.stringify(history));
                
                // Remove from active requests
                allRequests.splice(reqIndex, 1);
                localStorage.setItem('appointmentRequests', JSON.stringify(allRequests));
                
                showStyledMessage('Request deleted and archived.', 'success');
                loadDashboardData();
            }
        }
    );
};

// Helper for confirmation modal
function showConfirmModal(title, message, type, onConfirm) {
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.5); z-index: 10001;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.3s ease;
    `;
    
    const card = document.createElement('div');
    card.style.cssText = `
        background: var(--card-bg, #ffffff); border-radius: 12px;
        padding: 24px; max-width: 400px; width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        transform: translateY(20px); transition: all 0.3s ease;
        border: 1px solid var(--border-color, #e0e0e0);
        color: var(--text-primary, #333);
    `;
    
    const iconColor = type === 'danger' ? '#dc3545' : 'var(--accent-color, #2da0a8)';
    const iconClass = type === 'danger' ? 'fa-exclamation-triangle' : 'fa-question-circle';
    const confirmBtnColor = type === 'danger' ? '#dc3545' : 'var(--accent-color, #2da0a8)';
    
    card.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <i class="fas ${iconClass}" style="color: ${iconColor}; font-size: 24px; margin-right: 12px;"></i>
            <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${title}</h3>
        </div>
        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; color: var(--text-secondary, #666);">
            ${message}
        </p>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button id="modal-cancel-btn" style="
                padding: 8px 16px; border: 1px solid var(--border-color, #ccc);
                background: transparent; border-radius: 6px; cursor: pointer;
                color: var(--text-primary, #333); font-weight: 500; transition: background 0.2s;
            ">Cancel</button>
            <button id="modal-confirm-btn" style="
                padding: 8px 16px; border: none; background: ${confirmBtnColor};
                color: white; border-radius: 6px; cursor: pointer; font-weight: 500;
                transition: opacity 0.2s;
            ">Confirm</button>
        </div>
    `;
    
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
    
    // Animate in
    setTimeout(() => {
        backdrop.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 10);
    
    const closeModal = () => {
        backdrop.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => backdrop.remove(), 300);
    };
    
    document.getElementById('modal-cancel-btn').onclick = closeModal;
    document.getElementById('modal-confirm-btn').onclick = () => {
        closeModal();
        onConfirm();
    };
}

function renderSentInvitations(invitations) {
    const tbody = document.getElementById('sent-invitations-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const countEl = document.getElementById('sent-invitations-count');
    if (countEl) countEl.textContent = invitations.length;
    
    if (invitations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4">No invitations sent.</td></tr>`;
        return;
    }
    
    invitations.forEach(inv => {
        let statusBadge = '';
        switch(inv.status) {
            case 'pending': statusBadge = `<span class="status-badge" style="background: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; font-weight: 500;">Pending</span>`; break;
            case 'accepted': statusBadge = `<span class="status-badge" style="background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; font-weight: 500;">Accepted</span>`; break;
            case 'declined': statusBadge = `<span class="status-badge" style="background: #f8d7da; color: #721c24; padding: 4px 8px; border-radius: 4px; font-weight: 500;">Declined</span>`; break;
            default: statusBadge = `<span class="status-badge">${inv.status}</span>`;
        }
        
        let actions = `
            ${inv.status !== 'accepted' ? `<button class="action-btn accept" title="Mark Accepted" onclick="handleSentInvitation('${inv.id}', 'accepted')"><i class="fas fa-check"></i></button>` : ''}
            ${inv.status !== 'declined' && inv.status !== 'rejected' ? `<button class="action-btn reject" title="Mark Declined" onclick="handleSentInvitation('${inv.id}', 'declined')"><i class="fas fa-times"></i></button>` : ''}
            ${inv.status !== 'pending' ? `<button class="action-btn" title="Set Back to Pending" onclick="handleSentInvitation('${inv.id}', 'pending')"><i class="fas fa-clock"></i></button>` : ''}
            <button class="action-btn reject" title="Delete" onclick="deleteSentInvitation('${inv.id}')"><i class="fas fa-trash"></i></button>
            <button class="action-btn" title="View Details" onclick="viewDetails('${inv.id}', 'invitation')"><i class="fas fa-eye"></i></button>
        `;
        
        const tr = document.createElement('tr');
        const pName = inv.patient ? inv.patient.name : (inv.patientName || 'Unknown Patient');
        tr.innerHTML = `
            <td><strong>${pName}</strong></td>
            <td>${statusBadge}</td>
            <td>${inv.date} <br> <small class="text-secondary">${inv.time}</small></td>
            <td>${inv.type || 'Consultation'}</td>
            <td>${inv.notes || '-'}</td>
            <td class="action-buttons">${actions}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.handleSentInvitation = function(invId, newStatus) {
    let sentInvitations = JSON.parse(localStorage.getItem('sentInvitations') || '[]');
    const invIndex = sentInvitations.findIndex(i => String(i.id) === String(invId));
    
    if (invIndex !== -1) {
        sentInvitations[invIndex].status = newStatus;
        localStorage.setItem('sentInvitations', JSON.stringify(sentInvitations));
        
        if (newStatus === 'accepted') {
            showStyledMessage('Invitation marked as accepted.', 'success');
        } else if (newStatus === 'declined') {
            showStyledMessage('Invitation marked as declined.', 'info');
        } else if (newStatus === 'pending') {
            showStyledMessage('Invitation set back to pending.', 'info');
        }
        
        loadDashboardData();
    }
};

window.deleteSentInvitation = function(invId) {
    showConfirmModal(
        'Confirm Deletion',
        'Are you sure you want to delete this appointment? It will be moved to history.',
        'danger',
        () => {
            let sentInvitations = JSON.parse(localStorage.getItem('sentInvitations') || '[]');
            const invIndex = sentInvitations.findIndex(i => String(i.id) === String(invId));
            
            if (invIndex !== -1) {
                const deletedInv = sentInvitations[invIndex];
                deletedInv.status = 'cancelled'; // Mark as cancelled
                deletedInv.source = 'invitation';
                
                // Add to History
                const history = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
                history.push(deletedInv);
                localStorage.setItem('appointmentHistory', JSON.stringify(history));
                
                sentInvitations.splice(invIndex, 1);
                localStorage.setItem('sentInvitations', JSON.stringify(sentInvitations));
                
                showStyledMessage('Invitation deleted and archived.', 'success');
                loadDashboardData();
            }
        }
    );
};

function renderCurrentAvailability(saved) {
    const tbody = document.getElementById('current-availability-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!saved || !saved.days || saved.days.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center p-20">No availability configured.</td></tr>`;
        return;
    }
    
    const daysMap = {
        'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
        'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
    };
    
    saved.days.forEach(day => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${daysMap[day] || day}</strong></td>
            <td><span class="status-badge" style="background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; font-weight: 500;">Available</span></td>
            <td>${saved.startTime} - ${saved.endTime}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.viewDetails = function(id, source) {
    let list = [];
    if (source === 'request') {
        list = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
    } else if (source === 'invitation') {
        list = JSON.parse(localStorage.getItem('sentInvitations') || '[]');
    } else {
        list = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
    }
    
    const item = list.find(i => String(i.id) === String(id));
    if (!item) return;

    const pName = item.patient ? item.patient.name : (item.patientName || 'Unknown Patient');
    const pEmail = item.email || (item.patient && item.patient.email) || '-';
    const pPhone = item.phone || (item.patient && item.patient.phone) || '-';
    
    const title = source === 'request' ? 'Request Details' : (source === 'invitation' ? 'Invitation Details' : 'Archive Details');
    const typeLabel = item.type || 'Consultation';
    const statusLabel = item.status === 'pending' ? 'Pending' : (item.status === 'accepted' ? 'Accepted' : (item.status === 'declined' || item.status === 'rejected' ? 'Declined' : (item.status === 'cancelled' ? 'Cancelled' : item.status)));
    const dateLabel = item.date || '-';
    const timeLabel = item.time || '-';
    const notesLabel = item.notes || item.reason || 'No additional notes';

    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.5); z-index: 10001;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.3s ease;
    `;
    
    const card = document.createElement('div');
    card.style.cssText = `
        background: var(--card-bg, #ffffff); border-radius: 12px;
        padding: 24px; max-width: 500px; width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        transform: translateY(20px); transition: all 0.3s ease;
        border: 1px solid var(--border-color, #e0e0e0);
        color: var(--text-primary, #333);
        font-size: 15px;
    `;
    
    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
            <h3 style="margin: 0; font-size: 20px; color: var(--accent-color); display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-info-circle"></i> ${title}
            </h3>
            <button id="close-modal-x" style="background: none; border: none; cursor: pointer; font-size: 20px; color: var(--text-secondary);">&times;</button>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between;">
                <strong style="color: var(--text-secondary); width: 120px;">Patient:</strong> 
                <span style="flex: 1; font-weight: 600;">${pName}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <strong style="color: var(--text-secondary); width: 120px;">Contact:</strong> 
                <span style="flex: 1;">${pEmail} <br> ${pPhone}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <strong style="color: var(--text-secondary); width: 120px;">Status:</strong> 
                <span style="flex: 1; font-weight: 600; color: var(--accent-color);">${statusLabel}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <strong style="color: var(--text-secondary); width: 120px;">Date & Time:</strong> 
                <span style="flex: 1;">${dateLabel} at ${timeLabel}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <strong style="color: var(--text-secondary); width: 120px;">Type:</strong> 
                <span style="flex: 1;">${typeLabel}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 5px; background: var(--bg-secondary); padding: 12px; border-radius: 8px;">
                <strong style="color: var(--text-secondary);">Notes:</strong>
                <span>${notesLabel}</span>
            </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end;">
            <button id="close-modal-btn" style="
                padding: 10px 20px; border: none; background: var(--accent-color);
                color: white; border-radius: 6px; cursor: pointer; font-weight: 600;
                transition: opacity 0.2s;
            ">Close</button>
        </div>
    `;
    
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
    
    // Animate in
    setTimeout(() => {
        backdrop.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 10);
    
    const closeModal = () => {
        backdrop.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => backdrop.remove(), 300);
    };
    
    document.getElementById('close-modal-x').onclick = closeModal;
    document.getElementById('close-modal-btn').onclick = closeModal;
}
