/* ============================================
   Authentication
   ============================================ */

const Auth = (() => {
  const KV_PREFIX = 'hxg_';

  // Default accounts (in production these would be in KV)
  const defaultAccounts = {
    admin: { password: 'admin123', role: 'admin' },
    dev: { password: 'dev123', role: 'dev' },
    guest: { password: 'guest', role: 'guest' }
  };

  function getAccounts() {
    const raw = localStorage.getItem(KV_PREFIX + 'accounts');
    if (raw) {
      try { return JSON.parse(raw); }
      catch (e) { return { ...defaultAccounts }; }
    }
    return { ...defaultAccounts };
  }

  function saveAccounts(accounts) {
    localStorage.setItem(KV_PREFIX + 'accounts', JSON.stringify(accounts));
  }

  async function login(username, password) {
    // Try cloud auth first
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(KV_PREFIX + 'token', data.token);
        localStorage.setItem(KV_PREFIX + 'username', username);
        localStorage.setItem(KV_PREFIX + 'role', data.role);
        return { success: true, role: data.role };
      }
    } catch (e) {
      // Fallback to local
    }

    // Local fallback
    const accounts = getAccounts();
    const account = accounts[username.toLowerCase()];
    if (account && account.password === password) {
      localStorage.setItem(KV_PREFIX + 'token', 'local_' + Date.now());
      localStorage.setItem(KV_PREFIX + 'username', username.toLowerCase());
      localStorage.setItem(KV_PREFIX + 'role', account.role);
      return { success: true, role: account.role };
    }

    return { success: false };
  }

  function logout() {
    localStorage.removeItem(KV_PREFIX + 'token');
    localStorage.removeItem(KV_PREFIX + 'username');
    localStorage.removeItem(KV_PREFIX + 'role');
    window.location.href = 'index.html';
  }

  function isLoggedIn() {
    return !!localStorage.getItem(KV_PREFIX + 'token');
  }

  function getRole() {
    return localStorage.getItem(KV_PREFIX + 'role') || 'guest';
  }

  function getUsername() {
    return localStorage.getItem(KV_PREFIX + 'username') || '';
  }

  function isReadOnly() {
    return getRole() === 'guest';
  }

  function changePassword(currentPw, newPw) {
    const username = getUsername();
    const accounts = getAccounts();
    if (accounts[username] && accounts[username].password === currentPw) {
      accounts[username].password = newPw;
      saveAccounts(accounts);
      return true;
    }
    return false;
  }

  // Login form handler (only on login page)
  if (document.getElementById('loginForm')) {
    const form = document.getElementById('loginForm');
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    // Redirect if already logged in
    if (isLoggedIn()) {
      window.location.href = 'hub.html';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!username || !password) return;

      btn.classList.add('login-btn--loading');
      btn.disabled = true;
      errorEl.classList.remove('login-error--visible');

      // Simulated delay for polish
      await new Promise(r => setTimeout(r, 600));

      const result = await login(username, password);

      if (result.success) {
        document.querySelector('.login-card').style.animation = 'fadeIn 0.3s ease reverse both';
        setTimeout(() => {
          window.location.href = 'hub.html';
        }, 300);
      } else {
        btn.classList.remove('login-btn--loading');
        btn.disabled = false;
        errorEl.classList.add('login-error--visible');
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 400);
      }
    });
  }

  return { login, logout, isLoggedIn, getRole, getUsername, isReadOnly, changePassword };
})();
