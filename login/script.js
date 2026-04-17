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



const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");

registerBtn.addEventListener("click", () => {
  container.classList.add("active");
});

loginBtn.addEventListener("click", () => {
  container.classList.remove("active");
});

// Les fonctions getAccounts, saveAccounts, applySession et addToDirectory 
// ont été déplacées vers le fichier de synchronisation central (sync.js)


// ── Inscription (Sign Up) ───────────────────────────────────────────────────
document.querySelector('.sign-up form').addEventListener('submit', (e) => {
  e.preventDefault();
  const firstName = document.getElementById('signup-firstname').value.trim();
  const lastName  = document.getElementById('signup-lastname').value.trim();
  const email     = document.getElementById('signup-email').value.trim().toLowerCase();
  const password  = document.getElementById('signup-password').value;
  const role      = document.querySelector('input[name="role"]:checked')?.value;

  if (!firstName || !lastName || !email || !password || !role) {
    showStyledMessage('Please fill in all fields.', 'warning');
    return;
  }

  const accounts = getAccounts();
  if (accounts.some((a) => a.email === email)) {
    showStyledMessage('An account with this email already exists.', 'warning');
    return;
  }

  const userId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  const account = { userId, firstName, lastName, email, password, role };
  accounts.push(account);
  saveAccounts(accounts);
  addToDirectory(account);
  setSession(account);

  showStyledMessage(`Welcome, ${firstName}. Your account is ready.`, 'success');
  setTimeout(() => {
    redirectToDashboard(role);
  }, 600);
});

// ── Connexion (Sign In) ──────────────────────────────────────────────────────
document.querySelector('.sign-in form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email    = document.getElementById('signin-email').value.trim().toLowerCase();
  const password = document.getElementById('signin-password').value;

  if (!email || !password) {
    showStyledMessage('Please enter email and password.', 'warning');
    return;
  }

  const accounts = getAccounts();
  const account = accounts.find((a) => a.email === email && a.password === password);
  if (!account) {
    showStyledMessage('Invalid email or password. Create an account if you are new.', 'warning');
    return;
  }

  setSession(account);
  addToDirectory(account);
  showStyledMessage('Signed in successfully.', 'success');
  setTimeout(() => {
    redirectToDashboard(account.role);
  }, 600);
});
