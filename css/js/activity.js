/* ============================================
   Activity Feed Module
   ============================================ */

const Activity = (() => {
  function render() {
    const data = Store.get();
    const activities = data.activity || [];
    const el = document.getElementById('activityFeed');

    if (activities.length === 0) {
      el.innerHTML = `
        <div class="activity-feed__empty">
          <div class="activity-feed__empty-icon">⚡</div>
          <div class="activity-feed__empty-text">No activity yet</div>
          <div class="activity-feed__empty-sub">Actions like task updates and subtask completions will appear here</div>
        </div>
      `;
      return;
    }

    el.innerHTML = activities.slice(0, 50).map(act => {
      const initials = act.user.substring(0, 2).toUpperCase();
      const timeAgo = getTimeAgo(act.timestamp);
      const actionText = formatAction(act.action, act.detail);

      return `
        <div class="activity-item">
          <div class="activity-item__avatar">${initials}</div>
          <div class="activity-item__content">
            <div class="activity-item__text">${actionText}</div>
            <div class="activity-item__time">${timeAgo}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function formatAction(action, detail) {
    const actions = {
      completed_subtask: `completed subtask <span class="highlight">${detail}</span>`,
      uncompleted_subtask: `unchecked subtask <span class="highlight">${detail}</span>`,
      added_subtask: `added subtask <span class="highlight">${detail}</span>`,
      status_change: `changed status: <span class="highlight">${detail}</span>`,
      checked_item: `checked <span class="highlight">${detail}</span>`,
      unchecked_item: `unchecked <span class="highlight">${detail}</span>`,
      created_task: `created task <span class="highlight">${detail}</span>`,
      deleted_task: `deleted task <span class="highlight">${detail}</span>`,
      sent_message: `sent a message in team chat`,
      ai_generated: `generated AI draft: <span class="highlight">${detail}</span>`,
      password_changed: `changed their password`,
    };

    return actions[action] || `${action}: <span class="highlight">${detail}</span>`;
  }

  function getTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return then.toLocaleDateString();
  }

  return { render };
})();
