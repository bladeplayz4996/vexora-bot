# Vexora Bot & Dashboard

**Vexora** is a modular Discord utility, security, moderation, engagement, and economy bot paired with a web & app-activity dashboard—inspired by modern multi-system Discord bots.

## Core Pillars
- **In-App Commands:** Slash (`/`) and prefix commands covering moderation, economy, shop & role pickers, leveling, mini-games, fun/color tools, and server utilities.
- **Web & App-Activity Dashboard:** 9-module management interface (General, Messaging, Commands, Server Engagement, Roles, Moderation, Social Feeds, Utilities, and Economy Engine) with live embed preview, variable chips, and save/discard controls.
- **Global Add-Ons:** Shared variable parser (`{user.mention}`, `{wallet}`, `{case.id}`, etc.), embed renderer (up to 4000-char descriptions, fields, author/footer media, and multi-embed payloads), permission/hierarchy guard, cooldown manager, and unified error/audit logger.

## Project Layout
- `bot/` — Discord client entry point, `global_addons/`, thin `commands/` handlers, and event/business logic in `features/`.
- `dashboard/` — OAuth & guild/economy `api/` routes plus modular `interface/` layout, shared builders, and 9 feature pages.
- `data/` — Consistent `schemas/`, `templates/`, and `assets/`.

## Quick Start
1. Copy `.env.example` to `.env` and fill in your Discord bot token, client credentials, and MongoDB URI.
2. Install dependencies:
   ```bash
   npm install
   
