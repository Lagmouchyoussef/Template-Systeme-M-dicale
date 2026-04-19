// ── Auth Guard ─────────────────────────────────────────────────────────────
(function() {
    const role = localStorage.getItem('userRole');
    if (!role || role !== 'patient') {
        globalThis.location.replace('/login');
    }
})();

// ── Global Variables ────────────────────────────────────────────────────────
let currentPatientData = null;

// ── Theme Management ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    const themeSwitch = document.getElementById('theme-switch');

    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';

    // Apply the current theme
    if (currentTheme === 'dark') {
        document.body.dataset.theme = 'dark';
        themeSwitch.checked = true;
    } else {
        delete document.body.dataset.theme;
        themeSwitch.checked = false;
    }

    // Toggle theme when switch is clicked
    themeSwitch.addEventListener('change', function() {
        if (this.checked) {
            document.body.dataset.theme = 'dark';
            localStorage.setItem('theme', 'dark');
        } else {
            delete document.body.dataset.theme;
            localStorage.setItem('theme', 'light');
        }
    });

    // Initialize dashboard
    initializeDashboard();
    loadAvatar();
    updateSidebar();

    // Listen for data changes
    globalThis.addEventListener('storage', handleStorageChange);
});

// ── Storage Change Handler ──────────────────────────────────────────────────
function handleStorageChange(e) {
    if (e.key && (
        e.key.includes('doctorAppointments') ||
        e.key.includes('appointmentRequests') ||
        e.key.includes('_invitations') ||
        e.key === 'userName'
    )) {
        // Refresh dashboard data
        setTimeout(() => {
            loadDashboardData();
        }, 100);
    }
}

// ── Dashboard Initialization ────────────────────────────────────────────────
function initializeDashboard() {
    loadDashboardData();
    initializeCharts();
    setupEventListeners();
}

function setupEventListeners() {
    // Add any additional event listeners here
}

// ── Data Loading Functions ──────────────────────────────────────────────────
function loadDashboardData() {
    const patientId = localStorage.getItem('userId');
    const patientName = localStorage.getItem('userName') || '';
    const patientEmail = localStorage.getItem('email') || '';

    if (!patientId) return;

    // Load all relevant data
    const confirmedAppointments = JSON.parse(localStorage.getItem('doctorAppointments') || '[]');
    const appointmentRequests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
    const patientInvitations = JSON.parse(localStorage.getItem(`patient_${patientId}_invitations`) || '[]');

    // Filter data for current patient
    const patientAppointments = filterPatientData(confirmedAppointments, patientId, patientName, patientEmail);
    const patientRequests = filterPatientData(appointmentRequests, patientId, patientName, patientEmail);
    const activeInvitations = patientInvitations.filter(inv => !['declined', 'cancelled'].includes(inv.status));

    // Update dashboard
    updateWelcomeSection(patientName);
    updateKeyMetrics(patientAppointments, patientRequests, activeInvitations);
    updateAppointmentStatistics(patientAppointments);
    updateSpecialtyBreakdown(patientAppointments);
    updateUpcomingAppointments(patientAppointments, patientRequests);
    updateRecentActivity(patientAppointments, patientRequests);
    updateDoctorsList(patientAppointments);
    updatePendingInvitations(activeInvitations);

    // Store for charts
    currentPatientData = {
        appointments: patientAppointments,
        requests: patientRequests,
        invitations: activeInvitations
    };
}

function filterPatientData(data, patientId, patientName, patientEmail) {
    return data.filter(item => {
        const itemId = item.patientId || item.userId || '';
        const itemName = (item.patientName || item.name || '').toLowerCase();
        const itemEmail = (item.patientEmail || item.email || '').toLowerCase();

        return itemId === patientId ||
               itemName.includes(patientName.toLowerCase()) ||
               itemEmail === patientEmail.toLowerCase();
    });
}

// ── UI Update Functions ─────────────────────────────────────────────────────
function updateWelcomeSection(patientName) {
    const welcomeName = document.getElementById('welcome-name');
    if (welcomeName) {
        welcomeName.textContent = patientName.split(' ')[0] || 'Patient';
    }
}

