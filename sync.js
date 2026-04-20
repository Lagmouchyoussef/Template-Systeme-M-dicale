/**
 * ═══════════════════════════════════════════════════════════════════
 * MediSync — sync.js
 * Central synchronization file between Login, Patient and Doctor
 * ═══════════════════════════════════════════════════════════════════
 *
 * This file handles:
 *  1. User session (read / write / delete)
 *  2. Secure redirections based on role
 *  3. Real-time sidebar update (name, avatar)
 *  4. Shared data: appointments, invitations, emails
 *  5. Common helpers used by all pages
 */

// ═══════════════════════════════════════════════════════════════════
// 1. SESSION KEYS (single source of truth)
// ═══════════════════════════════════════════════════════════════════
const SESSION_KEYS = {
    role:      'userRole',
    userId:    'userId',
    userName:  'userName',
    firstName: 'firstName',
    lastName:  'lastName',
    email:     'email',
    avatar:    'userAvatar',
    theme:     'theme',
};

const DATA_KEYS = {
    accounts:          'medisync_accounts',
    registeredPatients:'registeredPatients',
    registeredDoctors: 'registeredDoctors',
    sentInvitations:   'sentInvitations',
    sentEmails:        'sentEmails',
    patientAppts:      'patientAppointments',
};

// ═══════════════════════════════════════════════════════════════════
// 2. SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/** Returns the complete session object from localStorage */
function getSession() {
    return {
        role:      localStorage.getItem(SESSION_KEYS.role)      || null,
        userId:    localStorage.getItem(SESSION_KEYS.userId)    || null,
        userName:  localStorage.getItem(SESSION_KEYS.userName)  || '',
        firstName: localStorage.getItem(SESSION_KEYS.firstName) || '',
        lastName:  localStorage.getItem(SESSION_KEYS.lastName)  || '',
        email:     localStorage.getItem(SESSION_KEYS.email)     || '',
        avatar:    localStorage.getItem(SESSION_KEYS.avatar)    || null,
    };
}

/** Writes a complete session to localStorage */
function setSession(account) {
    const isValid = (v) => v !== undefined && v !== null && v !== 'undefined' && v !== 'null';
    
    const fName = isValid(account.firstName) ? account.firstName : '';
    const lName = isValid(account.lastName) ? account.lastName : '';
    const fullName = `${fName} ${lName}`.trim() || 'User';

    if (isValid(account.role)) localStorage.setItem(SESSION_KEYS.role, account.role);
    if (isValid(account.userId)) localStorage.setItem(SESSION_KEYS.userId, account.userId);
    if (isValid(fName)) localStorage.setItem(SESSION_KEYS.firstName, fName);
    if (isValid(lName)) localStorage.setItem(SESSION_KEYS.lastName, lName);
    localStorage.setItem(SESSION_KEYS.userName, fullName);
    if (isValid(account.email)) localStorage.setItem(SESSION_KEYS.email, account.email);
}

/** Deletes all session keys (logout) */
function clearSession() {
    Object.values(SESSION_KEYS).forEach(key => {
        if (key !== SESSION_KEYS.theme) { // keep theme
            localStorage.removeItem(key);
        }
    });
}

// ═══════════════════════════════════════════════════════════════════
// 3. AUTH GUARD — automatic redirection based on role
// ═══════════════════════════════════════════════════════════════════

/**
 * Protects a page: if the role doesn't match, redirect.
 * @param {'patient'|'doctor'} expectedRole
 */
function requireRole(expectedRole) {
    const role = localStorage.getItem(SESSION_KEYS.role);
    if (!role || (role !== expectedRole && !(expectedRole === 'doctor' && role === 'medecin'))) {
        window.location.replace(getRootPath() + 'login/index.html');
        return false;
    }
    return true;
}

/** Helper to get relative path to root */
function getRootPath() {
    const path = window.location.pathname;
    // If we are in a subdirectory (doctor, patient, login), we need to go up one level
    if (path.includes('/doctor/') || path.includes('/patient/') || path.includes('/login/')) {
        return '../';
    }
    return './';
}

/**
 * Redirects to the correct dashboard based on stored role.
 * Used from the login page after successful connection.
 */
function redirectToDashboard(role) {
    const root = getRootPath();
    if (role === 'doctor' || role === 'medecin') {
        window.location.href = root + 'doctor/doctor-dashboard.html';
    } else if (role === 'patient') {
        window.location.href = root + 'patient/patient.html';
    } else {
        window.location.href = root + 'login/index.html';
    }
}

