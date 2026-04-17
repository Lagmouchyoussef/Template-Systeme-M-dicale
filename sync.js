/**
 * ═══════════════════════════════════════════════════════════════════
 * MediSync — sync.js
 * Fichier de synchronisation central entre Login, Patient et Doctor
 * ═══════════════════════════════════════════════════════════════════
 *
 * Ce fichier gère :
 *  1. La session utilisateur (lecture / écriture / suppression)
 *  2. Les redirections sécurisées selon le rôle
 *  3. La mise à jour temps-réel de la sidebar (nom, avatar)
 *  4. Les données partagées : rendez-vous, invitations, emails
 *  5. Les helpers communs utilisés par toutes les pages
 */

// ═══════════════════════════════════════════════════════════════════
// 1. CLÉS DE SESSION (source unique de vérité)
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
// 2. GESTION DE SESSION
// ═══════════════════════════════════════════════════════════════════

/** Retourne l'objet session complet depuis le localStorage */
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

/** Écrit une session complète dans le localStorage */
function setSession(account) {
    const fullName = `${account.firstName} ${account.lastName}`.trim();
    localStorage.setItem(SESSION_KEYS.role,      account.role);
    localStorage.setItem(SESSION_KEYS.userId,    account.userId);
    localStorage.setItem(SESSION_KEYS.firstName, account.firstName);
    localStorage.setItem(SESSION_KEYS.lastName,  account.lastName);
    localStorage.setItem(SESSION_KEYS.userName,  fullName);
    localStorage.setItem(SESSION_KEYS.email,     account.email);
}

/** Supprime toutes les clés de session (logout) */
function clearSession() {
    Object.values(SESSION_KEYS).forEach(key => {
        if (key !== SESSION_KEYS.theme) { // garder le thème
            localStorage.removeItem(key);
        }
    });
}

// ═══════════════════════════════════════════════════════════════════
// 3. AUTH GUARD — redirection automatique selon le rôle
// ═══════════════════════════════════════════════════════════════════

/**
 * Protège une page : si le rôle ne correspond pas, redirige.
 * @param {'patient'|'medecin'} expectedRole
 */
function requireRole(expectedRole) {
    const role = localStorage.getItem(SESSION_KEYS.role);
    if (!role || role !== expectedRole) {
        window.location.replace('/login');
        return false;
    }
    return true;
}

/**
 * Redirige vers le bon dashboard selon le rôle stocké.
 * Utilisé depuis la page de login après connexion réussie.
 */
function redirectToDashboard(role) {
    if (role === 'medecin') {
        window.location.href = '/doctor/doctor.html';
    } else if (role === 'patient') {
        window.location.href = '/patient/patient.html';
    } else {
        window.location.href = '/login';
    }
}

/** Déconnexion : vide la session et retourne au login */
function logout() {
    clearSession();
    window.location.href = '/login';
}

// ═══════════════════════════════════════════════════════════════════
// 4. SIDEBAR — mise à jour du nom et de l'avatar
// ═══════════════════════════════════════════════════════════════════

/** Met à jour le nom affiché dans la sidebar */
function syncSidebarName() {
    const session = getSession();
    const nameEl = document.querySelector('.patient-info h4, .doctor-info h4, .sidebar .user-name');
    if (nameEl) {
        nameEl.textContent = session.userName;
    }
    const roleEl = document.querySelector('.patient-info p, .doctor-info p, .sidebar .user-email');
    if (roleEl && session.role) {
        roleEl.textContent = session.role === 'medecin' ? 'Doctor Portal' : 'Patient Portal';
    }
}

/** Génère les initiales depuis le nom complet */
function getInitials(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    return (parts[0]?.charAt(0) || '') + (parts[1]?.charAt(0) || '');
}

/** Met à jour l'avatar dans la sidebar (image ou initiales) */
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

/** Synchronise l'ensemble de la sidebar (nom + avatar) */
function syncSidebar() {
    syncSidebarName();
    syncSidebarAvatar();
}

// ═══════════════════════════════════════════════════════════════════
// 5. DONNÉES PARTAGÉES — comptes, invitations, rendez-vous
// ═══════════════════════════════════════════════════════════════════

// --- Comptes utilisateurs ---
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

// --- Annuaires (patients/médecins) ---
function addToDirectory(account) {
    const name = `${account.firstName} ${account.lastName}`.trim();
    if (account.role === 'patient') {
        const list = JSON.parse(localStorage.getItem(DATA_KEYS.registeredPatients) || '[]');
        if (!list.some(p => p.email === account.email)) {
            list.push({ id: account.userId, name, email: account.email, phone: account.phone || '' });
            localStorage.setItem(DATA_KEYS.registeredPatients, JSON.stringify(list));
        }
    } else if (account.role === 'medecin') {
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

/** Retourne les invitations destinées à un patient spécifique */
function getPatientInvitations(patientId) {
    const key = `patient_${patientId}_invitations`;
    return JSON.parse(localStorage.getItem(key) || '[]');
}
function savePatientInvitations(patientId, list) {
    const key = `patient_${patientId}_invitations`;
    localStorage.setItem(key, JSON.stringify(list));
}

/** Met à jour le statut d'une invitation côté patient */
function updateInvitationStatus(patientId, invitationId, newStatus) {
    let invitations = getPatientInvitations(patientId);
    invitations = invitations.map(inv =>
        inv.id === invitationId ? { ...inv, status: newStatus } : inv
    );
    savePatientInvitations(patientId, invitations);

    // Si acceptée → ajouter aux rendez-vous du patient
    if (newStatus === 'accepted') {
        const inv = invitations.find(i => i.id === invitationId);
        if (inv) addPatientAppointment(inv);
    }

    // Mettre à jour aussi la liste du docteur
    let sent = getSentInvitations();
    sent = sent.map(inv =>
        inv.id === invitationId ? { ...inv, status: newStatus } : inv
    );
    saveSentInvitations(sent);
}

// --- Rendez-vous patient ---
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
// 6. THÈME — synchronisé entre toutes les pages
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
// 7. NOTIFICATIONS TOAST (partagé)
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

    // Animer l'entrée
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity   = '1';
    });

    // Auto-suppression
    if (duration > 0) {
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity   = '0';
            setTimeout(() => toast.remove(), 350);
        }, duration);
    }
}

// ═══════════════════════════════════════════════════════════════════
// 8. LOGOUT BUTTON — initialisation sur toutes les pages
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
// 9. AUTO-INIT — s'exécute sur toutes les pages qui chargent sync.js
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    syncSidebar();
    initThemeToggle();
    initLogoutButtons();

    // Écouter les changements localStorage des autres onglets
    window.addEventListener('storage', (e) => {
        if ([SESSION_KEYS.userName, SESSION_KEYS.firstName, SESSION_KEYS.lastName, SESSION_KEYS.avatar].includes(e.key)) {
            syncSidebar();
        }
        if (e.key === SESSION_KEYS.theme) {
            applyTheme();
        }
    });
});
