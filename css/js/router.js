/* ============================================
   Tab Router
   ============================================ */

const Router = (() => {
  let currentTab = 'roadmap';
  const callbacks = {};

  function init() {
    const tabs = document.querySelectorAll('.nav__tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        navigate(tab.dataset.tab);
      });
    });

    // Read hash
    const hash = window.location.hash.replace('#', '');
    if (['roadmap', 'tasks', 'activity'].includes(hash)) {
      navigate(hash);
    }
  }

  function navigate(tabId) {
    currentTab = tabId;
    window.location.hash = tabId;

    // Update tab UI
    document.querySelectorAll('.nav__tab').forEach(t => {
      t.classList.toggle('nav__tab--active', t.dataset.tab === tabId);
    });

    // Update sections
    document.querySelectorAll('.page-section').forEach(s => {
      s.classList.remove('page-section--active');
    });
    const section = document.getElementById('section' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
    if (section) {
      section.classList.add('page-section--active');
    }

    // Fire callbacks
    if (callbacks[tabId]) {
      callbacks[tabId].forEach(cb => cb());
    }
  }

  function onNavigate(tabId, callback) {
    if (!callbacks[tabId]) callbacks[tabId] = [];
    callbacks[tabId].push(callback);
  }

  function getCurrent() {
    return currentTab;
  }

  return { init, navigate, onNavigate, getCurrent };
})();