/** Logout: clears the session and returns to login */
function logout() {
    clearSession();
    window.location.href = getRootPath() + 'login/index.html';
}

// ═══════════════════════════════════════════════════════════════════
// 4. SIDEBAR — name and avatar update
// ═══════════════════════════════════════════════════════════════════

/** Updates the name displayed in the sidebar */
function syncSidebarName() {
    const session = getSession();
    const nameEl = document.querySelector('.patient-info h4, .doctor-info h4, .sidebar .user-name');
    if (nameEl) {
        nameEl.textContent = session.userName;
    }
    const roleEl = document.querySelector('.patient-info p, .doctor-info p, .sidebar .user-email');
    if (roleEl && session.role) {
        roleEl.textContent = (session.role === 'doctor' || session.role === 'medecin') ? 'Doctor Portal' : 'Patient Portal';
    }
}

/** Generates initials from full name */
function getInitials(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    return ((parts[0] ? parts[0].charAt(0) : '') + (parts[1] ? parts[1].charAt(0) : ''));
}

/** Updates the avatar in the sidebar (image or initials) */
function syncSidebarAvatar() {
    const session = getSession();
    const avatarEl = document.querySelector('.avatar-img');
    if (!avatarEl) return;

    avatarEl.innerHTML = '';
    if (session.avatar) {
        const img = document.createElement('img');
        img.src = session.avatar;
        img.alt = 'Avatar';
        avatarEl.appendChild(img);
    } else {
        const initials = getInitials(session.userName).toUpperCase();
        const span = document.createElement('span');
        span.textContent = initials;
        avatarEl.appendChild(span);
    }
}

/** Synchronizes the entire sidebar (name + avatar) */
function syncSidebar() {
    syncSidebarName();
    syncSidebarAvatar();
}

// ═══════════════════════════════════════════════════════════════════
// 5. SHARED DATA — accounts, invitations, appointments
// ═══════════════════════════════════════════════════════════════════

// --- User accounts ---
function getAccounts() {
    return JSON.parse(localStorage.getItem(DATA_KEYS.accounts) || '[]');
}
function saveAccounts(accounts) {
    localStorage.setItem(DATA_KEYS.accounts, JSON.stringify(accounts));
}
function findAccount(email, password) {
    return getAccounts().find(a => a.email === email && a.password === password) || null;
}
function accountExists(email) {
    return getAccounts().some(a => a.email === email);
}
function createAccount(data) {
    const userId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const account = { userId, ...data };
    const accounts = getAccounts();
    accounts.push(account);
    saveAccounts(accounts);
    return account;
}

// --- Directories (patients/doctors) ---
function addToDirectory(account) {
    const name = `${account.firstName} ${account.lastName}`.trim();
    if (account.role === 'patient') {
        const list = JSON.parse(localStorage.getItem(DATA_KEYS.registeredPatients) || '[]');
        if (!list.some(p => p.email === account.email)) {
            list.push({ id: account.userId, name, email: account.email, phone: account.phone || '' });
            localStorage.setItem(DATA_KEYS.registeredPatients, JSON.stringify(list));
        }
    } else if (account.role === 'medecin' || account.role === 'doctor') {
        const list = JSON.parse(localStorage.getItem(DATA_KEYS.registeredDoctors) || '[]');
        if (!list.some(d => d.email === account.email)) {
            list.push({ id: account.userId, name, email: account.email });
            localStorage.setItem(DATA_KEYS.registeredDoctors, JSON.stringify(list));
        }
    }
}

// --- Invitations (Doctor → Patient) ---
function getSentInvitations() {
    return JSON.parse(localStorage.getItem(DATA_KEYS.sentInvitations) || '[]');
}
function saveSentInvitations(list) {
    localStorage.setItem(DATA_KEYS.sentInvitations, JSON.stringify(list));
}

/** Returns invitations for a specific patient */
function getPatientInvitations(patientId) {
    const key = `patient_${patientId}_invitations`;
    return JSON.parse(localStorage.getItem(key) || '[]');
}
function savePatientInvitations(patientId, list) {
    const key = `patient_${patientId}_invitations`;
    localStorage.setItem(key, JSON.stringify(list));
}

