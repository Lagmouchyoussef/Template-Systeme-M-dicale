// ── Auth Guard ─────────────────────────────────────────────────────────────
(function() {
    const role = localStorage.getItem('userRole');
    if (!role || role !== 'medecin') {
        window.location.replace('/login');
    }
})();

// Theme toggle functionality
const themeSwitch = document.getElementById('theme-switch');
const sidebarMenuItems = document.querySelectorAll('.sidebar-menu li');
const logoutBtn = document.querySelector('.logout-btn');

// Global function to show styled messages instead of alerts/console.log
function showStyledMessage(message, type = 'info', duration = 5000) {
    // Create message container if it doesn't exist
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

    // Create message card
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

    // Set colors based on type
    const colors = {
        success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724', icon: '#28a745' },
        error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', icon: '#dc3545' },
        warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404', icon: '#ffc107' },
        info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460', icon: '#17a2b8' },
        debug: { bg: '#e2e3e5', border: '#d6d8db', text: '#383d41', icon: '#6c757d' }
    };

    const colorScheme = colors[type] || colors.info;

    messageCard.style.background = colorScheme.bg;
    messageCard.style.borderColor = colorScheme.border;
    messageCard.style.color = colorScheme.text;

    // Create icon based on type
    const icons = {
        success: 'check-circle',
        error: 'exclamation-triangle',
        warning: 'exclamation-circle',
        info: 'info-circle',
        debug: 'bug'
    };

    const iconName = icons[type] || 'info-circle';

    messageCard.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <i class="fas fa-${iconName}" style="color: ${colorScheme.icon}; font-size: 18px; margin-top: 2px; flex-shrink: 0;"></i>
            <div style="flex: 1; font-size: 14px; line-height: 1.4;">
                ${message}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none;
                border: none;
                color: ${colorScheme.text};
                cursor: pointer;
                font-size: 16px;
                padding: 0;
                margin-left: 8px;
                opacity: 0.7;
                flex-shrink: 0;
            ">&times;</button>
        </div>
    `;

    // Add to container
    messageContainer.appendChild(messageCard);

    // Animate in
    setTimeout(() => {
        messageCard.style.transform = 'translateX(0)';
        messageCard.style.opacity = '1';
    }, 10);

    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (messageCard.parentElement) {
                messageCard.style.transform = 'translateX(100%)';
                messageCard.style.opacity = '0';
                setTimeout(() => {
                    if (messageCard.parentElement) {
                        messageCard.remove();
                    }
                }, 300);
            }
        }, duration);
    }

}




function initThemeToggle() {
    if (!themeSwitch) return;

    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeSwitch.checked = true;
    } else {
        document.body.removeAttribute('data-theme');
        themeSwitch.checked = false;
    }

    themeSwitch.addEventListener('change', function() {
        if (this.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });
}

function setActiveSidebarItem() {
    const currentPath = window.location.pathname;
    let activePage = 'dashboard';

    if (currentPath.includes('doctor-availability.html')) {
        activePage = 'availability';
    } else if (currentPath.includes('doctor-history.html')) {
        activePage = 'history';
    } else if (currentPath.includes('doctor-settings.html')) {
        activePage = 'settings';
    }

    sidebarMenuItems.forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`.sidebar-menu li[data-page="${activePage}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

function initSidebarNavigation() {
    sidebarMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            if (!targetPage) return;

            switch (targetPage) {
                case 'dashboard':
                    window.location.href = 'doctor.html';
                    break;
                case 'availability':
                    window.location.href = 'doctor-availability.html';
                    break;
                case 'history':
                    window.location.href = 'doctor-history.html';
                    break;
                case 'settings':
                    window.location.href = 'doctor-settings.html';
                    break;
                default:
                    console.warn('Unknown page:', targetPage);
            }
        });

    });
}

function initLogoutButton() {
    if (!logoutBtn) return;
    logoutBtn.addEventListener('click', function() {
        // Clear session
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('firstName');
        localStorage.removeItem('lastName');
        localStorage.removeItem('email');
        localStorage.removeItem('userId');
        localStorage.removeItem('userAvatar');
        window.location.href = '/login/index.html';
    });
}

function updateAvatarDisplay(avatarContainer) {
    const savedImage = localStorage.getItem('userAvatar');
    avatarContainer.innerHTML = '';

    if (savedImage) {
        const img = document.createElement('img');
        img.src = savedImage;
        img.alt = 'Avatar';
        avatarContainer.appendChild(img);
    } else {
        const userName = localStorage.getItem('userName') || '';
        const nameParts = userName.trim().split(' ');
        const initials = (nameParts[0]?.charAt(0) || '') + (nameParts[1]?.charAt(0) || '');
        const span = document.createElement('span');
        span.textContent = initials.toUpperCase();
        avatarContainer.appendChild(span);
    }
}

function loadAvatar() {
    const avatarContainer = document.querySelector('.avatar-img');
    if (!avatarContainer) return;
    updateAvatarDisplay(avatarContainer);
}

