/* ============================================
   Team Tasks Module
   ============================================ */

const Tasks = (() => {
  let activeRole = null;
  let hideDone = false;

  function render() {
    const data = Store.get();
    const roles = data.roles;

    if (!activeRole && roles.length > 0) {
      activeRole = roles[0].id;
    }

    renderRoleTabs(roles);
    renderRoleContent(roles);
    bindEvents();
  }

  function renderRoleTabs(roles) {
    const el = document.getElementById('roleTabs');

    el.innerHTML = roles.map(role => {
      const total = role.tasks.length;
      const done = role.tasks.filter(t => t.status === 'done').length;
      const isActive = role.id === activeRole;

      return `
        <button class="role-tab ${isActive ? 'role-tab--active' : ''}" data-role="${role.id}">
          <span class="role-tab__dot" style="background:${role.color}"></span>
          <span class="role-tab__icon">${role.icon}</span>
          <span>${role.name.toUpperCase()}</span>
          <span class="role-tab__count">${done}/${total}</span>
        </button>
      `;
    }).join('');

    // Tab click handlers
    el.querySelectorAll('.role-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeRole = tab.dataset.role;
        render();
      });
    });
  }

  function renderRoleContent(roles) {
    const el = document.getElementById('roleContent');
    const role = roles.find(r => r.id === activeRole);

    if (!role) {
      el.innerHTML = '<div class="phase-group__empty">Select a role</div>';
      return;
    }

    const filteredTasks = hideDone ? role.tasks.filter(t => t.status !== 'done') : role.tasks;
    const total = role.tasks.length;
    const done = role.tasks.filter(t => t.status === 'done').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const isReadOnly = Auth.isReadOnly();

    el.innerHTML = `
      <div class="role-section role-section--active">
        <div class="role-section__header">
          <h3 class="role-section__title">
            <span class="role-section__title-icon">${role.icon}</span>
            <span style="color:${role.color}">${role.name.toUpperCase()}</span>
          </h3>
          <div class="role-section__meta">
            <span class="role-section__progress-text">${done}/${total} done</span>
            <div class="progress-bar role-section__progress-bar" style="width:160px">
              <div class="progress-bar__fill" style="width:${pct}%;background:${role.color}"></div>
            </div>
            ${!isReadOnly ? `<button class="btn btn--primary btn--sm" id="addTaskToRole">+ Task</button>` : ''}
          </div>
        </div>
        <div class="task-list" id="taskList">
          ${filteredTasks.length === 0
            ? `<div class="phase-group__empty">${hideDone && done > 0 ? `${done} completed tasks hidden` : 'No tasks yet'}</div>`
            : filteredTasks.map(task => renderTaskCard(task, role, isReadOnly)).join('')
          }
        </div>
      </div>
    `;

    // Bind task interactions
    bindTaskInteractions(role, isReadOnly);
  }

  function renderTaskCard(task, role, isReadOnly) {
    const isDone = task.status === 'done';
    const priorityColors = {
      low: 'info',
      med: 'warning',
      high: 'critical'
    };

    const statusLabels = {
      todo: 'TO DO',
      'in-progress': 'IN PROGRESS',
      done: 'DONE',
      blocked: 'BLOCKED'
    };

    const statusBadgeType = {
      todo: '',
      'in-progress': 'info',
      done: 'success',
      blocked: 'critical'
    };

    return `
      <div class="task-card ${isDone ? 'task-card--done' : ''}" data-task="${task.id}">
        <div class="task-card__header">
          <span class="task-card__title">${task.title}</span>
          <div class="task-card__tags">
            ${!isReadOnly ? `
              <select class="task-status-select" data-task-id="${task.id}" style="
                appearance:none;
                background:var(--bg-tertiary);
                border:1px solid var(--border-default);
                border-radius:var(--radius-sm);
                color:var(--text-secondary);
                font-family:var(--font-mono);
                font-size:0.6rem;
                letter-spacing:0.08em;
                text-transform:uppercase;
                padding:2px 8px;
                cursor:pointer;
              ">
                <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>TO DO</option>
                <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>IN PROGRESS</option>
                <option value="done" ${task.status === 'done' ? 'selected' : ''}>DONE</option>
                <option value="blocked" ${task.status === 'blocked' ? 'selected' : ''}>BLOCKED</option>
              </select>
            ` : `
              <span class="badge badge--${statusBadgeType[task.status] || ''}">${statusLabels[task.status]}</span>
            `}
            <span class="badge badge--${priorityColors[task.priority] || 'info'}">${task.priority.toUpperCase()}</span>
          </div>
        </div>
        ${task.body ? `
          <div class="task-card__body">${task.body}</div>
        ` : ''}
        ${task.checklist && task.checklist.length > 0 ? `
          <div class="task-card__checklist">
            ${task.checklist.map(item => `
              <label class="task-card__check-item">
                <input type="checkbox" ${item.done ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''} data-check="${item.id}" data-task-id="${task.id}">
                <span>${item.text}</span>
              </label>
            `).join('')}
          </div>
        ` : ''}
        ${!isReadOnly ? `
          <div class="task-card__footer">
            <button class="btn btn--ghost btn--sm task-delete-btn" data-task-id="${task.id}">🗑️ Delete</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  function bindTaskInteractions(role, isReadOnly) {
    if (isReadOnly) return;

    // Status change
    document.querySelectorAll('.task-status-select').forEach(sel => {
      sel.addEventListener('change', () => {
        const taskId = sel.dataset.taskId;
        const newStatus = sel.value;
        Store.update(data => {
          const r = data.roles.find(r => r.id === role.id);
          if (r) {
            const task = r.tasks.find(t => t.id === taskId);
            if (task) {
              const oldStatus = task.status;
              task.status = newStatus;
              Store.logActivity('status_change', `${task.title}: ${oldStatus} → ${newStatus}`);
            }
          }
        });
        render();
        App.toast(`Status updated`, 'success');
      });
    });

    // Checklist toggle
    document.querySelectorAll('[data-check]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checkId = cb.dataset.check;
        const taskId = cb.dataset.taskId;
        Store.update(data => {
          const r = data.roles.find(r => r.id === role.id);
          if (r) {
            const task = r.tasks.find(t => t.id === taskId);
            if (task) {
              const item = task.checklist.find(c => c.id === checkId);
              if (item) {
                item.done = cb.checked;
                Store.logActivity(
                  cb.checked ? 'checked_item' : 'unchecked_item',
                  `${item.text} (${task.title})`
                );
              }
            }
          }
        });
      });
    });

    // Delete task
    document.querySelectorAll('.task-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.dataset.taskId;
        if (!confirm('Delete this task?')) return;
        Store.update(data => {
          const r = data.roles.find(r => r.id === role.id);
          if (r) {
            const task = r.tasks.find(t => t.id === taskId);
            r.tasks = r.tasks.filter(t => t.id !== taskId);
            if (task) Store.logActivity('deleted_task', task.title);
          }
        });
        render();
        App.toast('Task deleted', 'info');
      });
    });

    // Add task button
    const addBtn = document.getElementById('addTaskToRole');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        openAddTaskModal(role.id);
      });
    }
  }

  function openAddTaskModal(roleId) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay overlay--visible';

    const modal = document.createElement('div');
    modal.className = 'feature-detail-modal';
    modal.innerHTML = `
      <div class="feature-detail" style="padding:var(--space-6);">
        <div class="feature-detail__header">
          <h2 class="feature-detail__title" style="font-size:var(--text-lg);">New Task</h2>
          <button class="feature-detail__close" id="addTaskClose">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-4);margin-top:var(--space-4);">
          <input type="text" class="feature-detail__add-input" placeholder="Task title" id="newTaskTitle" style="width:100%;">
          <textarea class="ai-panel__textarea" placeholder="Description (optional)" id="newTaskBody" style="min-height:100px;"></textarea>
          <div style="display:flex;gap:var(--space-2);align-items:center;">
            <span class="mono" style="color:var(--text-tertiary);">Priority:</span>
            <select id="newTaskPriority" style="
              appearance:none;
              background:var(--bg-tertiary);
              border:1px solid var(--border-default);
              border-radius:var(--radius-sm);
              color:var(--text-primary);
              font-family:var(--font-mono);
              font-size:var(--text-xs);
              letter-spacing:0.08em;
              text-transform:uppercase;
              padding:var(--space-2) var(--space-3);
              cursor:pointer;
            ">
              <option value="low">LOW</option>
              <option value="med" selected>MED</option>
              <option value="high">HIGH</option>
            </select>
          </div>
          <button class="btn btn--primary" id="newTaskSubmit">Create Task</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
      overlay.remove();
    };

    modal.querySelector('#addTaskClose').addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    modal.querySelector('#newTaskSubmit').addEventListener('click', () => {
      const title = modal.querySelector('#newTaskTitle').value.trim();
      if (!title) {
        App.toast('Title is required', 'error');
        return;
      }
      const body = modal.querySelector('#newTaskBody').value.trim();
      const priority = modal.querySelector('#newTaskPriority').value;

      Store.update(data => {
        const role = data.roles.find(r => r.id === roleId);
        if (role) {
          role.tasks.push({
            id: 't_' + Date.now(),
            title,
            body,
            status: 'todo',
            priority,
            checklist: []
          });
          Store.logActivity('created_task', `${title} (${role.name})`);
        }
      });

      closeModal();
      render();
      App.toast('Task created', 'success');
    });

    modal.querySelector('#newTaskTitle').focus();
  }

  function bindEvents() {
    // Hide done toggle
    const hideDoneBtn = document.getElementById('btnHideDone');
    if (hideDoneBtn) {
      hideDoneBtn.textContent = hideDone ? 'Show Done' : 'Hide Done';
      hideDoneBtn.onclick = () => {
        hideDone = !hideDone;
        render();
      };
    }

    // Add task button (top level)
    const addTaskBtn = document.getElementById('btnAddTask');
    if (addTaskBtn && activeRole) {
      addTaskBtn.onclick = () => {
        if (Auth.isReadOnly()) {
          App.toast('Guests cannot add tasks', 'error');
          return;
        }
        openAddTaskModal(activeRole);
      };
    }
  }

  return { render };
})();
