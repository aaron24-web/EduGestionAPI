import { Router } from 'express';
import {
  createEnrollment,
  addSubjectsToEnrollment,
  getEnrollmentById,
  approveEnrollment, 
  requestChanges, 
  submitForApproval
} from '../controllers/enrollmentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @swagger
 * /enrollments/{id}:
 *   get:
 *     summary: Obtiene el detalle completo de una inscripción (enrollment)
 *     description: RF-022. Devuelve un enrollment con todos sus plan_subjects, clases, pagos y datos del estudiante/cliente.
 *     tags:
 *       - Enrollments
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del enrollment
 *     responses:
 *       200:
 *         description: Detalle del enrollment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 status:
 *                   type: string
 *                   enum: [PLANNING, PENDING_APPROVAL, ACTIVE, COMPLETED, CANCELLED]
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                 tutoring_requests:
 *                   type: object
 *                   description: Datos de la solicitud original
 *                 plan_subjects:
 *                   type: array
 *                   description: Lista de materias en el plan
 *                   items:
 *                     type: object
 *                 payments:
 *                   type: array
 *                   description: Pagos asociados al enrollment
 *       404:
 *         description: Enrollment no encontrado o sin permisos
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', authMiddleware, getEnrollmentById);

/**
 * @swagger
 * /enrollments/{id}/submit-for-approval:
 *   put:
 *     summary: Asesor envía el plan de enseñanza para aprobación del cliente
 *     description: RF-026. Cambia el estado del enrollment de PLANNING a PENDING_APPROVAL. Solo puede ser ejecutado por un asesor asignado al enrollment.
 *     tags:
 *       - Enrollments
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del enrollment
 *     responses:
 *       200:
 *         description: Plan enviado para aprobación exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Plan enviado al cliente para aprobación exitosamente.
 *                 enrollment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: PENDING_APPROVAL
 *       400:
 *         description: Estado inválido o no hay plan_subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No se puede enviar para aprobación un enrollment sin plan_subjects.
 *       403:
 *         description: Usuario no autorizado (no es asesor asignado)
 *       404:
 *         description: Enrollment no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id/submit-for-approval', authMiddleware, submitForApproval);

/**
 * @swagger
 * /enrollments/{id}/approve:
 *   put:
 *     summary: Cliente aprueba el plan de enseñanza propuesto
 *     description: RF-025. Cambia el estado del enrollment de PENDING_APPROVAL a ACTIVE. Solo puede ser ejecutado por el cliente dueño del enrollment. Una vez aprobado, se pueden agendar clases.
 *     tags:
 *       - Enrollments
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del enrollment
 *     responses:
 *       200:
 *         description: Enrollment aprobado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Enrollment aprobado exitosamente. Ahora se pueden agendar clases.
 *                 enrollment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: ACTIVE
 *       400:
 *         description: Estado inválido (no está en PENDING_APPROVAL)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No se puede aprobar un enrollment en estado 'PLANNING'. Debe estar en 'PENDING_APPROVAL'.
 *       403:
 *         description: Usuario no autorizado (no es el cliente dueño)
 *       404:
 *         description: Enrollment no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id/approve', authMiddleware, approveEnrollment);

/**
 * @swagger
 * /enrollments/{id}/request-changes:
 *   post:
 *     summary: Cliente solicita cambios al plan de enseñanza
 *     description: RF-024. Cambia el estado del enrollment de PENDING_APPROVAL de vuelta a PLANNING. Solo puede ser ejecutado por el cliente dueño. El asesor podrá revisar y modificar el plan nuevamente.
 *     tags:
 *       - Enrollments
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del enrollment
 *     requestBody:
 *       description: Comentarios opcionales del cliente sobre los cambios solicitados
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *                 example: Por favor incluir más sesiones de práctica en Matemáticas.
 *     responses:
 *       200:
 *         description: Solicitud de cambios enviada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Solicitud de cambios enviada. El asesor revisará el plan nuevamente.
 *                 enrollment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: PLANNING
 *                 client_comments:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Estado inválido (no está en PENDING_APPROVAL)
 *       403:
 *         description: Usuario no autorizado (no es el cliente dueño)
 *       404:
 *         description: Enrollment no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/:id/request-changes', authMiddleware, requestChanges);

export default router;
