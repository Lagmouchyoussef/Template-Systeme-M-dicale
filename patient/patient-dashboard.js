// ── Auth Guard ─────────────────────────────────────────────────────────────
(function() {
    const role = localStorage.getItem('userRole');
    if (!role || role !== 'patient') {
        globalThis.location.replace('../login/index.html');
    }
})();

// ── Global Variables ────────────────────────────────────────────────────────
let currentPatientData = null;
let trendsChart = null;
let overviewChart = null;
let specialtiesChart = null;

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
    syncSidebar();
    
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
            initializeCharts();
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
    setActiveSidebarItem();
    initSidebarNavigation();
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
    const appointmentHistory = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');

    // Filter data for current patient
    const patientAppointments = filterPatientData(confirmedAppointments, patientId, patientName, patientEmail);
    const patientRequests = filterPatientData(appointmentRequests, patientId, patientName, patientEmail);
    const patientHistory = filterPatientData(appointmentHistory, patientId, patientName, patientEmail);
    const activeInvitations = patientInvitations.filter(inv => !['declined', 'cancelled'].includes(inv.status));

    const allPatientAppointments = [...patientAppointments, ...patientHistory, ...patientRequests];

    // Update dashboard
    updateWelcomeSection(patientName);
    updateKeyMetrics(patientAppointments, patientHistory, patientRequests, activeInvitations);
    updateAppointmentStatistics(allPatientAppointments);
    updateSpecialtyBreakdown(allPatientAppointments);
    updateUpcomingAppointments(patientAppointments, patientRequests);
    updateRecentActivity(allPatientAppointments, []); // allPatientAppointments already contains requests
    updateDoctorsList(allPatientAppointments);
    updatePendingInvitations(activeInvitations);

    // Store for charts
    currentPatientData = {
        appointments: allPatientAppointments,
        requests: patientRequests,
        invitations: activeInvitations,
        history: patientHistory
    };
}

function filterPatientData(data, patientId, patientName, patientEmail) {
    return data.filter(item => {
        const itemId = item.patientId || item.userId || (item.patient && (item.patient.id || item.patient.userId)) || '';
        const itemName = (item.patientName || item.name || (item.patient && item.patient.name) || '').toLowerCase();
        const itemEmail = (item.patientEmail || item.email || (item.patient && item.patient.email) || '').toLowerCase();

        return (itemId && String(itemId) === String(patientId)) ||
               (itemName && itemName.includes(patientName.toLowerCase())) ||
               (itemEmail && itemEmail === patientEmail.toLowerCase());
    });
}

// ── UI Update Functions ─────────────────────────────────────────────────────
function updateWelcomeSection(patientName) {
    const welcomeName = document.getElementById('welcome-name');
    if (welcomeName) {
        welcomeName.textContent = patientName.split(' ')[0] || 'Patient';
    }
}

function updateKeyMetrics(appointments, history, requests, invitations) {
    const allAppointments = [...appointments, ...history];
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
    const totalAppointments = allAppointments.length;
    const doctorsCount = new Set(allAppointments.map(apt => apt.doctorName || apt.doctor)).size;
    const pendingInvitations = invitations.filter(inv => inv.status === 'pending').length;

    // Calculate health score (simple algorithm based on appointment regularity)
    const healthScore = calculateHealthScore(allAppointments, requests);

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
        appointmentsTrend.innerHTML = `<i class="fas fa-arrow-${appointmentsChange >= 0 ? 'up' : 'down'}"></i> ${Math.abs(appointmentsChange)} this month`;
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
                <h3>No upcoming appointments</h3>
                <p>Schedule an appointment with a doctor to start your medical follow-up.</p>
                <button class="btn-primary" onclick="window.location.href='appointments.html'">
                    Schedule Appointment
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = upcoming.map(item => createAppointmentCard(item)).join('');
}

