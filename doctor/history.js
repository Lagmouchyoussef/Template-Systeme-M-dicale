// ── Auth Guard ─────────────────────────────────────────────────────────────
(function() {
    const role = localStorage.getItem('userRole');
    if (!role || (role !== 'doctor' && role !== 'medecin')) {
        window.location.replace('../login/index.html');
    }
})();

// Global function to show styled messages
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
        background: var(--card-bg, #ffffff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        pointer-events: auto;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    `;

    const colors = {
        success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724', icon: '#28a745' },
        error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', icon: '#dc3545' },
        warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404', icon: '#ffc107' },
        info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460', icon: '#17a2b8' }
    };
    const colorScheme = colors[type] || colors.info;

    messageCard.style.background = colorScheme.bg;
    messageCard.style.borderColor = colorScheme.border;
    messageCard.style.color = colorScheme.text;

    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle';

    messageCard.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <i class="fas fa-${iconName}" style="color: ${colorScheme.icon}; font-size: 18px; margin-top: 2px; flex-shrink: 0;"></i>
            <div style="flex: 1; font-size: 14px; line-height: 1.4;">${message}</div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: ${colorScheme.text}; cursor: pointer; font-size: 16px; padding: 0; margin-left: 8px; opacity: 0.7; flex-shrink: 0;">&times;</button>
        </div>
    `;
    messageContainer.appendChild(messageCard);
    setTimeout(() => { messageCard.style.transform = 'translateX(0)'; messageCard.style.opacity = '1'; }, 10);
    if (duration > 0) setTimeout(() => { messageCard.style.transform = 'translateX(100%)'; messageCard.style.opacity = '0'; setTimeout(() => messageCard.remove(), 300); }, duration);
}

// Global function to show a custom confirmation modal
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

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page && page !== 'history') {
                window.location.href = `doctor-${page}.html`;
            }
        });
    });

    // Cross-tab sync
    window.addEventListener('storage', (e) => {
        if (e.key === 'appointmentRequests' || e.key === 'sentInvitations' || e.key === 'doctorAppointments' || e.key === 'notificationHistory' || e.key === 'medisync_notifications_v1') {
            loadDashboardData();
        }
    });
});

function loadDashboardData() {
    let archives = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
    renderArchives(archives);
    
    let notificationArchives = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
    // Filter by role (doctor or medecin)
    // Fallback to showing notifications without a role to support legacy data
    const myNotificationArchives = notificationArchives.filter(n => !n.role || n.role === 'doctor' || n.role === 'medecin');
    renderNotificationArchives(myNotificationArchives);
    
    let emailArchives = JSON.parse(localStorage.getItem('emailHistory') || '[]');
    renderEmailArchives(emailArchives);
}

function renderArchives(archives) {
    const requestsTbody = document.getElementById('archives-requests-tbody');
    const invitationsTbody = document.getElementById('archives-invitations-tbody');
    
    if (!requestsTbody || !invitationsTbody) return;
    
    requestsTbody.innerHTML = '';
    invitationsTbody.innerHTML = '';
    
    const archivedRequests = archives.filter(a => a.source !== 'invitation'); // default to request if missing
    const archivedInvitations = archives.filter(a => a.source === 'invitation');
    
    const reqCountEl = document.getElementById('archives-requests-count');
    if (reqCountEl) reqCountEl.textContent = archivedRequests.length;
    
    const invCountEl = document.getElementById('archives-invitations-count');
    if (invCountEl) invCountEl.textContent = archivedInvitations.length;
    
    if (archivedRequests.length === 0) {
        requestsTbody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4" style="padding: 20px; text-align: center;">No archived requests.</td></tr>`;
    } else {
        archivedRequests.forEach(arc => renderArchiveRow(requestsTbody, arc));
    }
    
    if (archivedInvitations.length === 0) {
        invitationsTbody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4" style="padding: 20px; text-align: center;">No archived invitations.</td></tr>`;
    } else {
        archivedInvitations.forEach(arc => renderArchiveRow(invitationsTbody, arc));
    }
}

function renderArchiveRow(tbody, arc) {
    let statusBadge = `<span class="status-badge" style="background: #f8d7da; color: #721c24; padding: 4px 8px; border-radius: 4px; font-weight: 500;">Cancelled / Archived</span>`;
    
    let actions = `
        <button class="action-btn accept" title="Restore from History" onclick="restoreFromHistory('${arc.id}')"><i class="fas fa-undo"></i> Restore</button>
        <button class="action-btn reject" title="Permanently Delete" onclick="permanentlyDeleteHistory('${arc.id}')"><i class="fas fa-times"></i></button>
        <button class="action-btn" title="View Details" onclick="viewDetails('${arc.id}')"><i class="fas fa-eye"></i></button>
    `;
    
    const tr = document.createElement('tr');
    const pName = arc.patient ? arc.patient.name : (arc.patientName || 'Unknown Patient');
    tr.innerHTML = `
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;"><strong>${pName}</strong></td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${statusBadge}</td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">${arc.date || '-'} <br> <small>${arc.time || '-'}</small></td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">${arc.type || 'Consultation'}</td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">${arc.notes || '-'}</td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);" class="action-buttons">${actions}</td>
    `;
    tbody.appendChild(tr);
}

