/* ============================================
   Settings Module
   ============================================ */

const Settings = (() => {
  const KV_PREFIX = 'hxg_';

  function init() {
    const panel = document.getElementById('settingsPanel');
    const openBtn = document.getElementById('btnSettings');
    const closeBtn = document.getElementById('settingsPanelClose');

    openBtn.addEventListener('click', () => panel.classList.add('settings-panel--visible'));
    closeBtn.addEventListener('click', () => panel.classList.remove('settings-panel--visible'));

    initScale();
    initTheme();
    initCompress();
    initPassword();
    initLogout();
  }

  // ── UI Scale ──
  function initScale() {
    let scale = parseFloat(localStorage.getItem(KV_PREFIX + 'scale') || '1');
    applyScale(scale);

    document.getElementById('scaleDown').addEventListener('click', () => {
      scale = Math.max(0.7, scale - 0.1);
      applyScale(scale);
    });

    document.getElementById('scaleUp').addEventListener('click', () => {
      scale = Math.min(1.6, scale + 0.1);
      applyScale(scale);
    });

    document.getElementById('scaleReset').addEventListener('click', () => {
      scale = 1;
      applyScale(scale);
    });
  }

  function applyScale(scale) {
    document.documentElement.style.setProperty('--ui-scale', scale);
    document.getElementById('scaleValue').textContent = Math.round(scale * 100) + '%';
    localStorage.setItem(KV_PREFIX + 'scale', scale.toString());
  }

  // ── Theme ──
  function initTheme() {
    const saved = localStorage.getItem(KV_PREFIX + 'theme') || 'obsidian';
    applyTheme(saved);

    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        const theme = card.dataset.theme;
        applyTheme(theme);
      });
    });
  }

  function applyTheme(theme) {
    if (theme === 'obsidian') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    localStorage.setItem(KV_PREFIX + 'theme', theme);

    document.querySelectorAll('.theme-card').forEach(card => {
      card.classList.toggle('theme-card--active', card.dataset.theme === theme);
    });
  }

  // ── Compress toggle ──
  function initCompress() {
    const toggle = document.getElementById('compressToggle');
    const saved = localStorage.getItem(KV_PREFIX + 'compress');
    toggle.checked = saved !== 'false';

    toggle.addEventListener('change', () => {
      localStorage.setItem(KV_PREFIX + 'compress', toggle.checked.toString());
      App.toast(toggle.checked ? 'Compression enabled' : 'Compression disabled', 'info');
    });
  }

  // ── Password ──
  function initPassword() {
    document.getElementById('changePasswordBtn').addEventListener('click', () => {
      const current = document.getElementById('currentPassword').value;
      const newPw = document.getElementById('newPassword').value;

      if (!current || !newPw) {
        App.toast('Fill in both fields', 'error');
        return;
      }

      if (newPw.length < 4) {
        App.toast('Password too short (min 4 chars)', 'error');
        return;
      }

      const success = Auth.changePassword(current, newPw);
      if (success) {
        App.toast('Password updated', 'success');
        Store.logActivity('password_changed', '');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
      } else {
        App.toast('Current password is incorrect', 'error');
      }
    });
  }

  // ── Logout ──
  function initLogout() {
    document.getElementById('settingsLogout').addEventListener('click', () => {
      Auth.logout();
    });

    document.getElementById('btnLogout').addEventListener('click', () => {
      Auth.logout();
    });
  }

  return { init };
})();
