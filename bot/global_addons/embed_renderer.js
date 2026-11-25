import { EmbedBuilder } from 'discord.js';
import { parseVariables } from './variable_parser.js';

const DEFAULT_COLOR = 0x5865f2;
const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_FIELDS = 25;

function resolveHexColor(colorInput) {
  if (typeof colorInput === 'number') return colorInput;
  if (typeof colorInput === 'string' && colorInput.trim()) {
    const clean = colorInput.trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(clean)) {
      return parseInt(clean, 16);
    }
  }
  return DEFAULT_COLOR;
}

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  return /^https?:\/\/.+/i.test(trimmed) ? trimmed : undefined;
}

/**
 * Builds a single Discord EmbedBuilder from Vexora's dashboard embed schema.
 */
export function buildSingleEmbed(embedData = {}, ctx = {}) {
  const embed = new EmbedBuilder();
  embed.setColor(resolveHexColor(embedData.color));

  // Author block
  if (embedData.author?.name) {
    const authorName = parseVariables(embedData.author.name, ctx).slice(0, 256);
    const authorIcon = sanitizeUrl(parseVariables(embedData.author.iconUrl, ctx));
    const authorUrl = sanitizeUrl(parseVariables(embedData.author.url, ctx));
    if (authorName) {
      embed.setAuthor({
        name: authorName,
        ...(authorIcon ? { iconURL: authorIcon } : {}),
        ...(authorUrl ? { url: authorUrl } : {}),
      });
    }
  }

  // Title & Title URL
  if (embedData.title) {
    const title = parseVariables(embedData.title, ctx).slice(0, 256);
    if (title) embed.setTitle(title);
  }
  const titleUrl = sanitizeUrl(parseVariables(embedData.titleUrl || embedData.url, ctx));
  if (titleUrl) embed.setURL(titleUrl);

  // Description (up to 4000 characters)
  if (embedData.description) {
    const description = parseVariables(embedData.description, ctx).slice(0, MAX_DESCRIPTION_LENGTH);
    if (description) embed.setDescription(description);
  }

  // Repeatable Fields List
  if (Array.isArray(embedData.fields) && embedData.fields.length > 0) {
    const cleanFields = embedData.fields
      .slice(0, MAX_FIELDS)
      .filter((f) => f?.name && f?.value)
      .map((f) => ({
        name: parseVariables(f.name, ctx).slice(0, 256) || '\u200B',
        value: parseVariables(f.value, ctx).slice(0, 1024) || '\u200B',
        inline: Boolean(f.inline),
      }));

    if (cleanFields.length > 0) {
      embed.addFields(cleanFields);
    }
  }

  // Thumbnail & Main Image
  const thumbnailUrl = sanitizeUrl(parseVariables(embedData.thumbnailUrl || embedData.thumbnail, ctx));
  if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);

  const imageUrl = sanitizeUrl(parseVariables(embedData.imageUrl || embedData.image, ctx));
  if (imageUrl) embed.setImage(imageUrl);

  // Footer & Timestamp
  if (embedData.footer?.text) {
    const footerText = parseVariables(embedData.footer.text, ctx).slice(0, 2048);
    const footerIcon = sanitizeUrl(parseVariables(embedData.footer.iconUrl, ctx));
    if (footerText) {
      embed.setFooter({
        text: footerText,
        ...(footerIcon ? { iconURL: footerIcon } : {}),
      });
    }
  }

  if (embedData.timestamp) {
    embed.setTimestamp(embedData.timestamp === true ? new Date() : new Date(embedData.timestamp));
  }

  return embed;
}

/**
 * Renders either a plain message, a single embed, or multi-embed payload
 * compatible with both Discord sending and Dashboard Live Preview.
 */
export function renderMessagePayload(payload = {}, ctx = {}) {
  const mode = payload.mode || (payload.embeds?.length || payload.embed ? 'embed' : 'plain');
  const content = payload.content ? parseVariables(payload.content, ctx).slice(0, 2000) : undefined;

  if (mode === 'plain') {
    return {
      content: content || '\u200B',
      embeds: [],
    };
  }

  const rawEmbeds = Array.isArray(payload.embeds)
    ? payload.embeds
    : payload.embed
      ? [payload.embed]
      : [];

  const embeds = rawEmbeds.slice(0, 10).map((item) => buildSingleEmbed(item, ctx));

  return {
    ...(content ? { content } : {}),
    embeds,
  };
                                   }