function updateSidebarInfo() {
    const sidebarName = document.querySelector('.patient-info h4');
    if (sidebarName) {
        sidebarName.textContent = localStorage.getItem('userName') || '';
    }
    loadAvatar();
}

function getStoredInvitations() {
    return JSON.parse(localStorage.getItem('sentInvitations') || '[]');
}

function getLastSixMonthBuckets() {
    const now = new Date();
    const buckets = [];

    for (let offset = 5; offset >= 0; offset--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        buckets.push({
            label: monthDate.toLocaleString('en-US', { month: 'short' }),
            year: monthDate.getFullYear(),
            month: monthDate.getMonth()
        });
    }

    return buckets;
}

function getUniquePatientsCount(invitations) {
    return new Set(invitations.map(inv => inv.patient?.id).filter(Boolean)).size;
}

function getTodaysAppointmentCount(invitations) {
    const today = new Date().toISOString().slice(0, 10);
    return invitations.filter(inv => inv.date === today && inv.status !== 'declined').length;
}

function getCompletedConsultationsCount(invitations) {
    return invitations.filter(inv => inv.status === 'accepted' || inv.status === 'completed').length;
}

function getAveragePatientSatisfaction(invitations) {
    if (!invitations.length) return 0;
    const accepted = invitations.filter(inv => inv.status === 'accepted' || inv.status === 'completed').length;
    return Math.round((accepted / invitations.length) * 100);
}

function getActivePatientsCount(invitations) {
    const active = new Set();
    invitations.forEach(invitation => {
        if (invitation.patient?.id && (invitation.status === 'pending' || invitation.status === 'accepted' || invitation.status === 'completed')) {
            active.add(invitation.patient.id);
        }
    });
    return active.size;
}

function getPendingReviewsCount(invitations) {
    return invitations.filter(inv => inv.status === 'pending').length;
}

function calculateSpecialtyCounts(invitations) {
    const specialtyCounts = {
        'Cardiology': 0,
        'Dentistry': 0,
        'Neurology': 0,
        'Ophthalmology': 0,
        'General Medicine': 0
    };

    const typeToSpecialty = {
        'consultation': 'General Medicine',
        'follow-up': 'General Medicine',
        'emergency': 'Cardiology',
        'specialist': 'Neurology'
    };

    invitations.forEach(invitation => {
        const specialty = typeToSpecialty[invitation.type] || 'General Medicine';
        if (specialtyCounts.hasOwnProperty(specialty)) {
            specialtyCounts[specialty] += 1;
        } else {
            specialtyCounts['General Medicine'] += 1;
        }
    });

    return specialtyCounts;
}

function getAppointmentTrendsData(monthBuckets) {
    const invitations = getStoredInvitations();
    if (invitations.length === 0) return [0, 0, 0, 0, 0, 0];

    return monthBuckets.map(bucket => {
        return invitations.reduce((count, invitation) => {
            const appointmentDate = new Date(invitation.date);
            if (Number.isNaN(appointmentDate.getTime())) return count;
            if (appointmentDate.getFullYear() === bucket.year &&
                appointmentDate.getMonth() === bucket.month &&
                invitation.status !== 'declined') {
                return count + 1;
            }
            return count;
        }, 0);
    });
}

function getPatientHealthData(monthBuckets) {
    const invitations = getStoredInvitations();
    if (invitations.length === 0) {
        return monthBuckets.map(() => 0);
    }

    return monthBuckets.map(bucket => {
        const monthInvitations = invitations.filter(invitation => {
            const appointmentDate = new Date(invitation.date);
            return !Number.isNaN(appointmentDate.getTime()) &&
                appointmentDate.getFullYear() === bucket.year &&
                appointmentDate.getMonth() === bucket.month;
        });

        if (!monthInvitations.length) return 0;

        const accepted = monthInvitations.filter(inv => inv.status === 'accepted' || inv.status === 'completed').length;
        return Math.round((accepted / monthInvitations.length) * 100);
    });
}

function getPatientsBySpecialtyData() {
    return Object.values(calculateSpecialtyCounts(getStoredInvitations()));
}

function getPerformanceMetricsData() {
    const invitations = getStoredInvitations();
    const total = invitations.length;
    if (total === 0) return [0, 0, 0, 0];

    const today = new Date().toISOString().slice(0, 10);
    const completed = invitations.filter(inv => inv.status === 'accepted' || inv.status === 'completed').length;
    const confirmed = invitations.filter(inv => inv.status === 'pending' && inv.date >= today).length;
    const cancelled = invitations.filter(inv => inv.status === 'declined').length;
    const missed = invitations.filter(inv => {
        const appointmentDate = new Date(inv.date);
        return !Number.isNaN(appointmentDate.getTime()) &&
            inv.status !== 'declined' &&
            inv.status !== 'accepted' &&
            inv.status !== 'completed' &&
            appointmentDate.toISOString().slice(0, 10) < today;
    }).length;

    const excellent = Math.round((completed / total) * 100);
    const good = Math.round((confirmed / total) * 100);
    const fair = Math.round((cancelled / total) * 100);
    const needsAttention = Math.round((missed / total) * 100);

    const totalPercent = excellent + good + fair + needsAttention;
    if (totalPercent === 100) return [excellent, good, fair, needsAttention];
    return [excellent, good + (100 - totalPercent), fair, needsAttention];
}