function updateKeyMetrics(appointments, requests, invitations) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Today's appointments
    const todayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });

    // Upcoming appointments (next 30 days)
    const upcomingAppointments = [...appointments, ...requests].filter(item => {
        const itemDate = new Date(item.date);
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return itemDate >= now && itemDate <= thirtyDaysFromNow;
    });

    // Calculate metrics
    const totalAppointments = appointments.length;
    const doctorsCount = new Set(appointments.map(apt => apt.doctorName || apt.doctor)).size;
    const pendingInvitations = invitations.filter(inv => inv.status === 'pending').length;

    // Calculate health score (simple algorithm based on appointment regularity)
    const healthScore = calculateHealthScore(appointments, requests);

    // Update DOM
    updateElement('today-appointments', todayAppointments.length);
    updateElement('upcoming-count', upcomingAppointments.length);
    updateElement('total-appointments-card', totalAppointments);
    updateElement('doctors-visited-count', doctorsCount);
    updateElement('health-score-card', `${healthScore}%`);
    updateElement('pending-invitations', pendingInvitations);

    // Update trends
    updateTrends(appointments);
}

function calculateHealthScore(appointments, requests) {
    if (appointments.length === 0) return 0;

    // Simple scoring based on:
    // - Regularity of appointments
    // - Number of different doctors
    // - Recent activity

    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

    const recentAppointments = appointments.filter(apt => new Date(apt.date) >= sixMonthsAgo);
    const doctorsCount = new Set(appointments.map(apt => apt.doctorName || apt.doctor)).size;

    let score = 50; // Base score

    // Bonus for recent activity
    if (recentAppointments.length > 0) {
        score += Math.min(recentAppointments.length * 5, 25);
    }

    // Bonus for seeing multiple doctors (diversified care)
    score += Math.min(doctorsCount * 3, 15);

    // Bonus for regular appointments
    if (appointments.length >= 3) {
        score += 10;
    }

    return Math.min(Math.max(score, 0), 100);
}

function updateTrends(appointments) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.getMonth() === thisMonth && aptDate.getFullYear() === thisYear;
    }).length;

    const lastMonthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.getMonth() === lastMonth && aptDate.getFullYear() === lastMonthYear;
    }).length;

    const appointmentsChange = thisMonthAppointments - lastMonthAppointments;
    const appointmentsTrend = document.getElementById('appointments-trend');

    if (appointmentsTrend) {
        appointmentsTrend.innerHTML = `<i class="fas fa-arrow-${appointmentsChange >= 0 ? 'up' : 'down'}"></i> ${Math.abs(appointmentsChange)} ce mois`;
        appointmentsTrend.className = `metric-trend ${appointmentsChange >= 0 ? 'positive' : 'negative'}`;
    }
}

function updateAppointmentStatistics(appointments) {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Total appointments
    updateElement('total-appointments-count', appointments.length);

    // Upcoming appointments (next 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingCount = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= now && aptDate <= thirtyDaysFromNow;
    }).length;
    updateElement('upcoming-appointments-count', upcomingCount);

    // Completed appointments (past appointments)
    const completedCount = appointments.filter(apt => new Date(apt.date) < now).length;
    updateElement('completed-appointments-count', completedCount);

    // Cancelled appointments
    const cancelledCount = appointments.filter(apt => apt.status === 'cancelled').length;
    updateElement('cancelled-appointments-count', cancelledCount);

    // Update trends
    updateAppointmentTrends(appointments);
}

function updateAppointmentTrends(appointments) {
    // Simple trend calculation - compare current vs previous period
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
    }).length;

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const previousMonthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.getMonth() === previousMonth && aptDate.getFullYear() === previousYear;
    }).length;

    const trendElements = document.querySelectorAll('.stat-trend');
    trendElements.forEach(element => {
        const change = currentMonthAppointments - previousMonthAppointments;
        if (change > 0) {
            element.innerHTML = '<i class="fas fa-arrow-up"></i> Improving';
            element.className = 'stat-trend positive';
        } else if (change < 0) {
            element.innerHTML = '<i class="fas fa-arrow-down"></i> Declining';
            element.className = 'stat-trend negative';
        } else {
            element.innerHTML = '<i class="fas fa-minus"></i> Stable';
            element.className = 'stat-trend neutral';
        }
    });
}

