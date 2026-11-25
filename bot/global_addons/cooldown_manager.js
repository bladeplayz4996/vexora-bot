/**
 * Shared cooldown & rate-limit tracker scoped by (guildId:userId:key).
 * Returns remaining seconds when active, or sets a fresh expiry window.
 */
const cooldownStore = new Map();

function buildKey(guildId, userId, actionKey) {
  return `${guildId || 'dm'}:${userId || 'global'}:${actionKey}`;
}

export function checkCooldown(guildId, userId, actionKey, seconds = 3) {
  const durationMs = Math.max(0, Number(seconds) || 0) * 1000;
  if (durationMs === 0) {
    return { onCooldown: false, remaining: 0, expiresAt: 0 };
  }

  const key = buildKey(guildId, userId, actionKey);
  const now = Date.now();
  const existingExpiry = cooldownStore.get(key) || 0;

  if (existingExpiry > now) {
    const remainingMs = existingExpiry - now;
    return {
      onCooldown: true,
      remaining: Math.max(0.1, Number((remainingMs / 1000).toFixed(1))),
      expiresAt: existingExpiry,
    };
  }

  const expiresAt = now + durationMs;
  cooldownStore.set(key, expiresAt);
  return { onCooldown: false, remaining: 0, expiresAt };
}

export function clearCooldown(guildId, userId, actionKey) {
  cooldownStore.delete(buildKey(guildId, userId, actionKey));
}

// Periodic cleanup so expired keys don't accumulate in memory
setInterval(() => {
  const now = Date.now();
  for (const [key, expiresAt] of cooldownStore.entries()) {
    if (expiresAt <= now) {
      cooldownStore.delete(key);
    }
  }
}, 60_000).unref();
