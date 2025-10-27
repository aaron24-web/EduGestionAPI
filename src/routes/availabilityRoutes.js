import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import {
  getWorkSchedule,
  setWorkSchedule
} from '../controllers/availabilityController.js';

const router = Router();

// Proteger todas las rutas de este módulo
router.use(authMiddleware);

/**
 * @openapi
 * /availability/advisor/{advisor_id}:
 *   get:
 *     summary: Obtiene el horario semanal de un asesor
 *     description: A.2. Devuelve la lista de bloques de disponibilidad de un asesor.
 *     tags: [Management (A)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: advisor_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del asesor (advisors.id)
 *     responses:
 *       '200':
 *         description: Lista de bloques de horario
 */
// Cualquier usuario logueado (ej. Cliente) puede ver el horario
router.get('/advisor/:advisor_id', getWorkSchedule);

/**
 * @openapi
 * /availability/schedule:
 *   post:
 *     summary: (Admin/Asesor) Define el horario semanal propio
 *     description: A.2. Reemplaza el horario de trabajo completo del asesor autenticado.
 *     tags: [Management (A)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day_of_week:
 *                       type: integer
 *                       example: 1
 *                     start_time:
 *                       type: string
 *                       example: "09:00:00"
 *                     end_time:
 *                       type: string
 *                       example: "12:00:00"
 *     responses:
 *       '201':
 *         description: Horario actualizado
 */
// Solo Admins de Academia o Asesores pueden definir su horario
router.post('/schedule', roleMiddleware(['ACADEMY_ADMIN', 'ADVISOR']), setWorkSchedule);

export default router;