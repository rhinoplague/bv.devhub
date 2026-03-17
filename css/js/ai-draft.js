/* ============================================
   AI Draft Module
   ============================================ */

const AIDraft = (() => {
  let currentMode = 'roadmap';

  function init() {
    const panel = document.getElementById('aiPanel');
    const openBtn = document.getElementById('btnAI');
    const closeBtn = document.getElementById('aiPanelClose');
    const generateBtn = document.getElementById('aiGenerateBtn');

    openBtn.addEventListener('click', () => {
      panel.classList.add('ai-panel--visible');
    });

    closeBtn.addEventListener('click', () => {
      panel.classList.remove('ai-panel--visible');
    });

    // Mode toggle
    document.querySelectorAll('.ai-panel__mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ai-panel__mode-btn').forEach(b => b.classList.remove('ai-panel__mode-btn--active'));
        btn.classList.add('ai-panel__mode-btn--active');
        currentMode = btn.dataset.mode;
      });
    });

    // Generate
    generateBtn.addEventListener('click', generate);
  }

  async function generate() {
    const textarea = document.getElementById('aiTextarea');
    const notes = textarea.value.trim();
    const output = document.getElementById('aiOutput');
    const outputContent = document.getElementById('aiOutputContent');
    const btn = document.getElementById('aiGenerateBtn');

    if (!notes) {
      App.toast('Please enter some notes or GDD text', 'error');
      return;
    }

    if (Auth.isReadOnly()) {
      App.toast('Guests cannot use AI Draft', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Generating…';

    try {
      // Try cloud AI endpoint
      const token = localStorage.getItem('hxg_token');
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mode: currentMode, notes })
      });

      if (res.ok) {
        const data = await res.json();
        outputContent.innerHTML = `<pre>${data.draft}</pre>`;
      } else {
        // Fallback: local mock generation
        outputContent.innerHTML = `<pre>${localGenerate(notes)}</pre>`;
      }
    } catch (e) {
      // Offline fallback
      outputContent.innerHTML = `<pre>${localGenerate(notes)}</pre>`;
    }

    output.classList.add('ai-panel__output--visible');
    btn.disabled = false;
    btn.textContent = 'Generate →';

    Store.logActivity('ai_generated', `${currentMode} draft from notes`);

    // Copy button
    document.getElementById('aiCopyBtn').onclick = () => {
      navigator.clipboard.writeText(outputContent.textContent);
      App.toast('Copied to clipboard', 'success');
    };

    // Apply button
    document.getElementById('aiApplyBtn').onclick = () => {
      App.toast('Draft applied (feature coming soon)', 'info');
    };
  }

  function localGenerate(notes) {
    if (currentMode === 'roadmap') {
      return `SUGGESTED ROADMAP ITEMS
━━━━━━━━━━━━━━━━━━━━━━

Based on your notes:
"${notes.substring(0, 100)}${notes.length > 100 ? '...' : ''}"

Feature: ${extractTitle(notes)}
├─ Description: ${notes.substring(0, 80)}
├─ Suggested Phase: 02 — Stabilize Systems
├─ Tag: RETENTION
└─ Subtasks:
   ├─ Research and prototype
   ├─ Implement core mechanic
   ├─ Polish and test
   └─ Review with team

⚠ This is a local draft. Connect AI API for smarter results.`;
    } else {
      return `SUGGESTED TEAM TASKS
━━━━━━━━━━━━━━━━━━━━

Based on your notes:
"${notes.substring(0, 100)}${notes.length > 100 ? '...' : ''}"

Task: ${extractTitle(notes)}
├─ Priority: MED
├─ Suggested Role: Builder
└─ Description: ${notes.substring(0, 120)}

Checklist:
  □ Initial implementation
  □ Testing pass
  □ Review and feedback

⚠ This is a local draft. Connect AI API for smarter results.`;
    }
  }

  function extractTitle(notes) {
    const words = notes.split(/\s+/).slice(0, 5).join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  return { init };
})();
