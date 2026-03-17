/* ============================================
   App Entry Point
   ============================================ */

const App = (() => {
  function init() {
    // Auth guard
    if (!Auth.isLoggedIn()) {
      window.location.href = 'index.html';
      return;
    }

    // Load data
    Store.load();

    // Pull cloud data in background
    Store.pullFromCloud();

    // Initialize modules
    Router.init();
    Search.init();
    AIDraft.init();
    Settings.init();
    Chat.init();

    // Set user role badge
    setRoleBadge();

    // Render initial views
    Roadmap.render();
    Roadmap.updateGlobalStats();

    // Tab change renders
    Router.onNavigate('roadmap', () => {
      Roadmap.render();
      Roadmap.updateGlobalStats();
    });
    Router.onNavigate('tasks', () => Tasks.render());
    Router.onNavigate('activity', () => Activity.render());

    // Banner close
    const banner = document.getElementById('banner');
    const bannerClose = document.getElementById('bannerClose');
    const bannerDismissed = localStorage.getItem('hxg_banner_dismissed');
    if (bannerDismissed) banner.classList.add('banner--hidden');
    bannerClose.addEventListener('click', () => {
      banner.classList.add('banner--hidden');
      localStorage.setItem('hxg_banner_dismissed', 'true');
    });

    // Read-only mode adjustments
    if (Auth.isReadOnly()) {
      document.querySelectorAll('#btnAddTask').forEach(el => el.style.display = 'none');
    }

    // Apply saved scale
    const savedScale = localStorage.getItem('hxg_scale');
    if (savedScale) {
      document.documentElement.style.setProperty('--ui-scale', savedScale);
    }

    // Apply saved theme
    const savedTheme = localStorage.getItem('hxg_theme');
    if (savedTheme && savedTheme !== 'obsidian') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    console.log('%c⚔️ HUNTER × GAME Dev Hub', 'color:#e8793b;font-size:20px;font-weight:bold;');
    console.log('%cInitialized successfully', 'color:#22c55e;');
  }

  function setRoleBadge() {
    const role = Auth.getRole();
    const el = document.getElementById('userRole');
    if (el) {
      el.textContent = role.toUpperCase();
      el.className = 'header__role';
      el.classList.add(`header__role--${role}`);
    }
  }

  function toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  return { init, toast };
})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);
