/* ============================================
   Data Store — Single source of truth
   ============================================ */

const Store = (() => {
  const KV_PREFIX = 'hxg_';

  // Default data structure
  const defaultData = {
    roadmap: {
      phases: [
        {
          id: 'p01',
          number: '01',
          title: 'Polish the Core',
          color: '#22c55e',
          features: [
            {
              id: 'f01',
              icon: '🐛',
              name: 'Critical Bug Pass',
              description: 'Known issues that will directly block player progress.',
              tag: 'CRITICAL',
              tagType: 'critical',
              subtasks: [
                { id: 's01', text: 'Fix inventory duplication glitch', done: false },
                { id: 's02', text: 'Resolve save corruption on zone transition', done: false }
              ]
            }
          ]
        },
        {
          id: 'p02',
          number: '02',
          title: 'Stabilize Systems',
          color: '#3b82f6',
          features: [
            {
              id: 'f02',
              icon: '👥',
              name: 'Party System — Fix or Disable',
              description: 'Buggy social features hurt trust more than missing ones.',
              tag: 'RETENTION',
              tagType: 'retention',
              subtasks: [
                { id: 's03', text: 'Diagnose party invite desync', done: false },
                { id: 's04', text: 'Test party dissolution edge cases', done: false },
                { id: 's05', text: 'Implement fallback solo mode', done: false }
              ]
            },
            {
              id: 'f03',
              icon: '📋',
              name: 'Board Quests — Mid-Tier Content',
              description: 'Players need a reason to log back in after F-rank.',
              tag: 'RETENTION',
              tagType: 'retention',
              subtasks: [
                { id: 's06', text: 'Design 5 repeatable board quests', done: false },
                { id: 's07', text: 'Implement quest reward scaling', done: false },
                { id: 's08', text: 'Add quest board NPC dialogue', done: false }
              ]
            }
          ]
        },
        {
          id: 'p03',
          number: '03',
          title: 'Seal for Ship',
          color: '#ef4444',
          features: []
        }
      ]
    },
    roles: [
      {
        id: 'r01',
        name: 'Animator',
        icon: '🎬',
        color: '#38bdf8',
        tasks: [
          {
            id: 't01',
            title: 'Faint Animation',
            body: 'basically here I want the character to get dizzy, fall on a knee and then just collapse make it a lil cinematic',
            status: 'todo',
            priority: 'med',
            checklist: []
          },
          {
            id: 't02',
            title: 'Fox Bear',
            body: '',
            status: 'todo',
            priority: 'med',
            checklist: [
              { id: 'c01', text: '[Camera Cutscene] the floor POV was a little bit weird I believe it could work but with a little more polishing rn its js a little weird', done: false },
              { id: 'c02', text: '[Stun Animation] basically when the boss is hit many times he will go into this state where he is stunned for a short period 3-5 seconds', done: false }
            ]
          }
        ]
      },
      {
        id: 'r02',
        name: 'Builder',
        icon: '🏗️',
        color: '#f472b6',
        tasks: [
          { id: 't03', title: 'Starter Village Layout', body: 'Need to block out the starter village. Main quest giver should be visible from spawn point.', status: 'todo', priority: 'high', checklist: [] },
          { id: 't04', title: 'Arena Map v2', body: 'Rebuild arena to support 4-player mode', status: 'todo', priority: 'med', checklist: [] },
          { id: 't05', title: 'Dungeon Floor 1 Props', body: 'Add breakable crates, torches, and fog volumes', status: 'todo', priority: 'low', checklist: [] },
          { id: 't06', title: 'NPC Shop Interior', body: 'Cozy interior with shelves, potions, and a counter', status: 'todo', priority: 'low', checklist: [] },
          { id: 't07', title: 'Boss Room - Fox Bear Lair', body: 'Large circular arena with pillars for cover', status: 'todo', priority: 'high', checklist: [] },
          { id: 't08', title: 'Lighting Pass - Town', body: 'Dynamic day/night lighting for the main town area', status: 'todo', priority: 'med', checklist: [] }
        ]
      },
      {
        id: 'r03',
        name: '2D Artist',
        icon: '🎨',
        color: '#fb923c',
        tasks: [
          { id: 't09', title: 'UI Icon Set', body: 'Need icons for inventory items: potions, weapons, armor, quest items', status: 'todo', priority: 'med', checklist: [] }
        ]
      },
      {
        id: 'r04',
        name: 'UI Designer',
        icon: '💻',
        color: '#818cf8',
        tasks: [
          { id: 't10', title: 'HUD Redesign', body: 'Health bar, stamina, and minimap need a visual overhaul', status: 'todo', priority: 'high', checklist: [] },
          { id: 't11', title: 'Inventory Screen', body: 'Grid-based inventory with drag-and-drop', status: 'todo', priority: 'high', checklist: [] },
          { id: 't12', title: 'Quest Log UI', body: 'Tabbed interface for active/completed quests', status: 'todo', priority: 'med', checklist: [] },
          { id: 't13', title: 'Settings Menu', body: 'Audio, graphics, controls, keybinds', status: 'todo', priority: 'low', checklist: [] }
        ]
      },
      {
        id: 'r05',
        name: '3D Modeller',
        icon: '🧊',
        color: '#34d399',
        tasks: [
          { id: 't14', title: 'Player Character Base Mesh', body: 'Low-poly base mesh for the main character. Needs to be rigged-ready.', status: 'todo', priority: 'high', checklist: [] },
          { id: 't15', title: 'Fox Bear Model', body: 'First boss enemy. Hulking fox-bear hybrid, menacing but stylized.', status: 'todo', priority: 'high', checklist: [] }
        ]
      },
      {
        id: 'r06',
        name: 'Visuals',
        icon: '🌟',
        color: '#e879f9',
        tasks: [
          { id: 't16', title: 'Slash VFX', body: 'Sword swing trail effects', status: 'todo', priority: 'med', checklist: [] },
          { id: 't17', title: 'Heal Particle', body: 'Green sparkle effect when potion is used', status: 'done', priority: 'low', checklist: [] },
          { id: 't18', title: 'Level Up Burst', body: 'Flashy level-up celebration VFX with screen shake', status: 'todo', priority: 'med', checklist: [] }
        ]
      },
      {
        id: 'r07',
        name: 'Code',
        icon: '⌨️',
        color: '#22d3ee',
        tasks: []
      }
    ],
    activity: [],
    chat: []
  };

  let _data = null;

  function load() {
    const raw = localStorage.getItem(KV_PREFIX + 'data');
    if (raw) {
      try {
        _data = JSON.parse(raw);
      } catch (e) {
        _data = JSON.parse(JSON.stringify(defaultData));
      }
    } else {
      _data = JSON.parse(JSON.stringify(defaultData));
    }
    return _data;
  }

  function save() {
    localStorage.setItem(KV_PREFIX + 'data', JSON.stringify(_data));
    syncToCloud();
  }

  async function syncToCloud() {
    try {
      const token = localStorage.getItem(KV_PREFIX + 'token');
      if (!token) return;
      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(_data)
      });
    } catch (e) {
      // Silently fail — offline-first
      console.warn('Cloud sync failed, data saved locally.');
    }
  }

  async function pullFromCloud() {
    try {
      const token = localStorage.getItem(KV_PREFIX + 'token');
      if (!token) return;
      const res = await fetch('/api/data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const cloudData = await res.json();
        if (cloudData && cloudData.roadmap) {
          _data = cloudData;
          localStorage.setItem(KV_PREFIX + 'data', JSON.stringify(_data));
        }
      }
    } catch (e) {
      console.warn('Cloud pull failed, using local data.');
    }
  }

  function get() {
    if (!_data) load();
    return _data;
  }

  function update(mutator) {
    mutator(_data);
    save();
  }

  // Activity logging
  function logActivity(action, detail) {
    const entry = {
      id: 'act_' + Date.now(),
      action,
      detail,
      user: localStorage.getItem(KV_PREFIX + 'username') || 'Unknown',
      timestamp: new Date().toISOString()
    };
    _data.activity.unshift(entry);
    if (_data.activity.length > 200) _data.activity = _data.activity.slice(0, 200);
    save();
  }

  return { load, save, get, update, logActivity, pullFromCloud, defaultData };
})();
