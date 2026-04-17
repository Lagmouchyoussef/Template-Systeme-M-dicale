// ── Auth Guard ─────────────────────────────────────────────────────────────
(function() {
    const role = localStorage.getItem('userRole');
    if (!role || role !== 'patient') {
        window.location.href = '/login/index.html';
    }
})();

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




// History Page JavaScript

class AppointmentHistory {
    constructor() {
        this.appointments = [];
        this.filteredAppointments = [];
        this.page = 1;
        this.hasMore = true;
        this.loading = false;
        this.searchTerm = '';
        this.filterMonth = '';
        this.filterYear = '';

        // Mock data for demonstration
        this.mockAppointments = this.generateMockData();

        this.init();
    }

    generateMockData() {
        // Return empty array - no demonstration data
        return [];
    }

    init() {
        this.setupEventListeners();
        this.updateSidebar(); // Update with current data
        this.loadAppointments(true);
        // Update statistics immediately
        setTimeout(() => this.updateStatistics(), 100);

        // Log initialization
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }

        // Month filter
        const monthFilter = document.getElementById('month-filter');
        if (monthFilter) {
            monthFilter.addEventListener('change', (e) => {
                this.filterMonth = e.target.value;
                this.applyFilters();
            });
        }

        // Year filter
        const yearFilter = document.getElementById('year-filter');
        if (yearFilter) {
            yearFilter.addEventListener('change', (e) => {
                this.filterYear = e.target.value;
                this.applyFilters();
            });
        }

