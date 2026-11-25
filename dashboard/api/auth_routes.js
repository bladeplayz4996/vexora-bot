import { Router } from 'express';
import crypto from 'node:crypto';

const router = Router();

// In-memory session store for local/dev clarity (swap for Redis/Mongo session store in production)
const sessions = new Map(); // sessionId -> { user, accessToken, guilds, expiresAt }
const oauthStates = new Map(); // state -> createdAt

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_REDIRECT_URI =
  process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

const MANAGE_GUILD_BIT = 0x20n;
const ADMINISTRATOR_BIT = 0x8n;

function hasAdminOrManageGuild(permissionsString) {
  try {
    const perms = BigInt(permissionsString || '0');
    return (perms & ADMINISTRATOR_BIT) === ADMINISTRATOR_BIT || (perms & MANAGE_GUILD_BIT) === MANAGE_GUILD_BIT;
  } catch {
    return false;
  }
}

export function attachSession(req, _res, next) {
  const token =
    req.cookies?.vexora_session ||
    req.headers['x-session-token'] ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

  if (token && sessions.has(token)) {
    const sess = sessions.get(token);
    if (sess.expiresAt > Date.now()) {
      req.session = sess;
      req.sessionId = token;
    } else {
      sessions.delete(token);
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ ok: false, error: 'Unauthorized: Discord login required.' });
  }
  next();
}

export function requireGuildAccess(req, res, next) {
  const guildId = req.params.guildId || req.body?.guildId;
  if (!guildId) {
    return res.status(400).json({ ok: false, error: 'Missing guildId.' });
  }

  // Allow local/dev bypass when explicitly enabled
  if (process.env.ALLOW_DEV_GUILD_BYPASS === 'true' && !req.session) {
    req.authorizedGuildId = guildId;
    return next();
  }

  const manageable = req.session?.manageableGuilds || [];
  const allowed = manageable.some((g) => g.id === guildId);
  if (!allowed) {
    return res.status(403).json({
      ok: false,
      error: 'Forbidden: You need Manage Server or Administrator permissions on this guild.',
    });
  }

  req.authorizedGuildId = guildId;
  next();
}

// GET /api/auth/login -> Returns Discord OAuth2 authorization URL
router.get('/login', (req, res) => {
  if (!DISCORD_CLIENT_ID) {
    return res.status(500).json({ ok: false, error: 'DISCORD_CLIENT_ID is not configured.' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  oauthStates.set(state, Date.now());

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    response_type: 'code',
    redirect_uri: DISCORD_REDIRECT_URI,
    scope: 'identify guilds',
    state,
  });

  const authUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
  if (req.query.redirect === 'true') {
    return res.redirect(authUrl);
  }
  return res.json({ ok: true, authUrl, state });
});

// GET /api/auth/callback -> Exchanges code for token, fetches user & guilds, sets session
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || !oauthStates.has(state)) {
    return res.status(400).json({ ok: false, error: 'Invalid or expired OAuth state parameter.' });
  }
  oauthStates.delete(state);

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: DISCORD_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    return res.status(502).json({ ok: false, error: 'Failed to exchange OAuth2 code with Discord.' });
  }

  const tokenData = await tokenRes.json();
  const authHeader = { Authorization: `${tokenData.token_type} ${tokenData.access_token}` };

  const [userRes, guildsRes] = await Promise.all([
    fetch('https://discord.com/api/users/@me', { headers: authHeader }),
    fetch('https://discord.com/api/users/@me/guilds', { headers: authHeader }),
  ]);

  if (!userRes.ok || !guildsRes.ok) {
    return res.status(502).json({ ok: false, error: 'Failed to fetch Discord user profile or guilds.' });
  }

  const user = await userRes.json();
  const rawGuilds = await guildsRes.json();

  const botClient = req.app.get('discordClient');
  const manageableGuilds = (Array.isArray(rawGuilds) ? rawGuilds : [])
    .filter((g) => g.owner || hasAdminOrManageGuild(g.permissions))
    .map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon
        ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${g.icon.startsWith('a_') ? 'gif' : 'png'}`
        : null,
      owner: Boolean(g.owner),
      botInGuild: Boolean(botClient?.guilds?.cache?.has(g.id)),
    }));

  const sessionId = crypto.randomBytes(24).toString('hex');
  sessions.set(sessionId, {
    user: {
      id: user.id,
      username: user.username,
      globalName: user.global_name || user.username,
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : null,
    },
    accessToken: tokenData.access_token,
    manageableGuilds,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie('vexora_session', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const frontendUrl = process.env.DASHBOARD_FRONTEND_URL || '/';
  return res.redirect(`${frontendUrl}?session=${sessionId}`);
});

// GET /api/auth/me -> Current authenticated user & manageable servers
router.get('/me', (req, res) => {
  if (!req.session?.user) {
    return res.json({ ok: true, authenticated: false, user: null, guilds: [] });
  }
  return res.json({
    ok: true,
    authenticated: true,
    user: req.session.user,
    guilds: req.session.manageableGuilds,
  });
});

// POST /api/auth/logout -> Destroys active session
router.post('/logout', (req, res) => {
  if (req.sessionId) {
    sessions.delete(req.sessionId);
  }
  res.clearCookie('vexora_session');
  return res.json({ ok: true, message: 'Logged out.' });
});

export default router;
