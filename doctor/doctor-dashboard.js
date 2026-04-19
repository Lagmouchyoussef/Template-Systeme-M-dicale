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
                    window.location.href = 'doctor-dashboard.html';
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
        window.location.replace('/login');
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
    // We combine all possible sources of appointment data for complete analytics
    const sent = JSON.parse(localStorage.getItem('sentInvitations') || '[]');
    const received = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
    const history = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
    const confirmed = JSON.parse(localStorage.getItem('doctorAppointments') || '[]');
    
    return [...sent, ...received, ...history, ...confirmed];
}

function getAnalyticsBaseData() {
    return getStoredInvitations();
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

function resolveDate(item) {
    if (!item) return null;
    let dateStr = item.date || item.appointmentDate || item.time;
    if (!dateStr) return null;

    // Handle case where date is like "Mon, Apr 20" (no year)
    if (typeof dateStr === 'string' && !dateStr.match(/\d{4}/)) {
        const currentYear = new Date().getFullYear();
        dateStr += `, ${currentYear}`;
    }

    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

function getUniquePatientsCount(invitations) {
    const registered = JSON.parse(localStorage.getItem('registeredPatients') || '[]');
    const patientIds = new Set(registered.map(p => String(p.id)));
    
    invitations.forEach(item => {
        const id = item.patientId || (item.patient && item.patient.id);
        if (id) patientIds.add(String(id));
    });
    
    return patientIds.size;
}

function getTodaysAppointmentCount(invitations) {
    const today = new Date().toISOString().split('T')[0];
    return invitations.filter(inv => {
        const d = resolveDate(inv);
        return d && d.toISOString().split('T')[0] === today && inv.status !== 'declined';
    }).length;
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
        const type = (invitation.type || '').toLowerCase();
        const specialty = typeToSpecialty[type] || 'General Medicine';
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
            const appointmentDate = resolveDate(invitation);
            if (!appointmentDate) return count;
            
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
            const appointmentDate = resolveDate(invitation);
            return appointmentDate &&
                appointmentDate.getFullYear() === bucket.year &&
                appointmentDate.getMonth() === bucket.month;
        });

        if (!monthInvitations.length) return 0;

        const accepted = monthInvitations.filter(inv => 
            ['accepted', 'completed', 'confirmed', 'restored'].includes(inv.status)
        ).length;
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

    const todayStr = new Date().toISOString().slice(0, 10);
    const completed = invitations.filter(inv => 
        ['accepted', 'completed', 'confirmed', 'restored'].includes(inv.status)
    ).length;
    const confirmed = invitations.filter(inv => {
        const d = resolveDate(inv);
        return d && inv.status === 'pending' && d.toISOString().slice(0, 10) >= todayStr;
    }).length;
    const cancelled = invitations.filter(inv => inv.status === 'declined').length;
    const missed = invitations.filter(inv => {
        const appointmentDate = resolveDate(inv);
        return appointmentDate &&
            inv.status !== 'declined' &&
            inv.status !== 'accepted' &&
            inv.status !== 'completed' &&
            appointmentDate.toISOString().slice(0, 10) < todayStr;
    }).length;

    const excellent = Math.round((completed / total) * 100);
    const good = Math.round((confirmed / total) * 100);
    const fair = Math.round((cancelled / total) * 100);
    const needsAttention = Math.round((missed / total) * 100);

    const totalPercent = excellent + good + fair + needsAttention;
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
    const userDistCtx = document.getElementById('userDistributionChart');

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
            type: 'bar',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Appointments',
                    data: getAppointmentTrendsData(monthBuckets),
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
                    legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, boxWidth: 10 } }
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
    loadPatientsDirectory();
    initConsultationModal();
    loadPendingRequests();
    loadRecentActivity();
    loadTodaysAppointments();
}

