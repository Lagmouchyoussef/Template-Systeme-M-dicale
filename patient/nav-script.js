// NAVIGATION SCRIPT - TOUTES PAGES PATIENT
document.addEventListener('DOMContentLoaded', function() {
    console.log('NAV SCRIPT LOADED');
    
    // Trouve TOUS les items nav avec data-page
    const navItems = document.querySelectorAll('.sidebar-menu li[data-page]');
    console.log('Nav items:', navItems.length);
    
    navItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Nav click:', this.dataset.page);
            
            // Active state
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Redirection
            const pages = {
                'dashboard': 'patient.html',
                'appointments': 'appointments.html',
                'history': 'history.html', 
                'settings': 'settings.html'
            };
            
            const target = pages[this.dataset.page];
            if (target) {
                window.location.href = target;
            } else {
                console.error('Page inconnue:', this.dataset.page);
            }
        });
    });
    
    // Thème
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.dataset.theme = savedTheme;
        themeSwitch.checked = savedTheme === 'dark';
        
        themeSwitch.addEventListener('change', function() {
            document.body.dataset.theme = this.checked ? 'dark' : '';
            localStorage.setItem('theme', this.checked ? 'dark' : 'light');
        });
    }
    
    console.log('NAV READY - Cliquez sidebar !');
});