function updateSpecialtyBreakdown(appointments) {
    const specialtyCount = {};

    appointments.forEach(apt => {
        const specialty = apt.specialty || apt.type || 'General Medicine';
        // Normalize specialty name to match HTML IDs
        const normalizedSpecialty = normalizeSpecialtyName(specialty);
        specialtyCount[normalizedSpecialty] = (specialtyCount[normalizedSpecialty] || 0) + 1;
    });

    const totalAppointments = appointments.length;

    // Update specialty items - only update existing HTML elements
    const specialtyIds = [
        'cardiology', 'dentistry', 'neurology', 'ophthalmology', 'general-medicine'
    ];

    specialtyIds.forEach(specialtyId => {
        const specialtyName = specialtyId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const count = specialtyCount[specialtyName] || 0;
        const percentage = totalAppointments > 0 ? Math.round((count / totalAppointments) * 100) : 0;

        updateElement(`specialty-count-${specialtyId}`, `${count} appointments`);
        updateElement(`specialty-percentage-${specialtyId}`, `${percentage}%`);
    });
}

function updateUpcomingAppointments(appointments, requests) {
    const container = document.getElementById('upcoming-appointments-list');
    if (!container) return;

    const now = new Date();
    const upcoming = [...appointments, ...requests]
        .filter(item => new Date(item.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5); // Show next 5

    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <h3>Aucun rendez-vous à venir</h3>
                <p>Prenez rendez-vous avec un médecin pour commencer votre suivi médical.</p>
                <button class="btn-primary" onclick="window.location.href='appointments.html'">
                    Prendre rendez-vous
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = upcoming.map(item => createAppointmentCard(item)).join('');
}

function createAppointmentCard(item) {
    const isConfirmed = item.status === 'confirmed' || item.status === 'completed';
    const doctorName = item.doctorName || item.doctor || 'Médecin non spécifié';
    const appointmentDate = new Date(item.date);
    const formattedDate = appointmentDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const time = item.time || 'Heure non spécifiée';
    const type = item.type || item.specialty || 'Consultation';

    return `
        <div class="appointment-card ${isConfirmed ? 'confirmed' : 'pending'}">
            <div class="appointment-header">
                <div class="doctor-info">
                    <div class="doctor-avatar">
                        ${doctorName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                        <h4>${doctorName}</h4>
                        <span class="appointment-type">${type}</span>
                    </div>
                </div>
                <div class="appointment-status ${isConfirmed ? 'confirmed' : 'pending'}">
                    ${isConfirmed ? 'Confirmé' : 'En attente'}
                </div>
            </div>
            <div class="appointment-details">
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formattedDate}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>${time}</span>
                </div>
            </div>
        </div>
    `;
}

function updateRecentActivity(appointments, requests) {
    const container = document.getElementById('recent-activity-list');
    if (!container) return;

    const recentItems = [...appointments, ...requests]
        .sort((a, b) => new Date(b.date || b.requestDate) - new Date(a.date || a.requestDate))
        .slice(0, 10);

    if (recentItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>Aucune activité récente</h3>
                <p>Vos activités médicales apparaîtront ici une fois que vous commencerez à utiliser la plateforme.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = recentItems.map(item => createActivityItem(item)).join('');
}

function createActivityItem(item) {
    const date = new Date(item.date || item.requestDate);
    const formattedDate = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
    });

    const isAppointment = item.status && ['confirmed', 'completed', 'cancelled'].includes(item.status);
    const doctorName = item.doctorName || item.doctor || 'Médecin';
    const type = item.type || 'Consultation';

    let icon, title, description;

    if (isAppointment) {
        if (item.status === 'completed') {
            icon = 'fas fa-check-circle';
            title = `Rendez-vous terminé avec ${doctorName}`;
            description = `${type} - ${formattedDate}`;
        } else if (item.status === 'confirmed') {
            icon = 'fas fa-calendar-check';
            title = `Rendez-vous confirmé avec ${doctorName}`;
            description = `${type} - ${formattedDate}`;
        } else {
            icon = 'fas fa-times-circle';
            title = `Rendez-vous annulé avec ${doctorName}`;
            description = `${type} - ${formattedDate}`;
        }
    } else {
        icon = 'fas fa-envelope';
        title = `Demande de rendez-vous envoyée à ${doctorName}`;
        description = `${type} - ${formattedDate}`;
    }

    return `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${title}</h4>
                <p>${description}</p>
                <span class="activity-date">${formattedDate}</span>
            </div>
        </div>
    `;
}