/** Updates invitation status on patient side */
function updateInvitationStatus(patientId, invitationId, newStatus) {
    let invitations = getPatientInvitations(patientId);
    invitations = invitations.map(inv =>
        inv.id === invitationId ? { ...inv, status: newStatus } : inv
    );
    savePatientInvitations(patientId, invitations);

    // If accepted → add to patient appointments
    if (newStatus === 'accepted') {
        const inv = invitations.find(i => i.id === invitationId);
        if (inv) addPatientAppointment(inv);
    }

    // Also update doctor list
    let sent = getSentInvitations();
    sent = sent.map(inv =>
        inv.id === invitationId ? { ...inv, status: newStatus } : inv
    );
    saveSentInvitations(sent);
}

// --- Patient appointments ---
function getPatientAppointments() {
    return JSON.parse(localStorage.getItem(DATA_KEYS.patientAppts) || '[]');
}
function addPatientAppointment(invitation) {
    const appointments = getPatientAppointments();
    if (!appointments.some(a => a.id === invitation.id)) {
        appointments.push({
            id:     invitation.id,
            doctor: invitation.doctor?.name || invitation.doctorName || '',
            date:   invitation.date,
            time:   invitation.time,
            type:   invitation.type,
            status: 'confirmed',
            notes:  invitation.notes || '',
        });
        localStorage.setItem(DATA_KEYS.patientAppts, JSON.stringify(appointments));
    }
}

// --- Emails ---
function getSentEmails() {
    return JSON.parse(localStorage.getItem(DATA_KEYS.sentEmails) || '[]');
}
function getEmailsForPatient(patientEmail) {
    return getSentEmails().filter(e => e.to === patientEmail);
}

// ═══════════════════════════════════════════════════════════════════
// 6. THEME — synchronized across all pages
// ═══════════════════════════════════════════════════════════════════

function applyTheme() {
    const theme = localStorage.getItem(SESSION_KEYS.theme) || 'light';
    if (theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
    }
}

function initThemeToggle() {
    applyTheme();
    const toggle = document.getElementById('theme-switch');
    if (!toggle) return;

    toggle.checked = (localStorage.getItem(SESSION_KEYS.theme) === 'dark');
    toggle.addEventListener('change', function () {
        const newTheme = this.checked ? 'dark' : 'light';
        localStorage.setItem(SESSION_KEYS.theme, newTheme);
        applyTheme();
    });
}

// ═══════════════════════════════════════════════════════════════════
// 7. TOAST NOTIFICATIONS (shared)
// ═══════════════════════════════════════════════════════════════════

function showToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('sync-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'sync-toast-container';
        container.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            z-index: 99999; max-width: 380px; pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const colors = {
        success: { bg: '#d4edda', border: '#28a745', text: '#155724', icon: 'check-circle' },
        error:   { bg: '#f8d7da', border: '#dc3545', text: '#721c24', icon: 'exclamation-triangle' },
        warning: { bg: '#fff3cd', border: '#ffc107', text: '#856404', icon: 'exclamation-circle' },
        info:    { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460', icon: 'info-circle' },
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${c.bg}; border-left: 4px solid ${c.border}; color: ${c.text};
        border-radius: 10px; padding: 14px 18px; margin-bottom: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.12); pointer-events: auto;
        display: flex; align-items: center; gap: 10px;
        transform: translateX(120%); opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
    `;
    toast.innerHTML = `
        <i class="fas fa-${c.icon}" style="font-size:16px;flex-shrink:0"></i>
        <span style="flex:1;font-size:13px;line-height:1.4">${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:${c.text};cursor:pointer;font-size:16px;padding:0;opacity:.7">&times;</button>
    `;
    container.appendChild(toast);

    // Animate entrance
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity   = '1';
    });

    // Auto-remove
    if (duration > 0) {
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity   = '0';
            setTimeout(() => toast.remove(), 350);
        }, duration);
    }
}

// ═══════════════════════════════════════════════════════════════════
// 8. LOGOUT BUTTON — initialization on all pages
// ═══════════════════════════════════════════════════════════════════

function initLogoutButtons() {
    document.querySelectorAll('.logout-btn, [data-action="logout"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });
}

// ═══════════════════════════════════════════════════════════════════
// 9. AUTO-INIT — runs on all pages that load sync.js
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    syncSidebar();
    initThemeToggle();
    initLogoutButtons();

    // Listen for localStorage changes from other tabs
    window.addEventListener('storage', (e) => {
        if ([SESSION_KEYS.userName, SESSION_KEYS.firstName, SESSION_KEYS.lastName, SESSION_KEYS.avatar].includes(e.key)) {
            syncSidebar();
        }
        if (e.key === SESSION_KEYS.theme) {
            applyTheme();
        }
    });
});
