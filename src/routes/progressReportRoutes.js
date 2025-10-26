import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js'; // Importamos el middleware de roles
import { createProgressReport } from '../controllers/progressReportController.js';

const router = Router();

// Todas las rutas de reportes están protegidas
router.use(authMiddleware);

/**
 * @openapi
 * /progress-reports:
 *   post:
 *     summary: Crea un nuevo reporte de progreso para una clase
 *     description: RF-033. Permite a un Asesor/Admin crear un reporte después de una clase completada.
 *     tags: [Progress Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               class_id:
 *                 type: integer
 *               topics_covered:
 *                 type: string
 *               strengths:
 *                 type: string
 *               areas_for_improvement:
 *                 type: string
 *               homework_recommendations:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Reporte de progreso creado exitosamente
 *       '403':
 *         description: Usuario no autorizado (no es Asesor/Admin)
 *       '404':
 *         description: Clase no encontrada
 */
// Solo Asesores o Admins pueden crear reportes
router.post(
  '/',
  roleMiddleware(['ADVISOR', 'ACADEMY_ADMIN']), 
  createProgressReport
);

export default router;