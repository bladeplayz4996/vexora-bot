# Vexora

A modular Discord bot and web dashboard studio built with Node.js, Discord.js, Express, MongoDB/Mongoose, and React + Vite.

## **Project Structure**

- `bot/`: Core Discord bot runtime (`index.js`), shared helpers (`global_addons/`), slash and prefix handlers (`commands/`), and event/background engines (`features/`).
- `dashboard/`: REST API endpoints (`api/`) and React dashboard interface (`interface/`).
- `data/`: Database schemas (`schemas/`), default templates and presets (`templates/`), and static assets (`assets/`).
- `src/main.jsx`: React application entry point.
- `index.html`: HTML template for the Vite frontend.
- `server.js`: Express entry point running the API, database hydration, Discord bot client, and built frontend.
- `package.json`: Project dependencies and npm scripts.

## **Features**

- **Security & Moderation**: Anti-nuke protection, server backups and restores, join gates and anti-raid controls, heat-based automod, moderation cases, and audit logs.
- **Engagement & Progression**: XP leveling, leaderboards, temporary voice channels, starboard, and birthday notifications.
- **Roles & Messaging**: Auto, reaction, temporary, and persistent roles, factions, announcements, auto-responders, tickets, giveaways, and forms.
- **Economy & Shop**: Wallets, bank limits, work, crime, and rob commands, custom shop items, role pickers, balance adjustments, and logs.
- **Social Feeds & Utilities**: YouTube and Twitch watchers, fun and mini-game commands, and server/user utilities.
- **Web Dashboard**: Guild switcher, unsaved-change save/discard controls, embed builder with live preview, role picker settings, and data tables.

## **Setup & Run**

 ### Install dependencies:
   ```bash
   npm install
   npm run build
   npm start