function createAppointmentCard(item) {
    const isConfirmed = item.status === 'confirmed' || item.status === 'completed';
    const doctorName = item.doctorName || item.doctor || 'Doctor not specified';
    const appointmentDate = new Date(item.date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const time = item.time || 'Time not specified';
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
                    ${isConfirmed ? 'Confirmed' : 'Pending'}
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
                <h3>No recent activity</h3>
                <p>Your medical activities will appear here once you start using the platform.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = recentItems.map(item => createActivityItem(item)).join('');
}

function createActivityItem(item) {
    const date = new Date(item.date || item.requestDate);
    const formattedDate = date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short'
    });

    const isAppointment = item.status && ['confirmed', 'completed', 'cancelled'].includes(item.status);
    const doctorName = item.doctorName || item.doctor || 'Doctor';
    const type = item.type || 'Consultation';

    let icon, title, description;

    if (isAppointment) {
        if (item.status === 'completed') {
            icon = 'fas fa-check-circle';
            title = `Appointment completed with ${doctorName}`;
            description = `${type} - ${formattedDate}`;
        } else if (item.status === 'confirmed') {
            icon = 'fas fa-calendar-check';
            title = `Appointment confirmed with ${doctorName}`;
            description = `${type} - ${formattedDate}`;
        } else {
            icon = 'fas fa-times-circle';
            title = `Appointment cancelled with ${doctorName}`;
            description = `${type} - ${formattedDate}`;
        }
    } else {
        icon = 'fas fa-envelope';
        title = `Appointment request sent to ${doctorName}`;
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
        if (doctorName && doctorName !== 'Doctor not specified') {
            if (!doctorsMap.has(doctorName)) {
                doctorsMap.set(doctorName, {
                    name: doctorName,
                    specialty: apt.specialty || apt.type || 'General Medicine',
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
                <h3>No doctors consulted</h3>
                <p>Start by scheduling an appointment with a doctor to establish your medical network.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = doctors.map(doctor => createDoctorCard(doctor)).join('');
}

function createDoctorCard(doctor) {
    const lastAppointment = doctor.lastAppointment ?
        new Date(doctor.lastAppointment).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }) : 'Never';

    return `
        <div class="premium-doctor-card">
            <div class="premium-doctor-avatar">
                ${doctor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div class="premium-doctor-info">
                <h4>${doctor.name}</h4>
                <p class="premium-doctor-specialty">${doctor.specialty}</p>
                <div class="premium-doctor-stats">
                    <span><i class="fas fa-calendar-alt"></i> ${doctor.appointmentsCount} appointment${doctor.appointmentsCount !== 1 ? 's' : ''}</span>
                    <span><i class="fas fa-clock"></i> Last: ${lastAppointment}</span>
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
    const doctorName = invitation.doctor?.name || 'Doctor';
    const appointmentDate = new Date(invitation.date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
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
                    Pending
                </div>
            </div>
            <div class="invitation-details">
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formattedDate}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>${invitation.time || 'Time to confirm'}</span>
                </div>
            </div>
            <div class="invitation-actions">
                <button class="btn-accept" onclick="acceptInvitation('${invitation.id}')">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="btn-decline" onclick="declineInvitation('${invitation.id}')">
                    <i class="fas fa-times"></i> Decline
                </button>
            </div>
        </div>
    `;
}

// ── Invitation Management ───────────────────────────────────────────────────
function acceptInvitation(invitationId) {
    updateInvitationStatus(invitationId, 'accepted');
    showNotification('Invitation accepted successfully!', 'success');
    loadDashboardData();
}

function declineInvitation(invitationId) {
    updateInvitationStatus(invitationId, 'declined');
    showNotification('Invitation declined.', 'info');
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

    if (trendsChart) {
        trendsChart.destroy();
    }

    trendsChart = new Chart(ctx, {
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
        'Surgery': '#c0392b',
        'Emergency': '#dc3545'
    };

    const backgroundColors = labels.map(label => specialtyColors[label] || '#95a5a6');
    const borderColors = backgroundColors.map(color => color);

    if (specialtiesChart) {
        specialtiesChart.destroy();
    }

    specialtiesChart = new Chart(ctx, {
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
        'emergency': 'Emergency',
        'urgence': 'Emergency',
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
    // Check if sync.js showToast is available
    if (typeof showToast === 'function') {
        showToast(message, type);
        return;
    }
    // Fallback to internal notification
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
function setActiveSidebarItem() {
    const path = window.location.pathname;
    let activePage = 'dashboard';

    if (path.includes('appointments.html')) {
        activePage = 'appointments';
    } else if (path.includes('history.html')) {
        activePage = 'history';
    } else if (path.includes('settings.html')) {
        activePage = 'settings';
    }

    const items = document.querySelectorAll('.sidebar-menu .nav-item');
    items.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === activePage) {
            item.classList.add('active');
        }
    });
}

function initSidebarNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-menu .nav-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            if (!targetPage) return;

            switch (targetPage) {
                case 'dashboard':
                    window.location.href = 'patient.html';
                    break;
                case 'appointments':
                    window.location.href = 'appointments.html';
                    break;
                case 'history':
                    window.location.href = 'history.html';
                    break;
                case 'settings':
                    window.location.href = 'settings.html';
                    break;
                default:
                    console.warn('Unknown page:', targetPage);
            }
        });
    });
}

// ── Avatar Management (Legacy support, though sync.js is preferred) ──────────
function loadAvatar() {
    if (typeof syncSidebarAvatar === 'function') {
        syncSidebarAvatar();
    }
}

function updateSidebar() {
    if (typeof syncSidebar === 'function') {
        syncSidebar();
    }
}

// ── Logout Functionality ────────────────────────────────────────────────────
const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        if (typeof logout === 'function') {
            logout();
        } else {
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            localStorage.removeItem('firstName');
            localStorage.removeItem('lastName');
            localStorage.removeItem('email');
            localStorage.removeItem('userId');
            localStorage.removeItem('userAvatar');
            globalThis.location.replace('../login/index.html');
        }
    });
}