function updateDoctorsList(appointments) {
    const container = document.getElementById('doctors-directory-grid');
    if (!container) return;

    const doctorsMap = new Map();

    appointments.forEach(apt => {
        const doctorName = apt.doctorName || apt.doctor;
        if (doctorName && doctorName !== 'Médecin non spécifié') {
            if (!doctorsMap.has(doctorName)) {
                doctorsMap.set(doctorName, {
                    name: doctorName,
                    specialty: apt.specialty || apt.type || 'Médecin généraliste',
                    appointmentsCount: 0,
                    lastAppointment: null
                });
            }
            doctorsMap.get(doctorName).appointmentsCount++;
            const aptDate = new Date(apt.date);
            if (!doctorsMap.get(doctorName).lastAppointment ||
                aptDate > new Date(doctorsMap.get(doctorName).lastAppointment)) {
                doctorsMap.get(doctorName).lastAppointment = apt.date;
            }
        }
    });

    const doctors = Array.from(doctorsMap.values())
        .sort((a, b) => b.appointmentsCount - a.appointmentsCount)
        .slice(0, 6); // Show top 6 doctors

    if (doctors.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-md"></i>
                <h3>Aucun médecin consulté</h3>
                <p>Commencez par prendre rendez-vous avec un médecin pour établir votre réseau médical.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = doctors.map(doctor => createDoctorCard(doctor)).join('');
}

function createDoctorCard(doctor) {
    const lastAppointment = doctor.lastAppointment ?
        new Date(doctor.lastAppointment).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }) : 'Jamais';

    return `
        <div class="doctor-card">
            <div class="doctor-avatar">
                ${doctor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div class="doctor-info">
                <h4>${doctor.name}</h4>
                <p class="doctor-specialty">${doctor.specialty}</p>
                <div class="doctor-stats">
                    <span><i class="fas fa-calendar"></i> ${doctor.appointmentsCount} rendez-vous</span>
                    <span><i class="fas fa-clock"></i> Dernier: ${lastAppointment}</span>
                </div>
            </div>
        </div>
    `;
}

