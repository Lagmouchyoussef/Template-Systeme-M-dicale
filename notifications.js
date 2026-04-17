// Unified Notifications - Shared across all pages

let showAllNotifications = false;

// Notifications are filled by the app as real events occur; no prefilled demo items.
const UNIFIED_NOTIFICATIONS = [];

function getRolePrefix() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/patient/') || path.includes('\\patient\\')) return 'patient';
    if (path.includes('/doctor/') || path.includes('\\doctor\\')) return 'doctor';
    return path.includes('doctor') ? 'doctor' : 'patient';
}

const ROLE_PREFIX = getRolePrefix();

function getDeletedIds() {
    return JSON.parse(localStorage.getItem(`${ROLE_PREFIX}DeletedNotifications`) || '[]');
}

function getReadIds() {
    return JSON.parse(localStorage.getItem(`${ROLE_PREFIX}ReadNotifications`) || '[]');
}

function saveDeletedIds(ids) {
    localStorage.setItem(`${ROLE_PREFIX}DeletedNotifications`, JSON.stringify(ids));
}

function saveReadIds(ids) {
    localStorage.setItem(`${ROLE_PREFIX}ReadNotifications`, JSON.stringify(ids));
}

function getNotificationsToShow() {
    const deleted = getDeletedIds();
    const all = UNIFIED_NOTIFICATIONS.filter(n => !deleted.includes(n.id));
    return showAllNotifications ? all : all.filter(n => !getReadIds().includes(n.id));
}

function renderNotificationsDropdown() {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    const toShow = getNotificationsToShow();
    container.innerHTML = '';

    toShow.forEach(notification => {
        const isRead = getReadIds().includes(notification.id);
        const item = document.createElement('div');
        item.className = `notification-item ${!isRead ? 'unread' : ''}`;
        item.setAttribute('data-id', notification.id);

        item.innerHTML = `
            <i class="fas ${notification.icon}"></i>
            <div class="notification-content">
                <p>${notification.message}</p>
                <small>${notification.time}</small>
            </div>
            <div class="notification-actions">
                <button class="view-btn" data-id="${notification.id}" aria-label="View">View</button>
                ${!isRead ? `<button class="mark-read-btn" data-id="${notification.id}" aria-label="Mark as read">✓</button>` : ''}
                <button class="delete-btn" data-id="${notification.id}" aria-label="Delete">×</button>
            </div>
        `;

        container.appendChild(item);
    });

    updateNotificationBadge();
}

function updateNotificationBadge() {
    const unread = UNIFIED_NOTIFICATIONS.filter(n => !getDeletedIds().includes(n.id) && !getReadIds().includes(n.id));
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = unread.length;
        badge.style.display = unread.length > 0 ? 'flex' : 'none';
    }
}

// Event handlers
document.addEventListener('click', function(e) {
    const notificationsBtn = document.querySelector('.notifications');
    const notificationsDropdown = document.getElementById('notifications-dropdown');
    
    if (notificationsBtn && notificationsDropdown) {
        if (notificationsBtn.contains(e.target)) {
            e.stopPropagation();
            const isVisible = notificationsDropdown.style.display === 'block';
            notificationsDropdown.style.display = isVisible ? 'none' : 'block';
        } else if (!notificationsDropdown.contains(e.target)) {
            notificationsDropdown.style.display = 'none';
        }
    }

    // Button actions
    if (e.target.classList.contains('view-btn') || e.target.classList.contains('mark-read-btn')) {
        e.stopPropagation();
        const id = parseInt(e.target.getAttribute('data-id'));
        const readIds = getReadIds();
        if (!readIds.includes(id)) readIds.push(id);
        saveReadIds(readIds);
        renderNotificationsDropdown();
    } else if (e.target.classList.contains('delete-btn')) {
        e.stopPropagation();
        const id = parseInt(e.target.getAttribute('data-id'));
        const deletedIds = getDeletedIds();
        if (!deletedIds.includes(id)) deletedIds.push(id);
        saveDeletedIds(deletedIds);
        renderNotificationsDropdown();
    } else if (e.target.closest('.notification-item')) {
        e.stopPropagation();
    }
});

// View all button - run after DOM ready
document.addEventListener('DOMContentLoaded', function() {
    const viewAllBtn = document.getElementById('view-all-notifications');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            showAllNotifications = !showAllNotifications;
            this.textContent = showAllNotifications ? 'Show unread only' : 'View all notifications';
            renderNotificationsDropdown();
        });
    }
});

// Mark all read
const markAllReadBtn = document.getElementById('mark-all-read');
if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const readIds = getReadIds();
        UNIFIED_NOTIFICATIONS.forEach(n => {
            if (!readIds.includes(n.id)) readIds.push(n.id);
        });
        saveReadIds(readIds);
        renderNotificationsDropdown();
    });
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNotificationsDropdown);
} else {
    renderNotificationsDropdown();
}

