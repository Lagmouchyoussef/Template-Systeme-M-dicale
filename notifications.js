// Unified Notifications - Shared across all pages with Architectural Focus
// Implementation by Senior Architect

let showAllNotifications = false;

// State Persistence Utilities
const StorageKeys = {
    NOTIFICATIONS: 'medisync_notifications_v1',
    READ_IDS: (role) => `${role}_read_notifications`,
    DELETED_IDS: (role) => `${role}_deleted_notifications`
};

function getRolePrefix() {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole === 'patient') return 'patient';
    if (storedRole === 'doctor' || storedRole === 'medecin') return 'doctor';

    const path = window.location.pathname.toLowerCase();
    // Support for both forward and backslashes (Windows)
    if (path.includes('patient')) return 'patient';
    if (path.includes('doctor')) return 'doctor';
    return 'user';
}

const CURRENT_ROLE = getRolePrefix();

// Toast Notification System for "comme nouvelle" feel
function showToast(message, icon = 'fa-bell') {
    const toast = document.createElement('div');
    toast.className = 'medisync-toast';
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; 
        background: var(--accent-color); color: white;
        padding: 15px 25px; border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex; align-items: center; gap: 15px;
        z-index: 10000; animation: toastSlideIn 0.3s ease;
        cursor: pointer;
    `;
    
    toast.innerHTML = `
        <i class="fas ${icon}" style="font-size: 20px;"></i>
        <div style="flex: 1;">
            <strong style="display: block; font-size: 14px;">New Notification</strong>
            <p style="margin: 0; font-size: 12px; opacity: 0.9;">${message}</p>
        </div>
        <button style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">&times;</button>
    `;

    // Animation Style
    if (!document.getElementById('toast-animation-style')) {
        const style = document.createElement('style');
        style.id = 'toast-animation-style';
        style.textContent = `
            @keyframes toastSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes toastSlideOut {
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    toast.onclick = () => {
        const notificationsBtn = document.querySelector('.notifications');
        if (notificationsBtn) notificationsBtn.click();
        dismiss();
    };

    const dismiss = () => {
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('button').onclick = (e) => {
        e.stopPropagation();
        dismiss();
    };

    setTimeout(dismiss, 5000);
}

function getPersistentNotifications() {
    return JSON.parse(localStorage.getItem(StorageKeys.NOTIFICATIONS) || '[]');
}

function savePersistentNotifications(notifs) {
    localStorage.setItem(StorageKeys.NOTIFICATIONS, JSON.stringify(notifs));
    // Trigger "WebSocket-like" update for other tabs
    window.dispatchEvent(new Event('notificationsUpdated'));
}

function getReadIds() {
    return JSON.parse(localStorage.getItem(StorageKeys.READ_IDS(CURRENT_ROLE)) || '[]');
}

function saveReadIds(ids) {
    localStorage.setItem(StorageKeys.READ_IDS(CURRENT_ROLE), JSON.stringify(ids));
}

function getNotificationsToShow() {
    const all = getPersistentNotifications();
    const deleted = JSON.parse(localStorage.getItem(StorageKeys.DELETED_IDS(CURRENT_ROLE)) || '[]');
    // Filter by role and ensure it's not permanently deleted
    const filtered = all.filter(n => !deleted.includes(n.id) && (n.targetRole === CURRENT_ROLE || n.targetRole === 'all'));
    
    // Always return all filtered for the dropdown, but we can use showAllNotifications for other purposes if needed
    return filtered;
}

// Architectural Design: Event-Driven UI Updates
function renderNotificationsDropdown() {
    // Ensure dropdown structure exists or is hooked
    initNotificationUI();

    const list = document.getElementById('notifications-list');
    if (!list) return;

    const toShow = getNotificationsToShow();
    list.innerHTML = '';

    if (toShow.length === 0) {
        list.innerHTML = '<div class="empty-state" style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 14px;">No new notifications</div>';
    }

    toShow.forEach(notification => {
        const isRead = getReadIds().includes(notification.id);
        const item = document.createElement('div');
        item.className = `notification-item ${!isRead ? 'unread' : ''}`;
        item.style.cssText = `
            padding: 12px 15px; border-bottom: 1px solid var(--border-color);
            display: flex; gap: 12px; cursor: pointer; transition: background 0.2s;
            position: relative; ${!isRead ? 'background: rgba(45, 160, 168, 0.05);' : ''}
        `;
        
        item.innerHTML = `
            <div class="notification-icon" style="color: var(--accent-color); font-size: 16px; margin-top: 2px;">
                <i class="fas ${notification.icon || 'fa-info-circle'}"></i>
            </div>
            <div class="notification-content" style="flex: 1;">
                <p style="margin: 0; font-size: 13px; color: var(--text-primary); line-height: 1.4;">${notification.message}</p>
                <small style="display: block; margin-top: 4px; color: var(--text-secondary); font-size: 11px;">${notification.time || 'Just now'}</small>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
                ${!isRead ? `<div class="unread-dot" style="width: 8px; height: 8px; background: var(--accent-color); border-radius: 50%;"></div>` : ''}
                <button class="delete-notif-btn" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; opacity: 0.5; padding: 2px; font-size: 12px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        item.onclick = (e) => {
            e.stopPropagation();
            markNotificationRead(notification.id);
            if (notification.link) {
                window.location.href = notification.link;
            } else if (notification.type === 'Appointment' || notification.message.toLowerCase().includes('rendez-vous')) {
                // Redirection intelligente vers l'historique si c'est un rdv
                window.location.href = CURRENT_ROLE === 'doctor' ? 'doctor-history.html' : 'history.html';
            }
        };

        // Archive logic on delete click
        const deleteBtn = item.querySelector('.delete-notif-btn');
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            archiveNotification(notification.id);
        };

        list.appendChild(item);
    });

    updateNotificationBadge();
}

function archiveNotification(id) {
    const notifs = getPersistentNotifications();
    const index = notifs.findIndex(n => n.id === id);
    
    if (index !== -1) {
        const removed = notifs.splice(index, 1)[0];
        savePersistentNotifications(notifs);
        
        // Add to history
        const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
        history.unshift({
            ...removed,
            archivedAt: new Date().toISOString(),
            type: removed.icon === 'fa-calendar-plus' ? 'Appointment' : 'System',
            target: removed.targetRole, // Compatibility with some history scripts
            role: CURRENT_ROLE // Track who archived it
        });
        localStorage.setItem('notificationHistory', JSON.stringify(history.slice(0, 100)));
        
        renderNotificationsDropdown();
        if (typeof showStyledMessage === 'function') {
            showStyledMessage('Notification moved to archives', 'success');
        } else if (typeof showToast === 'function') {
            showToast('Notification moved to archives', 'fa-archive');
        }
        // Refresh UI if on history page
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    }
}

function restoreNotification(id) {
    const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
    const index = history.findIndex(n => String(n.id) === String(id));
    
    if (index !== -1) {
        const restored = history.splice(index, 1)[0];
        localStorage.setItem('notificationHistory', JSON.stringify(history));
        
        const notifs = getPersistentNotifications();
        // Cleanup archive metadata
        delete restored.archivedAt;
        delete restored.role;
        
        notifs.unshift(restored);
        savePersistentNotifications(notifs);
        
        if (typeof showStyledMessage === 'function') {
            showStyledMessage('Notification restored to active list', 'success');
        }
        
        // Refresh UI if on history page
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
        renderNotificationsDropdown();
    }
}

function permanentlyDeleteNotification(id) {
    const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
    const index = history.findIndex(n => String(n.id) === String(id));
    
    if (index !== -1) {
        history.splice(index, 1);
        localStorage.setItem('notificationHistory', JSON.stringify(history));
        
        if (typeof showStyledMessage === 'function') {
            showStyledMessage('Notification permanently deleted', 'info');
        }
        
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    }
}

// Global exposure for history pages
window.restoreNotification = restoreNotification;
window.permanentlyDeleteNotification = permanentlyDeleteNotification;

function initNotificationUI() {
    const notificationsWrapper = document.querySelector('.notifications');
    if (!notificationsWrapper) return;

    let dropdown = document.getElementById('notifications-dropdown');
    
    // If it doesn't exist, create it
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'notifications-dropdown';
        dropdown.className = 'notifications-dropdown-menu';
        dropdown.style.cssText = `
            position: absolute; top: 100%; right: 0; width: 320px;
            background: var(--card-bg); border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            display: none; z-index: 1000; margin-top: 10px; overflow: hidden;
            border: 1px solid var(--border-color);
        `;

        dropdown.innerHTML = `
            <div class="dropdown-header" style="padding: 15px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 16px;">Notifications</h3>
                <button id="architect-mark-all" style="background: none; border: none; color: var(--accent-color); cursor: pointer; font-size: 12px; font-weight: 600;">Mark all read</button>
            </div>
            <div id="notifications-list" style="max-height: 350px; overflow-y: auto;"></div>
            <div class="dropdown-footer" style="padding: 12px; border-top: 1px solid var(--border-color); text-align: center;">
                <button id="architect-view-all" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 13px; width: 100%;">View All History</button>
            </div>
        `;
        notificationsWrapper.appendChild(dropdown);
    }

    // Always ensure button handlers are set (even if HTML was hardcoded)
    const markAllBtn = document.getElementById('architect-mark-all') || document.getElementById('mark-all-read');
    const viewAllBtn = document.getElementById('architect-view-all') || document.getElementById('view-all-notifications');
    
    if (markAllBtn) markAllBtn.onclick = (e) => markAllAsRead(e);
    if (viewAllBtn) viewAllBtn.onclick = (e) => viewAllNotifications(e);

    // Toggle logic (ensure only one listener is attached)
    if (!notificationsWrapper.dataset.listenerAttached) {
        notificationsWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = dropdown.style.display === 'flex' || dropdown.style.display === 'block';
            
            // Close all other dropdowns
            document.querySelectorAll('.notifications-dropdown-menu, .notifications-dropdown').forEach(d => d.style.display = 'none');
            
            dropdown.style.display = isVisible ? 'none' : 'flex';
        });

        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });
        
        notificationsWrapper.dataset.listenerAttached = "true";
    }
}

function updateNotificationBadge() {
    const toShow = getPersistentNotifications().filter(n => (n.targetRole === CURRENT_ROLE || n.targetRole === 'all'));
    const unreadCount = toShow.filter(n => !getReadIds().includes(n.id)).length;
    
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

// REAL-TIME SYNC LOGIC (Simulated via Storage Events for Prototype)
function pushNotification(message, icon = 'fa-bell', targetRole = 'all', link = null) {
    const notifs = getPersistentNotifications();
    const newNotif = {
        id: 'notif_' + Date.now(),
        message,
        icon,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        targetRole,
        link,
        timestamp: Date.now()
    };
    
    notifs.unshift(newNotif);
    savePersistentNotifications(notifs.slice(0, 50)); // Keep last 50
    
    // Show toast locally if target is me
    if (targetRole === CURRENT_ROLE || targetRole === 'all') {
        showToast(message, icon);
    }
}

function markNotificationRead(id) {
    const readIds = getReadIds();
    if (!readIds.includes(id)) {
        readIds.push(id);
        saveReadIds(readIds);
        renderNotificationsDropdown();
    }
}

function markAllAsRead(e) {
    if (e) e.stopPropagation();
    const all = getPersistentNotifications().filter(n => n.targetRole === CURRENT_ROLE || n.targetRole === 'all');
    const readIds = getReadIds();
    all.forEach(n => {
        if (!readIds.includes(n.id)) readIds.push(n.id);
    });
    saveReadIds(readIds);
    renderNotificationsDropdown();
}

function viewAllNotifications(e) {
    if (e) e.stopPropagation();
    if (CURRENT_ROLE === 'doctor') {
        window.location.href = `doctor-history.html`;
    } else {
        window.location.href = `history.html`; 
    }
}

// Listen for cross-tab updates (simulating real-time WebSocket receipt)
window.addEventListener('storage', (e) => {
    if (e.key === StorageKeys.NOTIFICATIONS) {
        const allNotifs = JSON.parse(e.newValue || '[]');
        const latest = allNotifs[0];
        
        // Show toast if the latest notification is for me and it's truly new (created in last 10s)
        const isNew = latest && (Date.now() - latest.timestamp < 10000);
        if (latest && isNew && (latest.targetRole === CURRENT_ROLE || latest.targetRole === 'all')) {
            showToast(latest.message, latest.icon);
        }
        
        renderNotificationsDropdown();
    } else if (e.key.includes('_read_notifications')) {
        renderNotificationsDropdown();
    }
});

window.addEventListener('notificationsUpdated', renderNotificationsDropdown);

// Initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNotificationsDropdown);
} else {
    renderNotificationsDropdown();
}

// Exposed global for other scripts to trigger notifications
window.MediSyncNotifications = {
    push: pushNotification,
    refresh: renderNotificationsDropdown,
    markAllRead: markAllAsRead
};