function updatePendingInvitations(invitations) {
    const badge = document.getElementById('pending-invitations-badge');
    const container = document.getElementById('pending-invitations-list');

    if (!container) return;

    const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

    // Update badge
    if (badge) {
        badge.textContent = pendingInvitations.length;
        if (pendingInvitations.length === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'inline-block';
        }
    }

    if (pendingInvitations.length === 0) {
        container.innerHTML = `
            <div class="no-data-message" style="text-align: center; color: var(--text-secondary); padding: 20px;">
                <i class="fas fa-envelope" style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;"></i>
                <p>No pending invitations.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = pendingInvitations.map(inv => createInvitationCard(inv)).join('');
}

function createInvitationCard(invitation) {
    const doctorName = invitation.doctor?.name || 'Médecin';
    const appointmentDate = new Date(invitation.date);
    const formattedDate = appointmentDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
        <div class="invitation-card">
            <div class="invitation-header">
                <div class="doctor-info">
                    <div class="doctor-avatar">
                        ${doctorName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                        <h4>${doctorName}</h4>
                        <span class="invitation-type">${invitation.type || 'Consultation'}</span>
                    </div>
                </div>
                <div class="invitation-status pending">
                    En attente
                </div>
            </div>
            <div class="invitation-details">
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formattedDate}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>${invitation.time || 'Heure à confirmer'}</span>
                </div>
            </div>
            <div class="invitation-actions">
                <button class="btn-accept" onclick="acceptInvitation('${invitation.id}')">
                    <i class="fas fa-check"></i> Accepter
                </button>
                <button class="btn-decline" onclick="declineInvitation('${invitation.id}')">
                    <i class="fas fa-times"></i> Refuser
                </button>
            </div>
        </div>
    `;
}

// ── Invitation Management ───────────────────────────────────────────────────
function acceptInvitation(invitationId) {
    updateInvitationStatus(invitationId, 'accepted');
    showNotification('Invitation acceptée avec succès !', 'success');
    loadDashboardData();
}

function declineInvitation(invitationId) {
    updateInvitationStatus(invitationId, 'declined');
    showNotification('Invitation refusée.', 'info');
    loadDashboardData();
}

function updateInvitationStatus(invitationId, newStatus) {
    const patientId = localStorage.getItem('userId');
    if (!patientId) return;

    const key = `patient_${patientId}_invitations`;
    let invitations = JSON.parse(localStorage.getItem(key) || '[]');

    invitations = invitations.map(inv => {
        if (inv.id === invitationId) {
            return { ...inv, status: newStatus };
        }
        return inv;
    });

    localStorage.setItem(key, JSON.stringify(invitations));

    // If accepted, add to appointments
    if (newStatus === 'accepted') {
        const invitation = invitations.find(inv => inv.id === invitationId);
        if (invitation) {
            addToAppointments(invitation);
        }
    }
}

function addToAppointments(invitation) {
    const appointments = JSON.parse(localStorage.getItem('doctorAppointments') || '[]');
    const appointment = {
        id: invitation.id,
        doctor: invitation.doctor.name,
        doctorName: invitation.doctor.name,
        date: invitation.date,
        time: invitation.time,
        type: invitation.type,
        status: 'confirmed',
        notes: invitation.notes,
        patientId: localStorage.getItem('userId'),
        patientName: localStorage.getItem('userName')
    };

    appointments.push(appointment);
    localStorage.setItem('doctorAppointments', JSON.stringify(appointments));
}

// ── Charts Initialization ───────────────────────────────────────────────────
function initializeCharts() {
    // Wait for data to be loaded
    setTimeout(() => {
        if (currentPatientData) {
            createAppointmentsChart();
            createHealthOverviewChart();
            createSpecialtiesChart();
        }
    }, 500);
}

function createAppointmentsChart() {
    const ctx = document.getElementById('appointmentTrendsChart');
    if (!ctx || !currentPatientData) return;

    const appointments = currentPatientData.appointments;
    const now = new Date();
    const currentYear = now.getFullYear();

    // Get data for current year and previous year for comparison
    const currentYearData = new Array(12).fill(0);
    const previousYearData = new Array(12).fill(0);

    appointments.forEach(apt => {
        const date = new Date(apt.date);
        const year = date.getFullYear();
        const month = date.getMonth();

        if (year === currentYear) {
            currentYearData[month]++;
        } else if (year === currentYear - 1) {
            previousYearData[month]++;
        }
    });

    // Create datasets array
    const datasets = [{
        label: `${currentYear}`,
        data: currentYearData,
        borderColor: '#2da0a8',
        backgroundColor: 'rgba(45, 160, 168, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#2da0a8',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
    }];

    // Add previous year data if available
    const hasPreviousYearData = previousYearData.some(count => count > 0);
    if (hasPreviousYearData) {
        datasets.unshift({
            label: `${currentYear - 1}`,
            data: previousYearData,
            borderColor: '#6c757d',
            backgroundColor: 'rgba(108, 117, 125, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#6c757d',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            borderDash: [5, 5]
        });
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: datasets.length > 1
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} appointment${context.parsed.y !== 1 ? 's' : ''}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return Math.floor(value);
                        }
                    }
                }
            }
        }
    });
}

