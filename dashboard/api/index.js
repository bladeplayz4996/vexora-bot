import { Router } from 'express';
import authRoutes from './auth_routes.js';
import guildRoutes from './guild_routes.js';
import economyRoutes from './economy_routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/guilds', guildRoutes);
router.use('/economy', economyRoutes);

export default router;
