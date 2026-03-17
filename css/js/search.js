/* ============================================
   Search Module
   ============================================ */

const Search = (() => {
  let isOpen = false;
  let focusedIndex = -1;

  function init() {
    const overlay = document.getElementById('searchOverlay');
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('searchInput');
    const body = document.getElementById('searchBody');

    // Open
    document.getElementById('btnSearch').addEventListener('click', open);

    // Close
    overlay.addEventListener('click', close);

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? close() : open();
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    });

    // Search input
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      if (query.length === 0) {
        body.innerHTML = '<div class="search-modal__hint">Start typing to search…</div>';
        focusedIndex = -1;
        return;
      }
      performSearch(query);
    });

    // Arrow key navigation
    input.addEventListener('keydown', (e) => {
      const results = body.querySelectorAll('.search-result');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusedIndex = Math.min(focusedIndex + 1, results.length - 1);
        updateFocus(results);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusedIndex = Math.max(focusedIndex - 1, 0);
        updateFocus(results);
      } else if (e.key === 'Enter' && focusedIndex >= 0 && results[focusedIndex]) {
        results[focusedIndex].click();
      }
    });
  }

  function open() {
    isOpen = true;
    document.getElementById('searchOverlay').classList.add('overlay--visible');
    document.getElementById('searchModal').classList.add('search-modal--visible');
    setTimeout(() => document.getElementById('searchInput').focus(), 100);
  }

  function close() {
    isOpen = false;
    document.getElementById('searchOverlay').classList.remove('overlay--visible');
    document.getElementById('searchModal').classList.remove('search-modal--visible');
    document.getElementById('searchInput').value = '';
    document.getElementById('searchBody').innerHTML = '<div class="search-modal__hint">Start typing to search…</div>';
    focusedIndex = -1;
  }

  function performSearch(query) {
    const data = Store.get();
    const results = [];

    // Search roadmap features
    data.roadmap.phases.forEach(phase => {
      phase.features.forEach(feature => {
        if (feature.name.toLowerCase().includes(query) || feature.description.toLowerCase().includes(query)) {
          results.push({
            type: 'feature',
            icon: feature.icon,
            text: feature.name,
            sub: `Phase ${phase.number} — ${phase.title}`,
            action: () => {
              Router.navigate('roadmap');
              close();
            }
          });
        }
        // Search subtasks
        feature.subtasks.forEach(st => {
          if (st.text.toLowerCase().includes(query)) {
            results.push({
              type: 'subtask',
              icon: '📌',
              text: st.text,
              sub: feature.name,
              action: () => {
                Router.navigate('roadmap');
                close();
              }
            });
          }
        });
      });
    });

    // Search tasks
    data.roles.forEach(role => {
      // Search role name
      if (role.name.toLowerCase().includes(query)) {
        results.push({
          type: 'role',
          icon: role.icon,
          text: role.name,
          sub: `${role.tasks.length} tasks`,
          action: () => {
            Router.navigate('tasks');
            close();
          }
        });
      }
      role.tasks.forEach(task => {
        if (task.title.toLowerCase().includes(query) || (task.body && task.body.toLowerCase().includes(query))) {
          results.push({
            type: 'task',
            icon: '📋',
            text: task.title,
            sub: role.name,
            action: () => {
              Router.navigate('tasks');
              close();
            }
          });
        }
      });
    });

    const body = document.getElementById('searchBody');
    focusedIndex = -1;

    if (results.length === 0) {
      body.innerHTML = '<div class="search-modal__hint">No results found</div>';
      return;
    }

    body.innerHTML = `
      <div class="search-modal__results">
        ${results.slice(0, 10).map((r, i) => `
          <div class="search-result" data-index="${i}">
            <span class="search-result__icon">${r.icon}</span>
            <div style="flex:1;min-width:0;">
              <div class="search-result__text">${highlightMatch(r.text, query)}</div>
              <div style="font-size:0.65rem;color:var(--text-tertiary);font-family:var(--font-mono);letter-spacing:0.05em;">${r.sub}</div>
            </div>
            <span class="search-result__type">${r.type}</span>
          </div>
        `).join('')}
      </div>
    `;

    // Bind clicks
    body.querySelectorAll('.search-result').forEach((el, i) => {
      el.addEventListener('click', () => {
        if (results[i] && results[i].action) results[i].action();
      });
    });
  }

  function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return text.substring(0, idx) +
      `<mark>${text.substring(idx, idx + query.length)}</mark>` +
      text.substring(idx + query.length);
  }

  function updateFocus(results) {
    results.forEach((el, i) => {
      el.classList.toggle('search-result--focused', i === focusedIndex);
    });
    if (results[focusedIndex]) {
      results[focusedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  return { init, open, close };
})();
