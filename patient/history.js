// ── Auth Guard ─────────────────────────────────────────────────────────────
(function() {
    const role = localStorage.getItem('userRole');
    if (!role || role !== 'patient') {
        window.location.replace('/login');
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
    if (duration > 0) setTimeout(() => { if(messageCard.parentElement){ messageCard.style.transform = 'translateX(100%)'; messageCard.style.opacity = '0'; setTimeout(() => messageCard.remove(), 300); } }, duration);
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
            ">Annuler</button>
            <button id="modal-confirm-btn" style="
                padding: 8px 16px; border: none; background: ${confirmBtnColor};
                color: white; border-radius: 6px; cursor: pointer; font-weight: 500;
                transition: opacity 0.2s;
            ">Confirmer</button>
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
                window.location.href = `${page}.html`;
            }
        });
    });

    // Cross-tab sync
    window.addEventListener('storage', (e) => {
        if (e.key === 'appointmentRequests' || e.key === 'sentInvitations' || e.key === 'doctorAppointments') {
            loadDashboardData();
        }
    });
});

function loadDashboardData() {
    const patientId = localStorage.getItem('userId') || '';
    const patientEmail = (localStorage.getItem('email') || '').trim().toLowerCase();
    const patientName = (localStorage.getItem('userName') || '').trim().toLowerCase();

    // 1. Appointment Archives
    let archives = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
    // Filter for current patient
    const myArchives = archives.filter(a => {
        const appId = a.patientId || (a.patient ? a.patient.id : '') || '';
        const appName = (a.patientName || (a.patient ? a.patient.name : '') || '').trim().toLowerCase();
        const appEmail = (a.patientEmail || a.email || (a.patient ? a.patient.email : '') || '').trim().toLowerCase();
        
        return (patientId !== '' && appId === patientId) || 
               (patientName !== '' && appName.includes(patientName)) ||
               (patientEmail !== '' && appEmail === patientEmail);
    });
    renderArchives(myArchives);
    
    // 2. Notification Archives
    let notificationArchives = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
    // Filter by patient ID or generic matching
    const myNotifArchives = notificationArchives.filter(n => n.recipientId === patientId || n.target === 'patient' || !n.recipientId);
    renderNotificationArchives(myNotifArchives);
    
    // 3. Email Archives
    let emailArchives = JSON.parse(localStorage.getItem('emailHistory') || '[]');
    // Filter by email
    const myEmailArchives = emailArchives.filter(e => (e.recipient || '').toLowerCase() === patientEmail);
    renderEmailArchives(myEmailArchives);
}

function renderArchives(archives) {
    const requestsTbody = document.getElementById('archives-requests-tbody');
    const invitationsTbody = document.getElementById('archives-invitations-tbody');
    
    if (!requestsTbody || !invitationsTbody) return;
    
    requestsTbody.innerHTML = '';
    invitationsTbody.innerHTML = '';
    
    const archivedRequests = archives.filter(a => a.source !== 'invitation');
    const archivedInvitations = archives.filter(a => a.source === 'invitation');
    
    const reqCountEl = document.getElementById('archives-requests-count');
    if (reqCountEl) reqCountEl.textContent = archivedRequests.length;
    
    const invCountEl = document.getElementById('archives-invitations-count');
    if (invCountEl) invCountEl.textContent = archivedInvitations.length;
    
    if (archivedRequests.length === 0) {
        requestsTbody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4" style="padding: 20px; text-align: center;">Aucune demande archivée.</td></tr>`;
    } else {
        archivedRequests.forEach(arc => renderArchiveRow(requestsTbody, arc));
    }
    
    if (archivedInvitations.length === 0) {
        invitationsTbody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4" style="padding: 20px; text-align: center;">Aucune invitation archivée.</td></tr>`;
    } else {
        archivedInvitations.forEach(arc => renderArchiveRow(invitationsTbody, arc));
    }
}

