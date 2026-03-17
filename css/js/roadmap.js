/* ============================================
   Roadmap Module
   ============================================ */

const Roadmap = (() => {
  function render() {
    const data = Store.get();
    const phases = data.roadmap.phases;

    renderSidebar(phases);
    renderContent(phases);
  }

  function renderSidebar(phases) {
    const el = document.getElementById('roadmapSidebar');
    const totalTasks = phases.reduce((sum, p) => sum + p.features.reduce((s, f) => s + f.subtasks.length, 0), 0);
    const doneTasks = phases.reduce((sum, p) => sum + p.features.reduce((s, f) => s + f.subtasks.filter(st => st.done).length, 0), 0);

    el.innerHTML = `
      <div class="roadmap__sidebar-header">Phases</div>
      <ul class="roadmap__phase-list">
        ${phases.map(phase => {
          const total = phase.features.reduce((s, f) => s + f.subtasks.length, 0);
          const done = phase.features.reduce((s, f) => s + f.subtasks.filter(st => st.done).length, 0);
          return `
            <li class="roadmap__phase-item" data-phase="${phase.id}">
              <span class="roadmap__phase-dot" style="background:${phase.color}"></span>
              <span class="roadmap__phase-name">${phase.number} — ${phase.title}</span>
              <span class="roadmap__phase-count">${done}/${total}</span>
            </li>
          `;
        }).join('')}
      </ul>
      <div class="roadmap__progress-section">
        ${phases.map(phase => {
          const total = phase.features.reduce((s, f) => s + f.subtasks.length, 0);
          const done = phase.features.reduce((s, f) => s + f.subtasks.filter(st => st.done).length, 0);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return `
            <div class="roadmap__progress-item">
              <div class="roadmap__progress-label">
                <span>Phase ${phase.number}</span>
                <span class="roadmap__progress-pct" style="color:${phase.color}">${pct}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar__fill" style="width:${pct}%;background:${phase.color}"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Sidebar click to scroll
    el.querySelectorAll('.roadmap__phase-item').forEach(item => {
      item.addEventListener('click', () => {
        const phaseEl = document.querySelector(`[data-phase-group="${item.dataset.phase}"]`);
        if (phaseEl) {
          phaseEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function renderContent(phases) {
    const el = document.getElementById('roadmapContent');

    el.innerHTML = phases.map(phase => `
      <div class="phase-group" data-phase-group="${phase.id}">
        <div class="phase-group__header">
          <span class="phase-group__number" style="color:${phase.color}">${phase.number}</span>
          <span class="phase-group__title">${phase.title.toUpperCase()}</span>
        </div>
        <div class="phase-group__cards">
          ${phase.features.length === 0
            ? `<div class="phase-group__empty">No features yet — add via AI Draft or manually</div>`
            : phase.features.map(feature => {
                const total = feature.subtasks.length;
                const done = feature.subtasks.filter(s => s.done).length;
                return `
                  <div class="feature-card" data-feature="${feature.id}">
                    <div class="feature-card__icon">${feature.icon}</div>
                    <div class="feature-card__info">
                      <div class="feature-card__name">${feature.name}</div>
                      <div class="feature-card__desc">${feature.description}</div>
                    </div>
                    <span class="feature-card__progress">${done}/${total}</span>
                    <span class="badge badge--${feature.tagType}">${feature.tag}</span>
                    <span class="feature-card__chevron">›</span>
                  </div>
                `;
              }).join('')
          }
        </div>
      </div>
    `).join('');

    // Feature card click → expand (could open detail modal)
    el.querySelectorAll('.feature-    el.querySelectorAll('.feature-card').forEach(card => {
      card.addEventListener('click', () => {
        const featureId = card.dataset.feature;
        openFeatureDetail(featureId);
      });
    });
  }

  function openFeatureDetail(featureId) {
    const data = Store.get();
    let feature = null;
    let phaseRef = null;

    for (const phase of data.roadmap.phases) {
      const found = phase.features.find(f => f.id === featureId);
      if (found) {
        feature = found;
        phaseRef = phase;
        break;
      }
    }

    if (!feature) return;

    const isReadOnly = Auth.isReadOnly();

    // Create modal
    const overlay = document.createElement('div');
    overlay.className = 'overlay overlay--visible';

    const modal = document.createElement('div');
    modal.className = 'feature-detail-modal';
    modal.innerHTML = `
      <div class="feature-detail">
        <div class="feature-detail__header">
          <div class="feature-detail__title-row">
            <span class="feature-detail__icon">${feature.icon}</span>
            <h2 class="feature-detail__title">${feature.name}</h2>
            <span class="badge badge--${feature.tagType}">${feature.tag}</span>
          </div>
          <button class="feature-detail__close" id="featureDetailClose">✕</button>
        </div>
        <p class="feature-detail__desc">${feature.description}</p>
        <div class="feature-detail__phase-label">
          <span class="dot" style="background:${phaseRef.color}"></span>
          Phase ${phaseRef.number} — ${phaseRef.title}
        </div>
        <div class="feature-detail__subtasks-header">
          <span class="mono">Subtasks</span>
          <span class="mono">${feature.subtasks.filter(s => s.done).length}/${feature.subtasks.length} done</span>
        </div>
        <div class="progress-bar" style="margin-bottom:var(--space-4)">
          <div class="progress-bar__fill" style="width:${feature.subtasks.length > 0 ? Math.round((feature.subtasks.filter(s=>s.done).length / feature.subtasks.length) * 100) : 0}%"></div>
        </div>
        <div class="feature-detail__subtask-list" id="featureSubtaskList">
          ${feature.subtasks.map(st => `
            <label class="feature-detail__subtask ${st.done ? 'feature-detail__subtask--done' : ''}">
              <input type="checkbox" ${st.done ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''} data-subtask="${st.id}">
              <span>${st.text}</span>
            </label>
          `).join('')}
          ${feature.subtasks.length === 0 ? '<div class="feature-detail__empty">No subtasks yet</div>' : ''}
        </div>
        ${!isReadOnly ? `
          <div class="feature-detail__add-row">
            <input type="text" class="feature-detail__add-input" placeholder="Add subtask..." id="addSubtaskInput">
            <button class="btn btn--primary btn--sm" id="addSubtaskBtn">Add</button>
          </div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // Inject styles for detail modal if not present
    if (!document.getElementById('featureDetailStyles')) {
      const style = document.createElement('style');
      style.id = 'featureDetailStyles';
      style.textContent = `
        .feature-detail-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          z-index: 1001;
          animation: slideUp 0.3s var(--ease-out) both;
        }
        .feature-detail {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: var(--space-8);
          overflow-y: auto;
          max-height: 80vh;
          box-shadow: var(--shadow-xl);
        }
        .feature-detail__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--space-4);
        }
        .feature-detail__title-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
        }
        .feature-detail__icon { font-size: 1.5rem; }
        .feature-detail__title {
          font-family: var(--font-display);
          font-size: var(--text-xl);
          font-weight: 700;
        }
        .feature-detail__close {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          font-size: 1.2rem;
          padding: var(--space-2);
          border-radius: var(--radius-sm);
          transition: all var(--duration-fast) var(--ease-out);
        }
        .feature-detail__close:hover {
          background: var(--bg-glass-light);
          color: var(--text-primary);
        }
        .feature-detail__desc {
          color: var(--text-secondary);
          font-size: var(--text-sm);
          line-height: 1.6;
          margin-bottom: var(--space-4);
        }
        .feature-detail__phase-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          letter-spacing: var(--tracking-wide);
          color: var(--text-tertiary);
          margin-bottom: var(--space-6);
        }
        .feature-detail__subtasks-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--space-3);
        }
        .feature-detail__subtask-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-bottom: var(--space-4);
        }
        .feature-detail__subtask {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background var(--duration-fast) var(--ease-out);
          font-size: var(--text-sm);
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .feature-detail__subtask:hover {
          background: var(--bg-elevated);
        }
        .feature-detail__subtask--done span {
          text-decoration: line-through;
          color: var(--text-tertiary);
        }
        .feature-detail__subtask input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid var(--border-strong);
          border-radius: 4px;
          background: var(--bg-primary);
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 1px;
          transition: all var(--duration-fast) var(--ease-out);
        }
        .feature-detail__subtask input[type="checkbox"]:checked {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }
        .feature-detail__subtask input[type="checkbox"]:checked::after {
          content: '✓';
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: #fff;
          width: 100%;
          height: 100%;
        }
        .feature-detail__empty {
          text-align: center;
          padding: var(--space-6);
          color: var(--text-tertiary);
          font-family: var(--font-mono);
          font-size: var(--text-sm);
        }
        .feature-detail__add-row {
          display: flex;
          gap: var(--space-2);
        }
        .feature-detail__add-input {
          flex: 1;
          padding: var(--space-3) var(--space-4);
          background: var(--bg-tertiary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: var(--text-sm);
          outline: none;
          transition: border-color var(--duration-fast) var(--ease-out);
        }
        .feature-detail__add-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-glow);
        }
      `;
      document.head.appendChild(style);
    }

    // Close handlers
    const closeModal = () => {
      modal.style.animation = 'fadeIn 0.2s ease reverse both';
      overlay.classList.remove('overlay--visible');
      setTimeout(() => {
        modal.remove();
        overlay.remove();
        render(); // Re-render roadmap
      }, 200);
    };

    modal.querySelector('#featureDetailClose').addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Subtask toggle
    modal.querySelectorAll('[data-subtask]').forEach(cb => {
      cb.addEventListener('change', () => {
        const subtaskId = cb.dataset.subtask;
        Store.update(data => {
          for (const phase of data.roadmap.phases) {
            for (const feat of phase.features) {
              const st = feat.subtasks.find(s => s.id === subtaskId);
              if (st) {
                st.done = cb.checked;
                Store.logActivity(
                  cb.checked ? 'completed_subtask' : 'uncompleted_subtask',
                  `${st.text} (${feat.name})`
                );
                break;
              }
            }
          }
        });

        // Update UI in modal
        const label = cb.closest('.feature-detail__subtask');
        label.classList.toggle('feature-detail__subtask--done', cb.checked);

        // Update counts
        const subtaskList = modal.querySelector('#featureSubtaskList');
        const total = feature.subtasks.length;
        const done = feature.subtasks.filter(s => s.done).length;
        modal.querySelector('.feature-detail__subtasks-header .mono:last-child').textContent = `${done}/${total} done`;
        modal.querySelector('.progress-bar__fill').style.width = `${total > 0 ? Math.round((done/total)*100) : 0}%`;

        updateGlobalStats();
      });
    });

    // Add subtask
    const addInput = modal.querySelector('#addSubtaskInput');
    const addBtn = modal.querySelector('#addSubtaskBtn');
    if (addInput && addBtn) {
      const addSubtask = () => {
        const text = addInput.value.trim();
        if (!text) return;

        const newId = 's_' + Date.now();
        Store.update(data => {
          for (const phase of data.roadmap.phases) {
            const feat = phase.features.find(f => f.id === featureId);
            if (feat) {
              feat.subtasks.push({ id: newId, text, done: false });
              Store.logActivity('added_subtask', `${text} (${feat.name})`);
              break;
            }
          }
        });

        // Re-open modal with updated data
        closeModal();
        setTimeout(() => openFeatureDetail(featureId), 250);
      };

      addBtn.addEventListener('click', addSubtask);
      addInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addSubtask();
      });
    }
  }

  function updateGlobalStats() {
    const data = Store.get();
    const phases = data.roadmap.phases;
    const totalTasks = phases.reduce((sum, p) => sum + p.features.reduce((s, f) => s + f.subtasks.length, 0), 0);
    const doneTasks = phases.reduce((sum, p) => sum + p.features.reduce((s, f) => s + f.subtasks.filter(st => st.done).length, 0), 0);
    const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const taskCountEl = document.getElementById('taskCount');
    const releaseEl = document.getElementById('releaseReady');
    if (taskCountEl) taskCountEl.textContent = `${doneTasks}/${totalTasks} roadmap tasks`;
    if (releaseEl) releaseEl.textContent = `${pct}% release ready`;
  }

  return { render, updateGlobalStats };
})();