function createHealthOverviewChart() {
    const ctx = document.getElementById('healthOverviewChart');
    if (!ctx || !currentPatientData) return;

    const appointments = currentPatientData.appointments;
    const now = new Date();

    // Calculate health scores for the last 12 months
    const healthScores = [];
    const months = [];

    for (let i = 11; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });
        months.push(monthName);

        // Calculate health score for this month
        const monthScore = calculateMonthlyHealthScore(appointments, targetDate);
        healthScores.push(monthScore);
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Health Score',
                data: healthScores,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#28a745',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Health Score: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 0,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function calculateMonthlyHealthScore(appointments, targetMonth) {
    const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

    // Get appointments for this month
    const monthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= monthStart && aptDate <= monthEnd;
    });

    // Base score
    let score = 50;

    // Factor 1: Number of appointments (regular check-ups are good)
    if (monthAppointments.length > 0) {
        score += Math.min(monthAppointments.length * 8, 25); // Max 25 points for appointments
    }

    // Factor 2: Diversity of specialties (seeing different specialists shows comprehensive care)
    const specialties = new Set(monthAppointments.map(apt => apt.specialty || apt.type));
    score += Math.min(specialties.size * 5, 15); // Max 15 points for specialty diversity

    // Factor 3: Different doctors (building relationships with healthcare providers)
    const doctors = new Set(monthAppointments.map(apt => apt.doctorName || apt.doctor));
    score += Math.min(doctors.size * 3, 10); // Max 10 points for doctor diversity

    // Factor 4: Preventive care (regular check-ups vs emergency visits)
    const preventiveTypes = ['check-up', 'consultation', 'follow-up', 'general'];
    const preventiveAppointments = monthAppointments.filter(apt =>
        preventiveTypes.some(type => (apt.type || '').toLowerCase().includes(type))
    );
    if (monthAppointments.length > 0) {
        const preventiveRatio = preventiveAppointments.length / monthAppointments.length;
        score += preventiveRatio * 10; // Max 10 points for preventive care
    }

    // Factor 5: Consistency with previous months (trend analysis)
    const previousMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() - 1, 1);
    const prevMonthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= previousMonth && aptDate < monthStart;
    });

    if (prevMonthAppointments.length > 0 && monthAppointments.length > prevMonthAppointments.length) {
        score += 5; // Bonus for increasing healthcare engagement
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, Math.round(score)));
}

