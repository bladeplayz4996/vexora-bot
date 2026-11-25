import { EmbedBuilder } from 'discord.js';
import { parseVariables } from './variable_parser.js';

/**
 * Unified error & audit dispatch helper for Vexora.
 * Logs to console, optional webhook, and optional server log/case channel.
 */
export async function logError(client, source, error, guildId = null) {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const stack = error instanceof Error && error.stack ? error.stack.slice(0, 1800) : message;

  console.error(`[Vexora Error][${source}]${guildId ? `[Guild:${guildId}]` : ''} ${message}`);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }

  const webhookUrl = process.env.ERROR_WEBHOOK_URL;
  if (webhookUrl && /^https?:\/\/.+/i.test(webhookUrl)) {
    try {
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle(`Vexora Runtime Error — ${source}`)
        .setDescription(`\`\`\`\n${stack}\n\`\`\``)
        .addFields(
          ...(guildId ? [{ name: 'Guild ID', value: String(guildId), inline: true }] : []),
          { name: 'Environment', value: process.env.NODE_ENV || 'production', inline: true }
        )
        .setTimestamp();

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed.toJSON()] }),
      });
    } catch (webhookErr) {
      console.error('[Vexora ErrorLogger] Failed to send error webhook:', webhookErr.message);
    }
  }
}

export async function dispatchAuditLog(client, guild, logChannelId, payloadOrTemplate, ctx = {}) {
  if (!guild || !logChannelId) return null;

  const channel = guild.channels?.cache?.get(logChannelId) ||
    (await guild.channels?.fetch?.(logChannelId).catch(() => null));
  if (!channel || !channel.isTextBased?.()) return null;

  const resolvedCtx = { ...ctx, guild, client };

  if (typeof payloadOrTemplate === 'string') {
    return channel.send({ content: parseVariables(payloadOrTemplate, resolvedCtx) }).catch(() => null);
  }

  if (payloadOrTemplate && typeof payloadOrTemplate === 'object') {
    return channel.send(payloadOrTemplate).catch(() => null);
  }

  return null;
}