function loadTodaysAppointments() {
    const container = document.getElementById('todays-appointments-container');
    if (!container) return;

    const appointments = JSON.parse(localStorage.getItem('doctorAppointments') || '[]');
    const today = new Date().toISOString().split('T')[0];

    const todayAppointments = appointments.filter(app => {
        const d = resolveDate(app);
        return d && d.toISOString().split('T')[0] === today;
    });

    if (todayAppointments.length === 0) {
        container.innerHTML = `
            <div class="no-data-message" style="text-align: center; padding: 30px; color: var(--text-secondary); opacity: 0.7;">
                <i class="fas fa-calendar-plus" style="font-size: 24px; margin-bottom: 10px;"></i>
                <h3>No appointments today</h3>
                <p>Your schedule will appear here when appointments are booked</p>
                <button class="btn-primary" onclick="window.location.href='doctor-availability.html'">Manage Schedule</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="appointments-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
            ${todayAppointments.map(app => `
                <div class="appointment-card" style="
                    background: var(--card-bg); 
                    border: 1px solid var(--border-color); 
                    border-radius: 12px; 
                    padding: 15px; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                ">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="width: 45px; height: 45px; border-radius: 50%; background: var(--accent-color)15; color: var(--accent-color); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">
                            ${(app.patientName || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 16px; color: var(--text-primary); font-weight: 600;">${app.patientName || 'Unknown Patient'}</h4>
                            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                <span style="font-size: 13px; color: var(--text-secondary);">
                                    <i class="far fa-clock" style="margin-right: 4px;"></i> ${app.time || 'Time N/A'}
                                </span>
                                <span style="width: 4px; height: 4px; border-radius: 50%; background: var(--text-secondary); opacity: 0.3;"></span>
                                <span style="font-size: 12px; color: var(--accent-color);">${app.type || 'Consultation'}</span>
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #28a74515; color: #28a745; border: 1px solid #28a74530;">
                            Confirmed
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function loadRecentActivity() {
    const container = document.getElementById('recent-activity-container');
    if (!container) return;

    const invitations = JSON.parse(localStorage.getItem('sentInvitations') || '[]');
    const requests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');

    let activities = [];

    // Map invitations to activities
    invitations.forEach(inv => {
        activities.push({
            type: 'invitation',
            title: `Invitation sent to ${inv.patient?.name || (inv.patientName) || 'Patient'}`,
            date: resolveDate(inv),
            icon: 'fa-paper-plane',
            color: '#6f42c1'
        });
    });

    // Map requests to activities
    requests.forEach(req => {
        const isValid = (val) => val && val !== 'undefined' && val !== 'null';
        const pName = isValid(req.patientName) ? req.patientName : 
                     (isValid(req.patient) && typeof req.patient === 'string' ? req.patient : 
                     (req.patient && isValid(req.patient.name) ? req.patient.name : 'Patient'));
        
        activities.push({
            type: 'request',
            title: `Request from ${pName}`,
            date: resolveDate(req),
            icon: 'fa-envelope-open-text',
            color: '#2da0a8'
        });
    });

    // Sort by date desc
    activities.sort((a, b) => {
        const dateA = a.date ? a.date.getTime() : 0;
        const dateB = b.date ? b.date.getTime() : 0;
        return dateB - dateA;
    });

    // Limit to 5
    activities = activities.slice(0, 5);

    if (activities.length === 0) {
        container.innerHTML = `
            <div class="no-data-message" style="text-align: center; padding: 30px; color: var(--text-secondary); opacity: 0.7;">
                <i class="fas fa-history" style="font-size: 24px; margin-bottom: 10px;"></i>
                <h3>No recent activity</h3>
                <p>Your medical activities will appear here once you start consultations</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="activity-list" style="display: flex; flex-direction: column; gap: 12px;">
            ${activities.map(act => `
                <div class="activity-item ripple" style="
                    display: flex; 
                    align-items: center; 
                    gap: 15px; 
                    padding: 15px; 
                    background: var(--card-bg); 
                    border-radius: 12px; 
                    border: 1px solid var(--border-color);
                    transition: all 0.3s ease;
                    cursor: default;
                ">
                    <div class="activity-icon" style="
                        width: 42px; 
                        height: 42px; 
                        border-radius: 10px; 
                        background: ${act.color}15; 
                        color: ${act.color}; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        font-size: 18px;
                    ">
                        <i class="fas ${act.icon}"></i>
                    </div>
                    <div class="activity-info" style="flex: 1;">
                        <h4 style="margin: 0; font-size: 15px; color: var(--text-primary); font-weight: 600;">${act.title}</h4>
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
                            <span style="font-size: 12px; color: var(--text-secondary);">
                                <i class="far fa-calendar-alt" style="margin-right: 4px;"></i>
                                ${act.date ? act.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unknown'}
                            </span>
                            <span style="width: 4px; height: 4px; border-radius: 50%; background: var(--text-secondary); opacity: 0.3;"></span>
                            <span style="font-size: 12px; color: var(--accent-color); font-weight: 500;">
                                ${act.type.charAt(0).toUpperCase() + act.type.slice(1)}
                            </span>
                        </div>
                    </div>
                    <div class="activity-arrow" style="color: var(--text-secondary); opacity: 0.3;">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function loadPatientsDirectory() {
    const grid = document.getElementById('patients-directory-grid');
    if (!grid) return;
    
    // Using registeredPatients from localStorage (set by sync.js)
    const patients = JSON.parse(localStorage.getItem('registeredPatients') || '[]');
    
    if (patients.length === 0) {
        grid.innerHTML = `
            <div class="no-data-message" style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 20px;">
                <i class="fas fa-users" style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;"></i>
                <p>No patients registered in the system yet.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';
    patients.forEach(patient => {
        const card = document.createElement('div');
        card.style.cssText = `
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            transition: all 0.3s ease;
        `;
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 50px; height: 50px; border-radius: 10px; background: linear-gradient(135deg, var(--accent-color), var(--accent-hover)); color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold;">
                    ${patient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 16px; color: var(--text-primary);">${patient.name}</h3>
                    <p style="margin: 3px 0 0; font-size: 13px; color: var(--text-secondary);"><i class="fas fa-envelope"></i> ${patient.email}</p>
                </div>
            </div>
            <button class="btn-primary send-consultation-btn" data-id="${patient.id}" data-name="${patient.name}" data-email="${patient.email}" style="width: 100%; padding: 10px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: auto;">
                <i class="fas fa-paper-plane"></i> Send Consultation
            </button>
        `;
        
        // Add hover effect
        card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-3px)');
        card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');
        
        grid.appendChild(card);
    });

    // Add event listeners to the buttons
    document.querySelectorAll('.send-consultation-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const { id, name, email } = e.target.closest('button').dataset;
            openConsultationModal(id, name, email);
        });
    });
}

function initConsultationModal() {
    const modal = document.getElementById('send-consultation-modal');
    const closeBtn = document.getElementById('consultation-modal-close');
    const form = document.getElementById('send-consultation-form');

    if (!modal || !closeBtn || !form) return;

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    const emergencyBtn = document.getElementById('consultation-emergency-btn');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', () => {
            const typeSelect = document.getElementById('consultation-type');
            typeSelect.value = 'emergency';
            
            // Visual feedback
            emergencyBtn.classList.add('active');
            
            if (typeof showToast === 'function') {
                showToast('Urgence activée', 'warning');
            }
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const doctorName = localStorage.getItem('userName') || 'Doctor';
        const doctorId = localStorage.getItem('userId');
        
        const patientId = document.getElementById('consultation-patient-id').value;
        const patientName = document.getElementById('consultation-patient-name').textContent;
        const patientEmail = document.getElementById('consultation-patient-email').value;
        const date = document.getElementById('consultation-date').value;
        const time = document.getElementById('consultation-time').value;
        const type = document.getElementById('consultation-type').value;
        const notes = document.getElementById('consultation-notes').value;

        // Create invitation object
        const invitation = {
            id: 'inv_' + Date.now(),
            patientId: patientId,
            patientName: patientName,
            patientEmail: patientEmail,
            doctorName: doctorName,
            doctorId: doctorId,
            date: date,
            time: time,
            type: type,
            notes: notes,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Save to sent invitations (Doctor side)
        const sentInvitations = JSON.parse(localStorage.getItem('sentInvitations') || '[]');
        sentInvitations.push(invitation);
        localStorage.setItem('sentInvitations', JSON.stringify(sentInvitations));

        // Save to patient's received invitations (Patient side)
        const patientKey = 'patient_' + patientId + '_invitations';
        const receivedInvitations = JSON.parse(localStorage.getItem(patientKey) || '[]');
        receivedInvitations.push(invitation);
        localStorage.setItem(patientKey, JSON.stringify(receivedInvitations));

        // NEW: Archive to emailHistory
        const emailData = {
            id: 'email_' + Date.now(),
            to: patientEmail,
            subject: 'New Consultation Invitation - Dr. ' + doctorName,
            body: `Hello ${patientName}, Dr. ${doctorName} has invited you to a consultation on ${date} at ${time}. Type: ${type}`,
            sentAt: new Date().toISOString(),
            status: 'sent',
            type: 'invitation'
        };
        const emailHistory = JSON.parse(localStorage.getItem('emailHistory') || '[]');
        emailHistory.push(emailData);
        localStorage.setItem('emailHistory', JSON.stringify(emailHistory));

        // Close modal and show success
        modal.style.display = 'none';
        form.reset();
        
        if (typeof showToast === 'function') {
            showToast('Consultation invitation sent successfully to ' + patientName, 'success');
        } else {
            alert('Consultation invitation sent successfully!');
        }
    });
}

function openConsultationModal(id, name, email) {
    const modal = document.getElementById('send-consultation-modal');
    if (!modal) return;
    
    document.getElementById('consultation-patient-id').value = id;
    document.getElementById('consultation-patient-name').textContent = name;
    document.getElementById('consultation-patient-email').value = email;
    
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('consultation-date').min = today;
    
    modal.style.display = 'flex';
}

function loadPendingRequests() {
    const list = document.getElementById('pending-requests-list');
    const badge = document.getElementById('pending-requests-badge');
    if (!list || !badge) return;

    const doctorId = localStorage.getItem('userId');
    const allRequests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
    
    // In demo mode, show all requests
    const myPendingRequests = allRequests.filter(req => req.status === 'pending');
    
    badge.textContent = myPendingRequests.length;
    
    if (myPendingRequests.length === 0) {
        list.innerHTML = `
            <div class="no-data-message" style="text-align: center; color: var(--text-secondary); padding: 20px;">
                <i class="fas fa-calendar-check" style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;"></i>
                <p>No pending appointment requests.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = '';
    myPendingRequests.forEach(r => {
        // Map data for robust display - explicit check for "undefined" string
        const isValid = (val) => val && val !== 'undefined' && val !== 'null';
        
        const pName = isValid(r.patientName) ? r.patientName : 
                     (isValid(r.patient) && typeof r.patient === 'string' ? r.patient : 
                     (r.patient && isValid(r.patient.name) ? r.patient.name : 'Unknown Patient'));
                     
        const pEmail = isValid(r.email) ? r.email : 
                      (r.patient && isValid(r.patient.email) ? r.patient.email : 'N/A');
                      
        const pPhone = isValid(r.phone) ? r.phone : 
                      (r.patient && isValid(r.patient.phone) ? r.patient.phone : 'N/A');
                      
        const pType = isValid(r.customType) ? r.customType : 
                     (isValid(r.type) ? r.type : 'Consultation');
                     
        const pReason = isValid(r.reason) ? r.reason : 
                       (isValid(r.notes) ? r.notes : 'No reason provided');
                       
        const pDate = isValid(r.date) ? r.date : '';
        const pTime = isValid(r.time) ? r.time : '';

        const item = document.createElement('div');
        item.style.cssText = `
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h4 style="margin: 0 0 5px 0; color: var(--text-primary); font-size: 16px;">${pName}</h4>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 13px;">
                        <i class="fas fa-envelope"></i> ${pEmail} &nbsp;|&nbsp; 
                        <i class="fas fa-phone"></i> ${pPhone}
                    </p>
                </div>
                <div style="text-align: right;">
                    <strong style="color: var(--accent-color); font-size: 14px;">${pDate ? new Date(pDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric'}) : 'N/A'}</strong><br>
                    <span style="color: var(--text-primary); font-size: 14px;">${pTime}</span>
                </div>
            </div>
            
            <div style="background: var(--bg-primary); padding: 10px; border-radius: 6px; font-size: 13px; color: var(--text-primary);">
                <strong>Type:</strong> ${pType.charAt(0).toUpperCase() + pType.slice(1)}<br>
                <strong>Reason:</strong> ${pReason}
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 5px;">
                <button onclick="handleRequest('${r.id}', 'accepted')" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button onclick="handleRequest('${r.id}', 'declined')" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    <i class="fas fa-times"></i> Decline
                </button>
                <button onclick="rescheduleRequest('${r.id}')" style="flex: 1; padding: 8px; background: #ffc107; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    <i class="fas fa-calendar-alt"></i> Reschedule
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

window.handleRequest = function(requestId, newStatus) {
    const allRequests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
    const reqIndex = allRequests.findIndex(r => r.id === requestId);
    
    if (reqIndex !== -1) {
        allRequests[reqIndex].status = newStatus;
        localStorage.setItem('appointmentRequests', JSON.stringify(allRequests));
        
        if (newStatus === 'accepted') {
            // Add to confirmed appointments list for both (simulated via addPatientAppointment which we can just adapt)
            const req = allRequests[reqIndex];
            
            const isValid = (val) => val && val !== 'undefined' && val !== 'null';
            const patientName = isValid(req.patientName) ? req.patientName : 
                               (isValid(req.patient) && typeof req.patient === 'string' ? req.patient : 
                               (req.patient && isValid(req.patient.name) ? req.patient.name : 'Unknown Patient'));
            
            // For doctor dashboard
            const doctorAppointments = JSON.parse(localStorage.getItem('doctorAppointments') || '[]');
            doctorAppointments.push({
                id: req.id,
                patientId: req.patientId, // Preserve patientId
                patientName: patientName,
                doctorName: localStorage.getItem('userName') || 'Dr. MedSync', // Add doctorName
                date: req.date,
                time: req.time,
                type: req.type,
                status: 'confirmed'
            });
            localStorage.setItem('doctorAppointments', JSON.stringify(doctorAppointments));
            
            if (typeof showToast === 'function') {
                showToast('Appointment accepted successfully.', 'success');
            } else {
                alert('Appointment accepted!');
            }
        } else if (newStatus === 'declined') {
            if (typeof showToast === 'function') {
                showToast('Appointment declined.', 'info');
            }
        }
        
        // Reload lists
        loadPendingRequests();
        loadRecentActivity();
        loadTodaysAppointments();
    }
};

window.rescheduleRequest = function(requestId) {
    const allRequests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
    const req = allRequests.find(r => r.id === requestId);
    if (!req) return;
    
    const newDate = prompt('Enter new date (YYYY-MM-DD):', req.date);
    if (!newDate) return; // User cancelled
    
    const newTime = prompt('Enter new time (HH:MM):', req.time);
    if (!newTime) return; // User cancelled
    
    // Update the request
    req.date = newDate;
    req.time = newTime;
    // Keep it pending but update it, or accept it right away. 
    // Let's keep it pending so patient knows, or accept it with new time. Let's just accept it with new time for simplicity.
    req.status = 'rescheduled'; 
    localStorage.setItem('appointmentRequests', JSON.stringify(allRequests));
    
    const isValid = (val) => val && val !== 'undefined' && val !== 'null';
    const patientName = isValid(req.patientName) ? req.patientName : 
                       (isValid(req.patient) && typeof req.patient === 'string' ? req.patient : 
                       (req.patient && isValid(req.patient.name) ? req.patient.name : 'Unknown Patient'));
    
    // Add to doctor appointments
    const doctorAppointments = JSON.parse(localStorage.getItem('doctorAppointments') || '[]');
    doctorAppointments.push({
        id: req.id,
        patientId: req.patientId, // Preserve patientId
        patientName: patientName,
        doctorName: localStorage.getItem('userName') || 'Dr. MedSync', // Add doctorName
        date: newDate,
        time: newTime,
        type: req.type,
        status: 'confirmed'
    });
    localStorage.setItem('doctorAppointments', JSON.stringify(doctorAppointments));
    
    if (typeof showToast === 'function') {
        showToast('Appointment rescheduled and confirmed!', 'success');
    }
    
    loadPendingRequests();
    loadRecentActivity();
    loadTodaysAppointments();
};

document.addEventListener('DOMContentLoaded', initPage);


