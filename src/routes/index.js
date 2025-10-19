import { Router } from 'express';
import authRoutes from './authRoutes.js';
import requestRoutes from './requestRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/requests', requestRoutes);
router.use('/admin', adminRoutes);

export default router;