// patient-dashboard.js SIMPLIFIÉ - NAV FUNCTIONNELLE UNIQUEMENT
'use strict';

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== PATIENT DASHBOARD LOADED ===');
    
    // NAVIGATION SIDEBAR - CRITIQUE
    const navItems = document.querySelectorAll('.sidebar-menu li[data-page]');
    console.log('Nav items trouvés:', navItems.length);
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log('Clic nav:', this.dataset.page);
            
            // Update active
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Navigate
            const pages = {
                'dashboard': 'patient.html',
                'appointments': 'appointments.html', 
                'history': 'history.html',
                'settings': 'settings.html'
            };
            
            if (pages[this.dataset.page]) {
                window.location.href = pages[this.dataset.page];
            }
        });
    });
    
    // THÈME TOGGLE
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        const currentTheme = localStorage.getItem('theme') || 'light';
        themeSwitch.checked = currentTheme === 'dark';
        document.body.dataset.theme = currentTheme;
        
        themeSwitch.addEventListener('change', function() {
            document.body.dataset.theme = this.checked ? 'dark' : '';
            localStorage.setItem('theme', this.checked ? 'dark' : 'light');
        });
    }
    
    console.log('=== NAV & theme SETUP OK ===');
    
    // AVATAR BASIQUE
    const avatarContainer = document.querySelector('.avatar-img');
    if (avatarContainer) {
        const userName = localStorage.getItem('userName') || 'Patient';
        const initials = userName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
        avatarContainer.innerHTML = `<span>${initials || 'P'}</span>`;
    }
    
    console.log('=== DASHBOARD PRÊT ===');
});