function createSpecialtiesChart() {
    const ctx = document.getElementById('specialtyChart');
    if (!ctx || !currentPatientData) return;

    const appointments = currentPatientData.appointments;
    const specialtyCount = {};

    appointments.forEach(apt => {
        const specialty = apt.specialty || apt.type || 'General Medicine';
        // Normalize specialty names
        const normalizedSpecialty = normalizeSpecialtyName(specialty);
        specialtyCount[normalizedSpecialty] = (specialtyCount[normalizedSpecialty] || 0) + 1;
    });

    const labels = Object.keys(specialtyCount);
    const data = Object.values(specialtyCount);

    // Specialty-specific colors
    const specialtyColors = {
        'Cardiology': '#e74c3c',
        'Dentistry': '#f39c12',
        'Neurology': '#9b59b6',
        'Ophthalmology': '#3498db',
        'General Medicine': '#2ecc71',
        'Dermatology': '#e67e22',
        'Orthopedics': '#1abc9c',
        'Pediatrics': '#f1c40f',
        'Gynecology': '#e84393',
        'Psychiatry': '#8e44ad',
        'Radiology': '#34495e',
        'Surgery': '#c0392b'
    };

    const backgroundColors = labels.map(label => specialtyColors[label] || '#95a5a6');
    const borderColors = backgroundColors.map(color => color);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 3,
                hoverBorderWidth: 5,
                hoverBorderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.parsed / total) * 100);
                            return `${context.label}: ${context.parsed} appointment${context.parsed !== 1 ? 's' : ''} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function normalizeSpecialtyName(specialty) {
    const specialtyMap = {
        'cardiology': 'Cardiology',
        'heart': 'Cardiology',
        'cardio': 'Cardiology',
        'dentistry': 'Dentistry',
        'dental': 'Dentistry',
        'dentist': 'Dentistry',
        'neurology': 'Neurology',
        'brain': 'Neurology',
        'neuro': 'Neurology',
        'ophthalmology': 'Ophthalmology',
        'eye': 'Ophthalmology',
        'ophtalmology': 'Ophthalmology',
        'general medicine': 'General Medicine',
        'general': 'General Medicine',
        'médecine générale': 'General Medicine',
        'généraliste': 'General Medicine',
        'dermatology': 'Dermatology',
        'skin': 'Dermatology',
        'dermato': 'Dermatology',
        'orthopedics': 'Orthopedics',
        'ortho': 'Orthopedics',
        'bone': 'Orthopedics',
        'pediatrics': 'Pediatrics',
        'pediatric': 'Pediatrics',
        'children': 'Pediatrics',
        'gynecology': 'Gynecology',
        'gyn': 'Gynecology',
        'women': 'Gynecology',
        'psychiatry': 'Psychiatry',
        'psych': 'Psychiatry',
        'mental': 'Psychiatry',
        'radiology': 'Radiology',
        'radio': 'Radiology',
        'imaging': 'Radiology',
        'surgery': 'Surgery',
        'chirurgie': 'Surgery',
        'consultation': 'General Medicine',
        'check-up': 'General Medicine',
        'follow-up': 'General Medicine'
    };

    const lowerSpecialty = specialty.toLowerCase();
    return specialtyMap[lowerSpecialty] || specialty.charAt(0).toUpperCase() + specialty.slice(1).toLowerCase();
}

// ── Utility Functions ───────────────────────────────────────────────────────
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Determine icon based on type
    let iconClass;
    if (type === 'success') {
        iconClass = 'check-circle';
    } else if (type === 'error') {
        iconClass = 'exclamation-triangle';
    } else {
        iconClass = 'info-circle';
    }

    notification.innerHTML = `
        <i class="fas fa-${iconClass}"></i>
        <span>${message}</span>
    `;

    // Determine colors based on type
    let backgroundColor, textColor;
    if (type === 'success') {
        backgroundColor = '#d4edda';
        textColor = '#155724';
    } else if (type === 'error') {
        backgroundColor = '#f8d7da';
        textColor = '#721c24';
    } else {
        backgroundColor = '#d1ecf1';
        textColor = '#0c5460';
    }

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: ${textColor};
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ── Sidebar Management ──────────────────────────────────────────────────────
function loadAvatar() {
    const avatarContainer = document.querySelector('.avatar-img');
    if (avatarContainer) {
        updateAvatarDisplay(avatarContainer);
    }
}

function updateSidebar() {
    const userName = localStorage.getItem('userName') || '';
    const sidebarName = document.querySelector('.patient-info h4');
    if (sidebarName) {
        sidebarName.textContent = userName;
    }

    const avatarContainer = document.querySelector('.avatar-img');
    if (avatarContainer) {
        updateAvatarDisplay(avatarContainer);
    }
}

function updateAvatarDisplay(avatarContainer) {
    const savedImage = localStorage.getItem('userAvatar');

    avatarContainer.innerHTML = '';

    if (savedImage) {
        const img = document.createElement('img');
        img.src = savedImage;
        img.alt = 'Avatar';
        img.onload = () => {
            img.style.display = 'block';
        };
        avatarContainer.appendChild(img);
    } else {
        const userName = localStorage.getItem('userName') || '';
        const nameParts = userName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[1] || '';
        let initials = firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
        if (!initials.trim()) initials = '';

        const span = document.createElement('span');
        span.textContent = initials;
        avatarContainer.appendChild(span);
    }
}

// ── Logout Functionality ────────────────────────────────────────────────────
const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('firstName');
        localStorage.removeItem('lastName');
        localStorage.removeItem('email');
        localStorage.removeItem('userId');
        localStorage.removeItem('userAvatar');
        globalThis.location.replace('/login');
    });
}