        // Clear filters
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.searchTerm = '';
                this.filterMonth = '';
                this.filterYear = '';
                if (searchInput) searchInput.value = '';
                if (monthFilter) monthFilter.value = '';
                if (yearFilter) yearFilter.value = '';
                this.applyFilters();
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreAppointments();
            });
        }

        // Retry button
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.loadAppointments(true);
            });
        }

        // Modal events
        const modalClose = document.getElementById('modal-close');
        const cancelReschedule = document.getElementById('cancel-reschedule');
        const rescheduleForm = document.getElementById('reschedule-form');

        if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
        if (cancelReschedule) cancelReschedule.addEventListener('click', () => this.closeModal());

        // Form submission
        if (rescheduleForm) {
            rescheduleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReschedule();
            });
        }


        // Listen for localStorage changes to update sidebar
        window.addEventListener('storage', (e) => {
            if (e.key === 'userName' || e.key === 'firstName' || e.key === 'lastName') {
                this.updateSidebar();
            }
        });
    }

    updateSidebar() {
        // Update name
        const userName = localStorage.getItem('userName') || '';
        const sidebarName = document.querySelector('.patient-info h4');
        if (sidebarName) {
            sidebarName.textContent = userName;
        }
        // Update avatar
        const avatarContainer = document.querySelector('.avatar-img');
        if (avatarContainer) {
            updateAvatarDisplay(avatarContainer);
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('reschedule-modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    async loadAppointments(reset = false) {
        this.showLoading();

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (reset) {
                this.page = 1;
                this.appointments = [];
                this.hasMore = true;
            }

            // Get next batch of appointments
            const startIndex = (this.page - 1) * 10;
            const endIndex = startIndex + 10;
            const newAppointments = this.mockAppointments.slice(startIndex, endIndex);

            this.appointments = reset ? newAppointments : [...this.appointments, ...newAppointments];
            this.hasMore = endIndex < this.mockAppointments.length;

            this.applyFilters();

        } catch (error) {
            this.showError();
        } finally {
            this.hideLoading();
        }
    }

    async loadMoreAppointments() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        const originalText = loadMoreBtn.innerHTML;

        loadMoreBtn.classList.add('loading');
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';

        try {
            this.page++;
            await this.loadAppointments(false);
        } catch (error) {
            this.page--; // Revert page increment on error
        } finally {
            loadMoreBtn.classList.remove('loading');
            loadMoreBtn.innerHTML = originalText;
        }
    }

    applyFilters() {
        let filtered = this.appointments;

        // Search filter
        if (this.searchTerm) {
            filtered = filtered.filter(apt =>
                apt.doctorName.toLowerCase().includes(this.searchTerm) ||
                apt.specialty.toLowerCase().includes(this.searchTerm) ||
                apt.reason?.toLowerCase().includes(this.searchTerm) ||
                apt.notes?.toLowerCase().includes(this.searchTerm)
            );
        }

        // Date filters
        if (this.filterMonth || this.filterYear) {
            filtered = filtered.filter(apt => {
                const aptDate = new Date(apt.date);
                const aptMonth = (aptDate.getMonth() + 1).toString().padStart(2, '0');
                const aptYear = aptDate.getFullYear().toString();

                return (!this.filterMonth || aptMonth === this.filterMonth) &&
                       (!this.filterYear || aptYear === this.filterYear);
            });
        }

        this.filteredAppointments = filtered;
        this.renderAppointments();
        this.updateLoadMoreVisibility();
    }

    renderAppointments() {
        const container = document.getElementById('appointments-list');
        if (!container) return;

        if (this.filteredAppointments.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        // Update statistics
        this.updateStatistics();

        container.innerHTML = this.filteredAppointments.map(apt => `
            <div class="appointment-card">
                <div class="appointment-header">
                    <div class="appointment-title">
                        <h3>${apt.doctorName}</h3>
                        <span class="status-badge status-${apt.status}">
                            ${this.getStatusText(apt.status)}
                        </span>
                    </div>
                    <div class="appointment-actions">
                        ${apt.status === 'completed' ? `
                            <button class="btn-secondary reschedule-btn" data-id="${apt.id}">
                                <i class="fas fa-calendar-alt"></i> Reprogrammer
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="appointment-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatDate(apt.date)}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>${apt.time}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-stethoscope"></i>
                        <span>${apt.specialty}</span>
                    </div>
                </div>

                ${apt.reason ? `
                    <div class="appointment-reason">
                        <p><strong>Motif:</strong> ${apt.reason}</p>
                    </div>
                ` : ''}

                ${apt.notes ? `
                    <div class="appointment-reason">
                        <p><strong>Notes:</strong> ${apt.notes}</p>
                    </div>
                ` : ''}
            </div>
        `).join('');

        // Add event listeners to reschedule buttons
        const rescheduleButtons = container.querySelectorAll('.reschedule-btn');
        rescheduleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const appointmentId = e.currentTarget.dataset.id;
                const appointment = this.appointments.find(apt => apt.id === appointmentId);
                if (appointment) {
                    this.openRescheduleModal(appointment);
                }
            });
        });
    }

    updateStatistics() {
        const totalAppointments = document.getElementById('total-appointments');
        const completedAppointments = document.getElementById('completed-appointments');
        const upcomingAppointments = document.getElementById('upcoming-appointments');

        if (!totalAppointments && !completedAppointments && !upcomingAppointments) return;

        // Calculate statistics from all appointments (not just filtered)
        const allAppointments = this.mockAppointments;
        const total = allAppointments.length;
        const completed = allAppointments.filter(apt => apt.status === 'completed').length;
        const upcoming = allAppointments.filter(apt => apt.status === 'upcoming').length;

        if (totalAppointments) totalAppointments.textContent = total.toString();
        if (completedAppointments) completedAppointments.textContent = completed.toString();
        if (upcomingAppointments) upcomingAppointments.textContent = upcoming.toString();
    }

    getStatusText(status) {
        const statusMap = {
            completed: 'Completed',
            cancelled: 'Cancelled',
            missed: 'Missed',
            upcoming: 'Upcoming'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    openRescheduleModal(appointment) {
        const modal = document.getElementById('reschedule-modal');
        const appointmentInfo = document.getElementById('modal-appointment-info');
        const rescheduleDate = document.getElementById('reschedule-date');
        const rescheduleForm = document.getElementById('reschedule-form');

        if (!modal || !appointmentInfo || !rescheduleDate || !rescheduleForm) return;

        appointmentInfo.innerHTML = `
            <h4>${appointment.doctorName}</h4>
            <p><strong>Specialty:</strong> ${appointment.specialty}</p>
            <p><strong>Current date:</strong> ${this.formatDate(appointment.date)}</p>
            <p><strong>Current time:</strong> ${appointment.time}</p>
        `;

        // Set minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];
        rescheduleDate.min = minDate;

        // Reset form
        rescheduleForm.reset();

        modal.style.display = 'block';
        this.selectedAppointment = appointment;
    }

    closeModal() {
        const modal = document.getElementById('reschedule-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.selectedAppointment = null;
    }

    async handleReschedule() {
        const dateInput = document.getElementById('reschedule-date');
        const timeSelect = document.getElementById('reschedule-time');
        const reasonTextarea = document.getElementById('reschedule-reason');

        if (!dateInput.value || !timeSelect.value) {
            showStyledMessage('Please select a date and time.', 'warning');
            return;
        }

        // Simulate API call
        const submitBtn = document.querySelector('#reschedule-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Reprogrammation...';
        submitBtn.disabled = true;

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            showStyledMessage('Appointment rescheduled: ' + JSON.stringify({
                appointmentId: this.selectedAppointment.id,
                newDate: dateInput.value,
                newTime: timeSelect.value,
                reason: reasonTextarea.value
            }), 'debug');

            this.showSuccessToast();
            this.closeModal();

        } catch (error) {
            showStyledMessage('Error rescheduling appointment. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    showSuccessToast() {
        const toast = document.getElementById('success-toast');
        toast.style.display = 'flex';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    showLoading() {
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        const emptyState = document.getElementById('empty-state');
        const appointmentsList = document.getElementById('appointments-list');

        if (loadingState) loadingState.style.display = 'block';
        if (errorState) errorState.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        if (appointmentsList) appointmentsList.style.display = 'none';
    }

    hideLoading() {
        const loadingState = document.getElementById('loading-state');
        const appointmentsList = document.getElementById('appointments-list');

        if (loadingState) loadingState.style.display = 'none';
        if (appointmentsList) appointmentsList.style.display = 'flex';
    }

    showError() {
        const errorState = document.getElementById('error-state');
        const appointmentsList = document.getElementById('appointments-list');
        const emptyState = document.getElementById('empty-state');

        if (errorState) errorState.style.display = 'block';
        if (appointmentsList) appointmentsList.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
    }

    showEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const appointmentsList = document.getElementById('appointments-list');

        if (emptyState) emptyState.style.display = 'block';
        if (appointmentsList) appointmentsList.style.display = 'none';
    }

    hideEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const appointmentsList = document.getElementById('appointments-list');

        if (emptyState) emptyState.style.display = 'none';
        if (appointmentsList) appointmentsList.style.display = 'flex';
    }

    updateLoadMoreVisibility() {
        const loadMoreContainer = document.getElementById('load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.style.display = this.hasMore ? 'block' : 'none';
        }
    }
}

// Initialize the history page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const hasHistoryElements = document.getElementById('search-input') || document.getElementById('appointments-list');
    if (hasHistoryElements) {
        new AppointmentHistory();
    }
    loadAvatar();
});

// Avatar management
function loadAvatar() {
    const avatarContainer = document.querySelector('.avatar-img');
    if (avatarContainer) {
        updateAvatarDisplay(avatarContainer);
    }

    // Listen for avatar updates from other pages
    window.addEventListener('avatarUpdated', () => {
        const avatarContainer = document.querySelector('.avatar-img');
        if (avatarContainer) {
            updateAvatarDisplay(avatarContainer);
        }
    });
}

function updateAvatarDisplay(avatarContainer) {
    const savedImage = localStorage.getItem('userAvatar');

    // Clear existing content
    avatarContainer.innerHTML = '';

    if (savedImage) {
        // Display saved image
        const img = document.createElement('img');
        img.src = savedImage;
        img.alt = 'Avatar';
        img.onload = () => {
            img.style.display = 'block';
        };
        avatarContainer.appendChild(img);
    } else {
        // Display initials
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