function setDashboardText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function updateSpecialtyBreakdown() {
    const counts = calculateSpecialtyCounts(getStoredInvitations());
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0) || 1;

    Object.entries(counts).forEach(([specialty, count]) => {
        const key = specialty.toLowerCase().replace(' ', '-');
        setDashboardText(`specialty-count-${key}`, `${count} patients`);
        setDashboardText(`specialty-percentage-${key}`, `${Math.round((count / total) * 100)}%`);
    });
}

function refreshDashboardCounters() {
    const invitations = getStoredInvitations();

    setDashboardText('total-patients-card', getUniquePatientsCount(invitations));
    setDashboardText('todays-appointments-card', getTodaysAppointmentCount(invitations));
    setDashboardText('completed-consultations-card', getCompletedConsultationsCount(invitations));
    setDashboardText('patient-satisfaction-card', `${getAveragePatientSatisfaction(invitations)}%`);

    setDashboardText('practice-total-patients', getUniquePatientsCount(invitations));
    setDashboardText('practice-active-patients', getActivePatientsCount(invitations));
    setDashboardText('practice-todays-appointments', getTodaysAppointmentCount(invitations));
    setDashboardText('practice-pending-reviews', getPendingReviewsCount(invitations));

    updateSpecialtyBreakdown();
}

function initializeCharts() {
    const monthBuckets = getLastSixMonthBuckets();
    const monthLabels = monthBuckets.map(bucket => bucket.label);
    const patientHealthCtx = document.getElementById('patientHealthChart');
    const appointmentTrendsCtx = document.getElementById('appointmentTrendsChart');
    const specialtyCtx = document.getElementById('specialtyChart');
    const performanceCtx = document.getElementById('performanceChart');

    if (patientHealthCtx) {
        new Chart(patientHealthCtx, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Average Health Score',
                    data: getPatientHealthData(monthBuckets),
                    borderColor: '#2da0a8',
                    backgroundColor: 'rgba(45, 160, 168, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
    }

    if (appointmentTrendsCtx) {
        new Chart(appointmentTrendsCtx, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Appointments',
                    data: getAppointmentTrendsData(monthBuckets),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    if (specialtyCtx) {
        new Chart(specialtyCtx, {
            type: 'bar',
            data: {
                labels: ['Cardiology', 'Dentistry', 'Neurology', 'Ophthalmology', 'General Medicine'],
                datasets: [{
                    label: 'Patients',
                    data: getPatientsBySpecialtyData(),
                    backgroundColor: 'rgba(45, 160, 168, 0.8)',
                    borderColor: '#2da0a8',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }

    if (performanceCtx) {
        new Chart(performanceCtx, {
            type: 'doughnut',
            data: {
                labels: ['Excellent', 'Good', 'Fair', 'Needs Attention'],
                datasets: [{
                    data: getPerformanceMetricsData(),
                    backgroundColor: ['#28a745', '#2da0a8', '#ffc107', '#dc3545'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } }
                }
            }
        });
    }
}

function initButtonInteractions() {
    const buttons = document.querySelectorAll('.btn-primary');
    buttons.forEach(button => {
        if (button.textContent.includes('View Patient Records')) {
            button.addEventListener('click', () => {
                window.location.href = 'doctor-history.html';
            });
        } else if (button.textContent.includes('Manage Schedule')) {
            button.addEventListener('click', () => {
                window.location.href = 'doctor-availability.html';
            });
        }
    });
}

function initCardHoverEffects() {
    const cards = document.querySelectorAll('.stat-card, .appointment-card, .activity-item, .welcome-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = 'var(--shadow), 0 8px 25px rgba(0, 0, 0, 0.15)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'var(--shadow)';
        });
    });
}

function initKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        const menuItems = Array.from(document.querySelectorAll('.sidebar-menu li'));
        if (!menuItems.length) return;

        const activeItem = document.querySelector('.sidebar-menu li.active');
        const activeIndex = menuItems.indexOf(activeItem);
        if (activeIndex === -1) return;

        e.preventDefault();
        const nextIndex = e.key === 'ArrowDown'
            ? (activeIndex + 1) % menuItems.length
            : (activeIndex === 0 ? menuItems.length - 1 : activeIndex - 1);

        menuItems[nextIndex].click();
        menuItems[nextIndex].focus();
    });
}

function initPage() {
    initThemeToggle();
    setActiveSidebarItem();
    initSidebarNavigation();
    initLogoutButton();
    updateSidebarInfo();
    refreshDashboardCounters();
    initializeCharts();
    initButtonInteractions();
    initCardHoverEffects();
    initKeyboardNavigation();
}

document.addEventListener('DOMContentLoaded', initPage);