function renderArchiveRow(tbody, arc) {
    let statusBadge = `<span class="status-badge" style="background: #f8d7da; color: #721c24; padding: 4px 8px; border-radius: 4px; font-weight: 500;">Annulé / Archivé</span>`;
    
    let actions = `
        <button class="action-btn accept" title="Restaurer" onclick="restoreFromHistory('${arc.id}')"><i class="fas fa-undo"></i></button>
        <button class="action-btn reject" title="Supprimer définitivement" onclick="permanentlyDeleteHistory('${arc.id}')"><i class="fas fa-times"></i></button>
        <button class="action-btn" title="Voir les détails" onclick="viewDetails('${arc.id}')"><i class="fas fa-eye"></i></button>
    `;
    
    const registeredDoctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
    const getDoctorName = (id) => {
        const d = registeredDoctors.find(doc => doc.id === id || doc.userId === id);
        return d ? d.name : (arc.doctorName || 'Médecin Inconnu');
    };

    const tr = document.createElement('tr');
    const docName = getDoctorName(arc.doctorId || arc.doctor);
    
    tr.innerHTML = `
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;"><strong>Dr. ${docName}</strong></td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${statusBadge}</td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">${arc.date || '-'} <br> <small>${arc.time || '-'}</small></td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">${arc.type || 'Consultation'}</td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">${arc.notes || arc.reason || '-'}</td>
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
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-4" style="padding: 20px; text-align: center;">Aucune notification archivée.</td></tr>`;
        return;
    }
    
    notifications.forEach(notif => {
        let actions = `
            <button class="action-btn accept" title="Restaurer" onclick="restoreNotification('${notif.id}')"><i class="fas fa-undo"></i></button>
            <button class="action-btn reject" title="Supprimer définitivement" onclick="permanentlyDeleteNotification('${notif.id}')"><i class="fas fa-times"></i></button>
        `;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;"><i class="fas ${notif.icon || 'fa-bell'}"></i> ${notif.type || 'Notification'}</td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">${notif.message || '-'}</td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">${notif.time || '-'}</td>
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
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-4" style="padding: 20px; text-align: center;">Aucun email archivé.</td></tr>`;
        return;
    }
    
    emails.forEach(email => {
        let actions = `
            <button class="action-btn reject" title="Supprimer définitivement" onclick="permanentlyDeleteEmail('${email.id}')"><i class="fas fa-times"></i></button>
        `;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;"><strong>${email.sender || 'MediSync'}</strong></td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">${email.subject || '-'}</td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: #6c757d;">${email.date || '-'}</td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border-color);" class="action-buttons">${actions}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.restoreNotification = function(id) {
    let archives = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
    const arcIndex = archives.findIndex(a => String(a.id) === String(id));
    
    if (arcIndex !== -1) {
        const itemToRestore = archives[arcIndex];
        itemToRestore.unread = true;
        
        let activeNotifs = JSON.parse(localStorage.getItem('notifications') || '[]');
        activeNotifs.push(itemToRestore);
        localStorage.setItem('notifications', JSON.stringify(activeNotifs));
        
        archives.splice(arcIndex, 1);
        localStorage.setItem('notificationHistory', JSON.stringify(archives));
        
        showStyledMessage('Notification restaurée avec succès.', 'success');
        loadDashboardData();
    }
};

window.permanentlyDeleteNotification = function(id) {
    showConfirmModal(
        'Supprimer la notification',
        'Voulez-vous supprimer définitivement cette notification ?',
        'danger',
        () => {
            let archives = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
            archives = archives.filter(a => String(a.id) !== String(id));
            localStorage.setItem('notificationHistory', JSON.stringify(archives));
            showStyledMessage('Notification supprimée définitivement.', 'success');
            loadDashboardData();
        }
    );
};

window.permanentlyDeleteEmail = function(id) {
    showConfirmModal(
        'Supprimer l\'email',
        'Voulez-vous supprimer définitivement cet email ?',
        'danger',
        () => {
            let archives = JSON.parse(localStorage.getItem('emailHistory') || '[]');
            archives = archives.filter(a => String(a.id) !== String(id));
            localStorage.setItem('emailHistory', JSON.stringify(archives));
            showStyledMessage('Email supprimé définitivement.', 'success');
            loadDashboardData();
        }
    );
};

window.restoreFromHistory = function(id) {
    showConfirmModal(
        'Restaurer un élément', 
        'Voulez-vous restaurer cet élément pour le remettre dans votre tableau principal ?', 
        'info', 
        () => {
            let archives = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
            const arcIndex = archives.findIndex(a => String(a.id) === String(id));
            
            if (arcIndex !== -1) {
                const itemToRestore = archives[arcIndex];
                itemToRestore.status = 'pending';
                
                if (itemToRestore.source === 'invitation') {
                    const patientId = localStorage.getItem('userId');
                    const invitationsKey = `patient_${patientId}_invitations`;
                    let invitations = JSON.parse(localStorage.getItem(invitationsKey) || '[]');
                    invitations.push(itemToRestore);
                    localStorage.setItem(invitationsKey, JSON.stringify(invitations));
                } else {
                    let requests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
                    requests.push(itemToRestore);
                    localStorage.setItem('appointmentRequests', JSON.stringify(requests));
                }
                
                archives.splice(arcIndex, 1);
                localStorage.setItem('appointmentHistory', JSON.stringify(archives));
                
                showStyledMessage('Élément restauré avec succès.', 'success');
                loadDashboardData();
            }
        }
    );
};

window.permanentlyDeleteHistory = function(id) {
    showConfirmModal(
        'Suppression définitive', 
        'Voulez-vous supprimer définitivement cet élément ?', 
        'danger', 
        () => {
            let archives = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
            const arcIndex = archives.findIndex(a => String(a.id) === String(id));
            
            if (arcIndex !== -1) {
                archives.splice(arcIndex, 1);
                localStorage.setItem('appointmentHistory', JSON.stringify(archives));
                
                showStyledMessage('Élément supprimé définitivement.', 'success');
                loadDashboardData();
            }
        }
    );
};

window.viewDetails = function(id) {
    const list = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
    const item = list.find(i => String(i.id) === String(id));
    if (!item) return;

    const registeredDoctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
    const doc = registeredDoctors.find(d => d.id === (item.doctorId || item.doctor));
    const docName = doc ? doc.name : (item.doctorName || 'Médecin Inconnu');
    
    const title = 'Détails de l\'Archive';
    const typeLabel = item.type || 'Consultation';
    const statusLabel = 'Archivé';
    const dateLabel = item.date || '-';
    const timeLabel = item.time || '-';
    const notesLabel = item.notes || item.reason || 'Aucune note supplémentaire';

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
                <strong style="color: var(--text-secondary); width: 120px;">Médecin:</strong> 
                <span style="flex: 1; font-weight: 600;">Dr. ${docName}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <strong style="color: var(--text-secondary); width: 120px;">Statut:</strong> 
                <span style="flex: 1; font-weight: 600; color: #dc3545;">${statusLabel}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <strong style="color: var(--text-secondary); width: 120px;">Date & Heure:</strong> 
                <span style="flex: 1;">${dateLabel} à ${timeLabel}</span>
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
            ">Fermer</button>
        </div>
    `;
    
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
    
    setTimeout(() => { backdrop.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, 10);
    
    const closeModal = () => {
        backdrop.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => backdrop.remove(), 300);
    };
    
    document.getElementById('close-view-x').onclick = closeModal;
    document.getElementById('close-view-btn').onclick = closeModal;
};

