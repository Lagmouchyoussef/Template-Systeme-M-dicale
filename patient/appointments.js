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

    // Also log to console for debugging
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Override console methods to show styled messages
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.log = function(...args) {
    showStyledMessage(args.join(' '), 'debug', 3000);
    originalConsoleLog.apply(console, args);
};

console.warn = function(...args) {
    showStyledMessage(args.join(' '), 'warning', 5000);
    originalConsoleWarn.apply(console, args);
};

console.error = function(...args) {
    showStyledMessage(args.join(' '), 'error', 8000);
    originalConsoleError.apply(console, args);
};

// Override alert to show styled messages
const originalAlert = window.alert;
window.alert = function(message) {
    showStyledMessage(message, 'info', 6000);
    // Still call original alert for compatibility
    // originalAlert(message);
};

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
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedDoctor = null;
        this.availableSlots = {};

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
        document.querySelector('.privacy-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPrivacyModal();
        });

        document.querySelector('.modal-close').addEventListener('click', () => {
            this.hidePrivacyModal();
        });

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
        const slots = this.availableSlots[dateKey]?.[this.selectedDoctor] || [];

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
            this.showBookingSuccess(bookingData);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            // Simulate email reminder
            this.sendEmailReminder(bookingData);
        }, 2000);
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
        const escaped =
            typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(doctorId) : doctorId.replace(/\\/g, '\\\\');
        const doctorLabel =
            document.querySelector(`#doctor-select option[value="${escaped}"]`)?.textContent || doctorId;

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
        // Simulate sending email reminder
        showStyledMessage('Email reminder sent: ' + JSON.stringify({
            to: bookingData.email,
            subject: 'Appointment Reminder - MediSync',
            body: `Your appointment is scheduled for ${this.formatDateReadable(bookingData.date)} at ${bookingData.time}`
        }), 'debug');

        // In a real app, this would make an API call to send the email
        setTimeout(() => {
            showStyledMessage('Automated email reminder sent successfully', 'success');
        }, 1000);
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
}

// Initialize the calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AppointmentCalendar();
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
        const initials = firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
        if (!initials.trim()) initials = '';

        const span = document.createElement('span');
        span.textContent = initials;
        avatarContainer.appendChild(span);
    }
}