function renderNotificationArchives(notifications) {
    const tbody = document.getElementById('archives-notifications-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const countEl = document.getElementById('archives-notifications-count');
    if (countEl) countEl.textContent = notifications.length;
    
    if (notifications.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-4" style="padding: 30px; text-align: center;">
            <i class="fas fa-bell-slash" style="font-size: 24px; margin-bottom: 10px; opacity: 0.3; display: block;"></i>
            No archived notifications.
        </td></tr>`;
        return;
    }
    
    notifications.forEach(notif => {
        let actions = `
            <button class="action-btn accept" title="Restore to active" onclick="restoreNotification('${notif.id}')"><i class="fas fa-undo"></i> Restore</button>
            <button class="action-btn reject" title="Permanently Delete" onclick="permanentlyDeleteNotification('${notif.id}')"><i class="fas fa-trash-alt"></i></button>
        `;
        
        const tr = document.createElement('tr');
        const iconClass = notif.icon ? (notif.icon.startsWith('fa-') ? notif.icon : 'fa-' + notif.icon) : 'fa-bell';

        tr.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">
                <span style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas ${iconClass}" style="color: var(--accent-color);"></i> 
                    ${notif.type || 'Notification'}
                </span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: var(--text-primary);">${notif.message || '-'}</td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">
                ${notif.time || '-'} <br>
                <small style="opacity: 0.7;">Archived: ${notif.archivedAt ? new Date(notif.archivedAt).toLocaleDateString() : 'Unknown'}</small>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color);" class="action-buttons">${actions}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderEmailArchives(emails) {
    const tbody = document.getElementById('archives-emails-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const countEl = document.getElementById('archives-emails-count');
    if (countEl) countEl.textContent = emails.length;
    
    if (emails.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-4" style="padding: 20px; text-align: center;">No archived emails.</td></tr>`;
        return;
    }
    
    emails.forEach(email => {
        let actions = `
            <button class="action-btn reject" title="Permanently Delete" onclick="permanentlyDeleteEmail('${email.id}')"><i class="fas fa-times"></i></button>
        `;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;"><strong>${email.recipient || 'Unknown'}</strong></td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">${email.subject || '-'}</td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">${email.date || '-'}</td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color);" class="action-buttons">${actions}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Centralized notification management from notifications.js replaces these functions.

window.permanentlyDeleteEmail = function(id) {
    showConfirmModal(
        'Delete email',
        'Do you want to permanently delete this email? This action is irreversible.',
        'danger',
        () => {
            let archives = JSON.parse(localStorage.getItem('emailHistory') || '[]');
            archives = archives.filter(a => String(a.id) !== String(id));
            localStorage.setItem('emailHistory', JSON.stringify(archives));
            showStyledMessage('Email permanently deleted.', 'success');
            loadDashboardData();
        }
    );
};

window.restoreFromHistory = function(id) {
    showConfirmModal(
        'Restore an item', 
        'Do you want to restore this item to put it back in your main dashboard?', 
        'info', 
        () => {
            let archives = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
            const arcIndex = archives.findIndex(a => String(a.id) === String(id));
            
            if (arcIndex !== -1) {
                const itemToRestore = archives[arcIndex];
                itemToRestore.status = 'pending'; // Reset status to pending
                
                if (itemToRestore.source === 'invitation') {
                    let sentInvitations = JSON.parse(localStorage.getItem('sentInvitations') || '[]');
                    sentInvitations.push(itemToRestore);
                    localStorage.setItem('sentInvitations', JSON.stringify(sentInvitations));
                } else {
                    // Default to requests
                    let requests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
                    requests.push(itemToRestore);
                    localStorage.setItem('appointmentRequests', JSON.stringify(requests));
                }
                
                archives.splice(arcIndex, 1);
                localStorage.setItem('appointmentHistory', JSON.stringify(archives));
                
                showStyledMessage('Item successfully restored.', 'success');
                loadDashboardData();
            }
        }
    );
};

window.permanentlyDeleteHistory = function(id) {
    showConfirmModal(
        'Permanent Deletion', 
        'Do you want to permanently delete this item? This action is irreversible and it can no longer be recovered.', 
        'danger', 
        () => {
            let archives = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
            const arcIndex = archives.findIndex(a => String(a.id) === String(id));
            
            if (arcIndex !== -1) {
                archives.splice(arcIndex, 1);
                localStorage.setItem('appointmentHistory', JSON.stringify(archives));
                
                showStyledMessage('Item permanently deleted.', 'success');
                loadDashboardData();
            }
        }
    );
};

window.viewDetails = function(id) {
    const list = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
    const item = list.find(i => String(i.id) === String(id));
    if (!item) return;

    const pName = item.patient ? item.patient.name : (item.patientName || 'Unknown Patient');
    const pEmail = item.email || (item.patient && item.patient.email) || '-';
    const pPhone = item.phone || (item.patient && item.patient.phone) || '-';
    
    const title = 'Archive Details';
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
            <button id="close-view-x" style="background: none; border: none; cursor: pointer; font-size: 20px; color: var(--text-secondary);">&times;</button>
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
            <button id="close-view-btn" style="
                padding: 10px 20px; border: none; background: var(--accent-color);
                color: white; border-radius: 6px; cursor: pointer; font-weight: 600;
                transition: opacity 0.2s;
            ">Close</button>
        </div>
    `;
    
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
    
    setTimeout(() => {
        backdrop.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 10);
    
    const closeModal = () => {
        backdrop.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => backdrop.remove(), 300);
    };
    
    document.getElementById('close-view-x').onclick = closeModal;
    document.getElementById('close-view-btn').onclick = closeModal;
};
