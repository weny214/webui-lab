// UI state only. Supabase session ownership remains in auth.js.
(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const closeButton = document.getElementById('sidebar-close');
    const backdrop = document.getElementById('sidebar-backdrop');
    const shell = document.getElementById('app-shell');
    const account = document.getElementById('account-panel');
    const accountToggle = document.getElementById('account-toggle');
    const accountMenu = document.getElementById('account-menu');
    const loginButton = document.getElementById('navbar-login');
    const background = ['site-header', 'app-content', 'site-footer'].map(id => document.getElementById(id));
    const previousInert = new Map();
    let signedIn = false;
    let sidebarOpen = false;

    function setBackgroundInert(modal) {
        for (const element of background) {
            if (modal) {
                if (!previousInert.has(element)) previousInert.set(element, element.inert);
                element.inert = true;
            } else if (previousInert.has(element)) {
                element.inert = previousInert.get(element);
                previousInert.delete(element);
            }
        }
        document.body.classList.toggle('sidebar-modal-open', modal);
    }

    function closeAccountMenu(restoreFocus = false) {
        accountMenu.hidden = true;
        accountToggle.setAttribute('aria-expanded', 'false');
        if (restoreFocus && signedIn) accountToggle.focus();
    }

    function setSidebarOpen(open, {restoreFocus = false} = {}) {
        sidebarOpen = signedIn && open;
        const modal = sidebarOpen && !desktop.matches;
        // Move focus out before hiding a subtree, then update its visible state.
        if (!sidebarOpen && sidebar.contains(document.activeElement)) restoreFocus = true;
        setBackgroundInert(modal);
        sidebar.hidden = !sidebarOpen;
        backdrop.hidden = !modal;
        shell.classList.toggle('sidebar-open', sidebarOpen);
        toggle.setAttribute('aria-expanded', String(sidebarOpen));
        toggle.setAttribute('aria-label', sidebarOpen ? '關閉導覽選單' : '開啟導覽選單');
        if (modal) {
            sidebar.setAttribute('role', 'dialog');
            sidebar.setAttribute('aria-modal', 'true');
            closeAccountMenu();
            closeButton.focus();
        } else {
            sidebar.removeAttribute('role');
            sidebar.removeAttribute('aria-modal');
            if (restoreFocus) (signedIn ? toggle : loginButton).focus();
        }
    }

    function openSidebar() { setSidebarOpen(true); }
    function closeSidebar(options) { setSidebarOpen(false, options); }
    function toggleSidebar() { setSidebarOpen(!sidebarOpen); }

    function setActiveNavigation(tabId) {
        for (const button of sidebar.querySelectorAll('[data-tab]')) {
            if (button.dataset.tab === tabId) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
        }
    }

    function afterNavigation(tabId) {
        if (desktop.matches || !sidebarOpen) return;
        closeSidebar();
        const panel = document.getElementById('tab-' + tabId);
        const heading = panel.querySelector('h2') || panel;
        heading.setAttribute('tabindex', '-1');
        heading.focus({preventScroll: true});
    }

    function setUser(user) {
        const wasSignedIn = signedIn;
        signedIn = !!user;
        loginButton.hidden = signedIn;
        toggle.hidden = !signedIn;
        account.hidden = !signedIn;
        const email = user?.email || '已登入帳號';
        document.getElementById('account-label').textContent = signedIn ? email : '';
        document.getElementById('account-avatar').textContent = user?.email?.charAt(0).toUpperCase() || '我';
        accountToggle.setAttribute('aria-label', signedIn ? `${email}，帳號選單` : '帳號選單');
        closeAccountMenu();
        setSidebarOpen(signedIn && desktop.matches);
        if (!signedIn && wasSignedIn) loginButton.focus();
    }

    toggle.addEventListener('click', toggleSidebar);
    closeButton.addEventListener('click', () => closeSidebar({restoreFocus: true}));
    backdrop.addEventListener('click', () => closeSidebar({restoreFocus: true}));
    for (const button of sidebar.querySelectorAll('[data-tab]')) {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    }
    accountToggle.addEventListener('click', () => {
        if (!signedIn) return;
        accountMenu.hidden = !accountMenu.hidden;
        accountToggle.setAttribute('aria-expanded', String(!accountMenu.hidden));
    });
    loginButton.addEventListener('click', () => {
        document.getElementById('auth-panel').scrollIntoView({block: 'start'});
        document.getElementById('auth-email').focus({preventScroll: true});
    });
    document.addEventListener('click', event => {
        if (!account.contains(event.target)) closeAccountMenu();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            if (sidebarOpen && !desktop.matches) {
                event.preventDefault();
                closeSidebar({restoreFocus: true});
            } else if (!accountMenu.hidden) {
                event.preventDefault();
                closeAccountMenu(true);
            }
        }
        if (event.key !== 'Tab' || !sidebarOpen || desktop.matches) return;
        const focusable = [...sidebar.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')]
            .filter(element => element.getClientRects().length);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const outside = !sidebar.contains(document.activeElement);
        if (event.shiftKey && (document.activeElement === first || outside)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || outside)) {
            event.preventDefault();
            first.focus();
        }
    });
    desktop.addEventListener('change', () => {
        closeAccountMenu(accountMenu.contains(document.activeElement));
        setSidebarOpen(signedIn && desktop.matches);
    });
    const header = document.getElementById('site-header');
    const updateHeaderHeight = () => {
        document.documentElement.style.setProperty('--header-height', header.getBoundingClientRect().height + 'px');
    };
    new ResizeObserver(updateHeaderHeight).observe(header);
    updateHeaderHeight();
    window.studyNavigation = {openSidebar, closeSidebar, toggleSidebar, setActiveNavigation, afterNavigation, setUser};
    setUser(null);
})();
