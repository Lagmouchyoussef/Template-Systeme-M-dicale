// ── Auth Guard ─────────────────────────────────────────────────────────────
(function() {
    const role = localStorage.getItem('userRole');
    if (!role || role !== 'patient') {
        window.location.replace('../login/index.html');
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

/**
 * Shows a custom confirmation modal
 * @param {string} title Modal title
 * @param {string} message Modal message
 * @param {string} type 'danger' or 'info'
 * @param {function} onConfirm Callback on confirm
 */
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




function buildSlotsFromStoredAvailability(date) {
    const saved = localStorage.getItem('doctorAvailability');
    if (!saved) return [];
    let availability;
    try {
        availability = JSON.parse(saved);
    } catch {
        return [];
    }
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const selectedDayName = dayNames[date.getDay()];
    if (!availability.days || !availability.days.includes(selectedDayName)) {
        return [];
    }
    const startTime = availability.startTime || '09:00';
    const endTime = availability.endTime || '17:00';
    const startHour = parseInt(startTime.split(':')[0], 10);
    const startMinute = parseInt(startTime.split(':')[1], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    const endMinute = parseInt(endTime.split(':')[1], 10);
    const slots = [];
    let currentHour = startHour;
    let currentMinute = startMinute;
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        slots.push(
            `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
        );
        currentMinute += 30;
        if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour++;
        }
    }
    return slots;
}

// Appointments Page JavaScript

class AppointmentCalendar {
    constructor() {
        window.calendarApp = this; // Set early to avoid undefined errors if init crashes
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedDoctor = null;
        this.availableSlots = {};
        this.isEmergency = false;

        this.initializeAvailableSlotsFromStorage();

        this.init();
    }

    initializeAvailableSlotsFromStorage() {
        this.availableSlots = {};
        const doctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
        const baseDate = new Date();

        for (let i = 0; i < 30; i++) {
            const date = new Date(baseDate);
            date.setDate(baseDate.getDate() + i);

            const dateKey = this.formatDate(date);
            this.availableSlots[dateKey] = {};
            const slotsForDay = buildSlotsFromStoredAvailability(date);
            doctors.forEach((doctor) => {
                this.availableSlots[dateKey][doctor.id] = [...slotsForDay];
            });
        }
    }

    populateDoctorSelect() {
        const select = document.getElementById('doctor-select');
        if (!select) return;
        select.innerHTML = '<option value="">Select a doctor</option>';
        JSON.parse(localStorage.getItem('registeredDoctors') || '[]').forEach((d) => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = `${d.name} (${d.email})`;
            select.appendChild(opt);
        });
    }

    init() {
        this.populateDoctorSelect();
        this.renderCalendar();
        this.setupEventListeners();
        this.setupEmergencyToggle();
        this.loadAppointmentInvitations();
        this.loaddoctorAppointments();
        this.updateSidebar(); // Update with current data
    }

    setupEventListeners() {
        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Doctor selection
        document.getElementById('doctor-select').addEventListener('change', (e) => {
            this.selectedDoctor = e.target.value;
            this.updateTimeSlots();
        });

        // Appointment type selection
        document.getElementById('appointment-type').addEventListener('change', (e) => {
            const otherTypeGroup = document.getElementById('other-type-group');
            const otherTypeInput = document.getElementById('other-type');

            if (e.target.value === 'other') {
                otherTypeGroup.style.display = 'block';
                otherTypeInput.required = true;
                otherTypeInput.focus();
            } else {
                otherTypeGroup.style.display = 'none';
                otherTypeInput.required = false;
                otherTypeInput.value = '';
            }
        });

        // Form submission
        document.getElementById('appointment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBooking();
        });
        // Privacy modal
        const privacyLink = document.querySelector('.privacy-link');
        if (privacyLink) {
            privacyLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPrivacyModal();
            });
        }

        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.hidePrivacyModal();
            });
        }

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('privacy-modal');
            if (e.target === modal) {
                this.hidePrivacyModal();
            }
        });

        // Listen for localStorage changes to update sidebar
        window.addEventListener('storage', (e) => {
            if (e.key === 'userName' || e.key === 'firstName' || e.key === 'lastName') {
                this.updateSidebar();
            }
            if (e.key === 'doctorAppointments' || e.key.includes('_invitations') || e.key === 'appointmentRequests') {
                this.loadAppointmentInvitations();
                this.loaddoctorAppointments();
            }
        });
    }

    setupEmergencyToggle() {
        const toggle = document.getElementById('emergency-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', () => {
            this.isEmergency = !this.isEmergency;
            if (this.isEmergency) {
                toggle.style.background = '#dc3545';
                toggle.style.color = 'white';
                document.getElementById('appointment-type').value = 'emergency';
            } else {
                toggle.style.background = 'transparent';
                toggle.style.color = '#dc3545';
                document.getElementById('appointment-type').value = '';
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
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Update calendar title
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('calendar-title').textContent = `${monthNames[month]} ${year}`;

        // Clear previous days
        const daysContainer = document.getElementById('calendar-days');
        daysContainer.innerHTML = '';

        // Get first day of month and last day
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // Generate calendar days
        for (let i = 0; i < 42; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';

            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);

            const dayNumber = currentDay.getDate();
            dayElement.textContent = dayNumber;

            // Check if day is in current month
            if (currentDay.getMonth() !== month) {
                dayElement.classList.add('disabled');
            } else if (this.isToday(currentDay)) {
                dayElement.classList.add('today');
            } else if (this.isPastDate(currentDay)) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => this.selectDate(currentDay));
            }

            // Highlight selected date
            if (this.selectedDate && this.datesEqual(currentDay, this.selectedDate)) {
                dayElement.classList.add('selected');
            }

            daysContainer.appendChild(dayElement);
        }
    }

    selectDate(date) {
        this.selectedDate = date;
        document.getElementById('selected-date').value = this.formatDateReadable(date);
        this.renderCalendar();
        this.updateTimeSlots();
    }

    updateTimeSlots() {
        const timeSlotsContainer = document.getElementById('time-slots');
        timeSlotsContainer.innerHTML = '';

        if (!this.selectedDate || !this.selectedDoctor) {
            timeSlotsContainer.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">Please select a date and doctor first.</p>';
            return;
        }

        const dateKey = this.formatDate(this.selectedDate);
        const slots = (this.availableSlots[dateKey] && this.availableSlots[dateKey][this.selectedDoctor]) ? this.availableSlots[dateKey][this.selectedDoctor] : [];

        if (slots.length === 0) {
            timeSlotsContainer.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">No available slots for this date.</p>';
            return;
        }

        slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'time-slot';
            slotElement.textContent = slot;
            slotElement.addEventListener('click', () => this.selectTimeSlot(slotElement, slot));
            timeSlotsContainer.appendChild(slotElement);
        });
    }

    selectTimeSlot(element, time) {
        // Remove previous selection
        document.querySelectorAll('.time-slot.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new slot
        element.classList.add('selected');
        this.selectedTime = time;
    }

    handleBooking() {
        if (!this.validateForm()) {
            return;
        }

        // Simulate booking process
        const appointmentType = document.getElementById('appointment-type').value;
        const customType = appointmentType === 'other' ? document.getElementById('other-type').value : '';

        const bookingData = {
            date: this.selectedDate,
            time: this.selectedTime,
            doctor: this.selectedDoctor,
            type: appointmentType,
            customType: customType,
            reason: document.getElementById('reason').value,
            email: document.getElementById('contact-email').value,
            phone: document.getElementById('contact-phone').value
        };

        // Show loading state
        const submitBtn = document.querySelector('.btn-book-appointment');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
        submitBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            // Save actual booking
            const patientId = localStorage.getItem('userId');
            const patientName = localStorage.getItem('userName');
            
            const realBooking = {
                id: 'APT' + Date.now(),
                patientId: patientId,
                patientName: patientName,
                doctor: this.selectedDoctor,
                doctorName: document.getElementById('doctor-select').options[document.getElementById('doctor-select').selectedIndex].text.split(' (')[0],
                date: this.formatDate(this.selectedDate),
                time: this.selectedTime,
                type: this.isEmergency ? 'emergency' : appointmentType,
                reason: document.getElementById('reason').value,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            const requests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
            requests.push(realBooking);
            localStorage.setItem('appointmentRequests', JSON.stringify(requests));

            // Architect Sync: Notify Doctor in real-time
            if (window.MediSyncNotifications) {
                window.MediSyncNotifications.push(
                    `New appointment request from ${patientName}`,
                    'fa-calendar-plus',
                    'doctor'
                );
            }

            showStyledMessage('Appointment booked successfully! Waiting for doctor confirmation.', 'success');
            
            this.loaddoctorAppointments();
            this.resetForm();

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            // Simulate email reminder
            this.sendEmailReminder(bookingData);
        }, 1500);
    }

    resetForm() {
        document.getElementById('appointment-form').reset();
        this.selectedDate = null;
        this.selectedTime = null;
        this.isEmergency = false;
        const toggle = document.getElementById('emergency-toggle');
        if (toggle) {
            toggle.style.background = 'transparent';
            toggle.style.color = '#dc3545';
        }
        this.renderCalendar();
        this.updateTimeSlots();
    }

    validateForm() {
        const requiredFields = [
            'selected-date',
            'doctor-select',
            'appointment-type',
            'reason',
            'contact-email',
            'contact-phone'
        ];

        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.style.borderColor = '#dc3545';
                isValid = false;
            } else {
                field.style.borderColor = 'var(--border-color)';
            }
        });

        // Check if "other" type is specified when selected
        const appointmentType = document.getElementById('appointment-type').value;
        const otherTypeInput = document.getElementById('other-type');
        if (appointmentType === 'other' && !otherTypeInput.value.trim()) {
            otherTypeInput.style.borderColor = '#dc3545';
            isValid = false;
        } else {
            otherTypeInput.style.borderColor = 'var(--border-color)';
        }

        // Check if time slot is selected
        if (!this.selectedTime) {
            document.getElementById('time-slots').style.border = '1px solid #dc3545';
            isValid = false;
        } else {
            document.getElementById('time-slots').style.border = 'none';
        }

        // Check GDPR consent
        if (!document.getElementById('gdpr-consent').checked) {
            isValid = false;
        showStyledMessage('Please accept the privacy notice to continue.', 'warning');
        }

        return isValid;
    }

    showBookingSuccess(bookingData) {
        const doctorId = String(bookingData.doctor);
        const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(doctorId) : doctorId.replace(/\\/g, '\\\\');
        const opt = document.querySelector(`#doctor-select option[value="${escaped}"]`);
        const doctorLabel = opt ? opt.textContent : doctorId;

        const successMessage = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: var(--accent-color); margin-bottom: 20px;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 15px;">Appointment Booked Successfully!</h3>
                <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 5px 0;"><strong>Doctor:</strong> ${doctorLabel}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${this.formatDateReadable(bookingData.date)}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${bookingData.time}</p>
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${bookingData.customType || bookingData.type.charAt(0).toUpperCase() + bookingData.type.slice(1)}</p>
                </div>
                <p style="color: var(--text-secondary);">You will receive a confirmation email and reminder notifications.</p>
            </div>
        `;

        // Create success modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 3000; display: flex;
            align-items: center; justify-content: center;
        `;

        modal.innerHTML = `
            <div style="background: var(--card-bg); padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
                ${successMessage}
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: var(--accent-color); color: white; border: none;
                    padding: 10px 20px; border-radius: 6px; cursor: pointer;
                    margin-top: 15px; width: 100%;
                ">Close</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Reset form
        document.getElementById('appointment-form').reset();
        this.selectedDate = null;
        this.selectedTime = null;
        this.selectedDoctor = null;
        this.populateDoctorSelect();
        this.renderCalendar();
        this.updateTimeSlots();
    }

    sendEmailReminder(bookingData) {
        // Simulation silenciée - l'email serait envoyé en arrière-plan dans une version réelle
        console.log('Email reminder processed for:', bookingData.email);
    }

    showPrivacyModal() {
        document.getElementById('privacy-modal').style.display = 'block';
    }

    hidePrivacyModal() {
        document.getElementById('privacy-modal').style.display = 'none';
    }

    // Utility methods
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateReadable(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    isToday(date) {
        const today = new Date();
        return this.datesEqual(date, today);
    }

    isPastDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date < today;
    }

    datesEqual(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    // ── Management Logic ──────────────────────────────────────────────────
    getCurrentPatientId() {
        return localStorage.getItem('userId') || '';
    }

    loadAppointmentInvitations() {
        const container = document.getElementById('doctor-invitations-list');
        const countBadge = document.getElementById('invitations-count');
        if (!container) return;

        const patientId = this.getCurrentPatientId();
        const invitationsKey = `patient_${patientId}_invitations`;
        const invitations = JSON.parse(localStorage.getItem(invitationsKey) || '[]');
        const activeInvitations = invitations.filter(inv => {
            const status = String(inv.status || 'pending').toLowerCase();
            return status !== 'declined' && status !== 'cancelled';
        });

        if (countBadge) countBadge.textContent = activeInvitations.length;

        if (activeInvitations.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 20px;">No invitations received at the moment.</p>';
            return;
        }

        const registeredDoctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
        const getDoctorName = (id) => {
            const d = registeredDoctors.find(doc => doc.id === id || doc.userId === id);
            return d ? d.name : null;
        };

        container.innerHTML = '';
        activeInvitations.forEach(inv => {
            try {
                const doctorId = inv.doctorId || (inv.doctor ? inv.doctor.id : null);
                const docName = inv.doctorName || (inv.doctor ? inv.doctor.name : null) || getDoctorName(doctorId) || 'Medical Specialist';
                const docSpecialty = inv.doctorSpecialty || (inv.doctor ? inv.doctor.specialty : null) || 'Generalist';
                const status = String(inv.status || 'pending').toLowerCase();
                const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
                const actionsHtml = status === 'pending' ? `
                    <button onclick="window.calendarApp.acceptInvitation('${inv.id}')" style="flex: 1; padding: 8px; background: #22c55e; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;">Accept</button>
                    <button onclick="window.calendarApp.declineInvitation('${inv.id}')" style="flex: 1; padding: 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;">Decline</button>
                    <button onclick="window.calendarApp.deleteInvitation('${inv.id}')" style="padding: 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;" title="Delete"><i class="fas fa-trash"></i></button>
                ` : `
                    <div style="flex: 1; padding: 10px 12px; background: #f3f4f6; color: var(--text-secondary); border-radius: 4px; font-size: 13px; text-align: center;">
                        Status: ${statusLabel}
                    </div>
                    <button onclick="window.calendarApp.deleteInvitation('${inv.id}')" style="padding: 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;" title="Delete"><i class="fas fa-trash"></i></button>
                `;

                const card = document.createElement('div');
                card.style.cssText = `
                    background: white; border: 1px solid var(--border-color);
                    border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 10px;
                `;
                
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h4 style="margin: 0;">Dr. ${docName}</h4>
                            <p style="margin: 2px 0 0; font-size: 12px; color: var(--text-secondary);">${docSpecialty}</p>
                        </div>
                        <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${statusLabel}</span>
                    </div>
                    <div style="font-size: 13px; color: var(--text-primary);">
                        <p style="margin: 5px 0;"><i class="fas fa-calendar-alt"></i> ${inv.date}</p>
                        <p style="margin: 5px 0;"><i class="fas fa-clock"></i> ${inv.time}</p>
                        <p style="margin: 5px 0;"><i class="fas fa-stethoscope"></i> ${inv.type}</p>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 5px;">
                        ${actionsHtml}
                    </div>
                `;
                container.appendChild(card);
            } catch (e) {
                console.error('Error rendering invitation:', e);
            }
        });
    }

    loaddoctorAppointments() {
        const listContainer = document.getElementById('patient-appointments-list');
        const countBadge = document.getElementById('my-appointments-count');
        if (!listContainer) return;

        const patientId = this.getCurrentPatientId();
        const patientName = (localStorage.getItem('userName') || localStorage.getItem('fullName') || '').trim().toLowerCase();
        const patientEmail = (localStorage.getItem('email') || localStorage.getItem('userEmail') || '').trim().toLowerCase();
        
        const currentPId = String(patientId || '').toLowerCase();
        const currentPName = String(patientName || '').toLowerCase();
        const currentPEmail = String(patientEmail || '').toLowerCase();
        
        const confirmedAppointments = JSON.parse(localStorage.getItem('doctorAppointments') || '[]');
        const allRequests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
        
        const filterFn = (item) => {
            if (!item) return false;
            const itemId = String(item.patientId || item.userId || (item.patient && (item.patient.id || item.patient.userId)) || '').toLowerCase();
            const itemName = String(item.patientName || item.name || (item.patient && item.patient.name) || '').toLowerCase();
            const itemEmail = String(item.email || item.patientEmail || (item.patient && item.patient.email) || '').toLowerCase();

            if (currentPId && itemId === currentPId) return true;
            if (currentPEmail && itemEmail === currentPEmail) return true;
            if (currentPName && itemName && (itemName.includes(currentPName) || currentPName.includes(itemName))) return true;
            return false;
        };

        const myRequests = allRequests.filter(filterFn);
        const myConfirmed = confirmedAppointments.filter(filterFn);

        const combined = [...myRequests, ...myConfirmed]
            .filter(a => a.status !== 'declined' && a.status !== 'cancelled')
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (countBadge) countBadge.textContent = combined.length;

        if (combined.length === 0) {
            listContainer.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 20px;">You have no booked appointments.</p>';
            return;
        }

        const registeredDoctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');
        const getDoctorName = (id) => {
            const d = registeredDoctors.find(doc => doc.id === id || doc.userId === id);
            return d ? d.name : null;
        };

        listContainer.innerHTML = '';
        combined.forEach(appt => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: white; border: 1px solid var(--border-color);
                border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 10px;
            `;
            
            const isConfirmed = appt.status === 'confirmed' || appt.status === 'accepted';
            const doctorId = appt.doctor || appt.doctorId;
            const docName = appt.doctorName || (appt.doctor && appt.doctor.name ? appt.doctor.name : null) || getDoctorName(doctorId) || (typeof appt.doctor === 'string' && appt.doctor.length > 5 ? appt.doctor : 'Medical Specialist');
            
            const apptDate = appt.date || 'Date TBD';
            const apptTime = appt.time || 'Time TBD';
            const apptType = appt.type || 'Consultation';
            const apptStatus = appt.status || 'Pending';
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin: 0;">${docName}</h4>
                        <p style="margin: 2px 0 0; font-size: 12px; color: var(--text-secondary);">${apptType}</p>
                    </div>
                    <span style="background: ${isConfirmed ? '#dcfce7' : '#fef3c7'}; color: ${isConfirmed ? '#15803d' : '#92400e'}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${apptStatus.toUpperCase()}</span>
                </div>
                <div style="font-size: 13px; color: var(--text-primary);">
                    <p style="margin: 5px 0;"><i class="fas fa-calendar-alt"></i> ${apptDate}</p>
                    <p style="margin: 5px 0;"><i class="fas fa-clock"></i> ${apptTime}</p>
                </div>
                <button onclick="window.calendarApp.deleteAppointment('${appt.id}')" style="width: 100%; padding: 8px; background: transparent; color: #ef4444; border: 1px solid #ef4444; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 5px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
            listContainer.appendChild(card);
        });
    }

    acceptInvitation(invitationId) {
        this.updateInvitationStatus(invitationId, 'accepted');
        showStyledMessage('Invitation accepted!', 'success');
        this.loadAppointmentInvitations();
        this.loaddoctorAppointments();
    }

    declineInvitation(invitationId) {
        const patientId = this.getCurrentPatientId();
        const invitationsKey = `patient_${patientId}_invitations`;
        let invitations = JSON.parse(localStorage.getItem(invitationsKey) || '[]');
        const invIndex = invitations.findIndex(inv => inv.id === invitationId);
        
        if (invIndex !== -1) {
            const invitation = invitations[invIndex];
            invitation.status = 'declined';
            invitation.source = 'invitation';
            
            // Move to history
            let history = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
            history.push(invitation);
            localStorage.setItem('appointmentHistory', JSON.stringify(history));
            
            // Remove from active
            invitations.splice(invIndex, 1);
            localStorage.setItem(invitationsKey, JSON.stringify(invitations));
            
            showStyledMessage('Invitation declined and moved to history.', 'info');
            this.loadAppointmentInvitations();
        }
    }

    deleteInvitation(invitationId) {
        showConfirmModal(
            'Delete Invitation',
            'Are you sure you want to delete this invitation? It will be moved to history.',
            'danger',
            () => {
                const patientId = this.getCurrentPatientId();
                const invitationsKey = `patient_${patientId}_invitations`;
                let invitations = JSON.parse(localStorage.getItem(invitationsKey) || '[]');
                const invIndex = invitations.findIndex(inv => inv.id === invitationId);
                
                if (invIndex !== -1) {
                    const invitation = invitations[invIndex];
                    invitation.status = invitation.status || 'cancelled';
                    invitation.source = 'invitation';
                    
                    // Move to history
                    let history = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
                    history.push(invitation);
                    localStorage.setItem('appointmentHistory', JSON.stringify(history));
                    
                    // Remove from active
                    invitations.splice(invIndex, 1);
                    localStorage.setItem(invitationsKey, JSON.stringify(invitations));
                    
                    showStyledMessage('Invitation deleted and moved to history.', 'success');
                    this.loadAppointmentInvitations();
                }
            }
        );
    }

    updateInvitationStatus(invitationId, newStatus) {
        const patientId = this.getCurrentPatientId();
        const invitationsKey = `patient_${patientId}_invitations`;
        let invitations = JSON.parse(localStorage.getItem(invitationsKey) || '[]');
        invitations = invitations.map(inv => inv.id === invitationId ? { ...inv, status: newStatus } : inv);
        localStorage.setItem(invitationsKey, JSON.stringify(invitations));
    }

    deleteAppointment(id) {
        showConfirmModal(
            'Confirm Deletion',
            'Are you sure you want to delete this appointment? It will be moved to history.',
            'danger',
            () => {
                const requests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
                const confirmed = JSON.parse(localStorage.getItem('doctorAppointments') || '[]');
                
                let itemToArchive = requests.find(r => r.id === id) || confirmed.find(c => c.id === id);
                
                if (itemToArchive) {
                    itemToArchive.status = 'cancelled';
                    itemToArchive.source = itemToArchive.source || 'request';
                    
                    // Move to history
                    let history = JSON.parse(localStorage.getItem('appointmentHistory') || '[]');
                    history.push(itemToArchive);
                    localStorage.setItem('appointmentHistory', JSON.stringify(history));
                    
                    // Remove from active
                    const newRequests = requests.filter(r => r.id !== id);
                    const newConfirmed = confirmed.filter(c => c.id !== id);
                    localStorage.setItem('appointmentRequests', JSON.stringify(newRequests));
                    localStorage.setItem('doctorAppointments', JSON.stringify(newConfirmed));

                    showStyledMessage('Appointment moved to history.', 'success');
                    this.loaddoctorAppointments();
                }
            }
        );
    }
}

// Initialize the calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.calendarApp) {
        new AppointmentCalendar();
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
