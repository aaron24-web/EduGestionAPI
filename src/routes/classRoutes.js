import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js'; // Importamos el middleware de roles
import {
  scheduleClass,
  getStudentCalendar,
  // (Añadiremos más funciones aquí después)
} from '../controllers/classController.js';

const router = Router();

// Todas las rutas de clases están protegidas
router.use(authMiddleware);

/**
 * @openapi
 * /classes:
 *   post:
 *     summary: Agenda una nueva clase
 *     description: RF-028. Agenda una nueva sesión vinculada a un plan_subject_id.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan_subject_id:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '201':
 *         description: Clase agendada exitosamente
 *       '400':
 *         description: Error de validación (ej. plan no activo, horas insuficientes)
 *       '403':
 *         description: Usuario no autorizado
 */
// Solo el Cliente o un Asesor/Admin pueden agendar
router.post(
  '/',
  roleMiddleware(['CLIENT', 'ADVISOR', 'ACADEMY_ADMIN']), 
  scheduleClass
);

/**
 * @openapi
 * /classes/student/{id}:
 *   get:
 *     summary: Obtiene el calendario de un estudiante
 *     description: Devuelve todas las clases (SCHEDULED, COMPLETED) para un estudiante específico.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del estudiante (students.id)
 *     responses:
 *       '200':
 *         description: Lista de clases del estudiante
 *       '403':
 *         description: Usuario no autorizado (no es el cliente dueño o un asesor del tenant)
 *       '404':
 *         description: Estudiante no encontrado
 */
// Todos los roles logueados pueden ver calendarios (RLS debería filtrar)
router.get(
  '/student/:id',
  getStudentCalendar 
);

export default router;