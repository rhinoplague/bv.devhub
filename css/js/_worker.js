/* ============================================
   Cloudflare Workers Backend
   ============================================

   Deploy to Cloudflare Pages with Functions
   or as a standalone Worker with KV binding.

   KV Namespace binding: HXG_KV
   ============================================ */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Default accounts
const DEFAULT_ACCOUNTS = {
  admin: { password: 'admin123', role: 'admin' },
  dev: { password: 'dev123', role: 'dev' },
  guest: { password: 'guest', role: 'guest' },
};

function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

async function getAccounts(env) {
  try {
    const raw = await env.HXG_KV.get('accounts');
    return raw ? JSON.parse(raw) : { ...DEFAULT_ACCOUNTS };
  } catch {
    return { ...DEFAULT_ACCOUNTS };
  }
}

async function saveAccounts(env, accounts) {
  await env.HXG_KV.put('accounts', JSON.stringify(accounts));
}

async function validateToken(env, token) {
  if (!token) return null;
  try {
    const raw = await env.HXG_KV.get(`session:${token}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // ── Auth endpoint ──
    if (path === '/api/auth' && request.method === 'POST') {
      try {
        const { username, password } = await request.json();
        const accounts = await getAccounts(env);
        const account = accounts[username?.toLowerCase()];

        if (!account || account.password !== password) {
          return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        const token = generateToken();
        const session = {
          username: username.toLowerCase(),
          role: account.role,
          created: Date.now(),
        };

        await env.HXG_KV.put(`session:${token}`, JSON.stringify(session), {
          expirationTtl: 86400 * 7, // 7 days
        });

        return jsonResponse({ token, role: account.role });
      } catch (e) {
        return jsonResponse({ error: 'Auth failed' }, 500);
      }
    }

    // ── Get data ──
    if (path === '/api/data' && request.method === 'GET') {
      const session = await authenticateRequest(request, env);
      if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

      try {
        const raw = await env.HXG_KV.get('hub_data');
        if (raw) {
          return jsonResponse(JSON.parse(raw));
        }
        return jsonResponse({});
      } catch {
        return jsonResponse({});
      }
    }

    // ── Sync data ──
    if (path === '/api/sync' && request.method === 'POST') {
      const session = await authenticateRequest(request, env);
      if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

      if (session.role === 'guest') {
        return jsonResponse({ error: 'Guests cannot sync' }, 403);
      }

      try {
        const data = await request.json();
        await env.HXG_KV.put('hub_data', JSON.stringify(data));
        return jsonResponse({ success: true });
      } catch (e) {
        return jsonResponse({ error: 'Sync failed' }, 500);
      }
    }

    // ── Change password ──
    if (path === '/api/password' && request.method === 'POST') {
      const session = await authenticateRequest(request, env);
      if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

      try {
        const { currentPassword, newPassword } = await request.json();
        const accounts = await getAccounts(env);
        const account = accounts[session.username];

        if (!account || account.password !== currentPassword) {
          return jsonResponse({ error: 'Incorrect current password' }, 400);
        }

        account.password = newPassword;
        await saveAccounts(env, accounts);
        return jsonResponse({ success: true });
      } catch (e) {
        return jsonResponse({ error: 'Password change failed' }, 500);
      }
    }

    // ── AI Draft (proxy to OpenAI or local) ──
    if (path === '/api/ai/draft' && request.method === 'POST') {
      const session = await authenticateRequest(request, env);
      if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);
      if (session.role === 'guest') return jsonResponse({ error: 'Guests cannot use AI' }, 403);

      try {
        const { mode, notes } = await request.json();

        // If you have an OpenAI key in env
        if (env.OPENAI_API_KEY) {
          const prompt = mode === 'roadmap'
            ? `You are a game development project manager. Based on these notes, generate a structured roadmap item with a title, description, phase suggestion, priority tag, and 3-5 subtasks. Notes: "${notes}"`
            : `You are a game development project manager. Based on these notes, generate a structured team task with a title, description, priority, role assignment, and a checklist of 2-4 items. Notes: "${notes}"`;

          const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 500,
              temperature: 0.7,
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const draft = aiData.choices?.[0]?.message?.content || 'No response generated';
            return jsonResponse({ draft });
          }
        }

        // Fallback
        return jsonResponse({ error: 'AI not configured' }, 501);
      } catch (e) {
        return jsonResponse({ error: 'AI generation failed' }, 500);
      }
    }

    // ── Serve static files (Cloudflare Pages handles this) ──
    // If running as standalone worker, add asset serving here

    return new Response('Not Found', { status: 404 });
  },
};

async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  return await validateToken(env, token);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}
