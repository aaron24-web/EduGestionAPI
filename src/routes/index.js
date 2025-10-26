import { Router } from 'express';
import authRoutes from './authRoutes.js';
import requestRoutes from './requestRoutes.js';
import adminRoutes from './adminRoutes.js';
import enrollmentRoutes from './enrollmentRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import classRoutes from './classRoutes.js';
import progressReportRoutes from './progressReportRoutes.js'; // <-- 1. IMPORTAR

const router = Router();

router.use('/auth', authRoutes);
router.use('/requests', requestRoutes);
router.use('/admin', adminRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/classes', classRoutes);
router.use('/progress-reports', progressReportRoutes); // <-- 2. AÑADIR ESTA LÍNEA

export default router;