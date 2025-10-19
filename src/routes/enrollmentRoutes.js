import { Router } from 'express';
import {
  createEnrollment,
  addSubjectsToEnrollment,
  getEnrollmentById
} from '../controllers/enrollmentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas aquí están protegidas
router.use(authMiddleware);

/**
 * @openapi
 * /enrollments:
 *   post:
 *     summary: Crea un nuevo plan (Enrollment)
 *     description: RF-023. Crea el "contenedor" del plan, vinculado a una 'tutoring_request_id'.
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tutoring_request_id]
 *             properties:
 *               tutoring_request_id:
 *                 type: integer
 *                 description: El ID de la solicitud (ej. PENDING_REVIEW).
 *     responses:
 *       201:
 *         description: Enrollment creado exitosamente.
 *       400:
 *         description: Faltan datos o estado de solicitud incorrecto.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Solicitud no encontrada.
 */
router.post('/', createEnrollment);

/**
 * @openapi
 * /enrollments/{id}/subjects:
 *   post:
 *     summary: Añade materias a un plan (Enrollment)
 *     description: RF-023. Añade uno o más 'plan_subjects' a un enrollment existente.
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del Enrollment.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subjects:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     specialization_id:
 *                       type: integer
 *                     advisor_id:
 *                       type: integer
 *                     diagnosis:
 *                       type: string
 *                     goals:
 *                       type: string
 *                     methodology:
 *                       type: string
 *     responses:
 *       201:
 *         description: Materias añadidas exitosamente.
 *       400:
 *         description: El body debe ser un array de 'subjects'.
 *       401:
 *         description: No autorizado.
 */
router.post('/:id/subjects', addSubjectsToEnrollment);

/**
 * @openapi
 * /enrollments/{id}:
 *   get:
 *     summary: Obtiene un plan (Enrollment) y sus materias
 *     description: Permite ver los detalles de un plan, incluyendo las materias y asesores asignados.
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del Enrollment.
 *     responses:
 *       200:
 *         description: Detalles del Enrollment.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Enrollment no encontrado.
 */
router.get('/:id', getEnrollmentById);

export default router;