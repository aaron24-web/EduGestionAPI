import { Router } from 'express';
import {
  createEnrollment,
  addSubjectsToEnrollment,
  getEnrollmentById,
  submitForApproval, // <-- Asegúrate de que estén todas importadas
  approveEnrollment,
  requestChanges
} from '../controllers/enrollmentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js'; // <-- 1. IMPORTAR EL NUEVO MIDDLEWARE

const router = Router();

// Todas las rutas aquí están protegidas por (al menos) authMiddleware
router.use(authMiddleware);

// --- Rutas que ya tenías ---
router.post('/', createEnrollment); // (Deberíamos proteger esta ruta también)
router.post('/:id/subjects', addSubjectsToEnrollment); // (Y esta)
router.get('/:id', getEnrollmentById); // (GET está bien para todos los roles logueados)

// --- 2. APLICAR EL MIDDLEWARE DE ROLES A LAS RUTAS EXISTENTES ---

// Asesor/Admin envía el plan para aprobación
/**
 * @openapi
 * /enrollments/{id}/submit-for-approval:
 *   put:
 *     summary: Asesor envía el plan para aprobación del cliente
 *     description: RF-026. Cambia el estado del enrollment de PLANNING a PENDING_APPROVAL. Solo Asesores/Admins asignados.
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del enrollment a enviar
 *     responses:
 *       '200':
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
 *       '400':
 *         description: Estado inválido o no hay plan_subjects
 *       '403':
 *         description: Usuario no autorizado (no es asesor/admin asignado)
 *       '404':
 *         description: Enrollment no encontrado
 *       '500':
 *         description: Error del servidor
 */
router.put(
  '/:id/submit-for-approval', 
  roleMiddleware(['ADVISOR', 'ACADEMY_ADMIN']), 
  submitForApproval
);

// Cliente aprueba el plan
/**
 * @openapi
 * /enrollments/{id}/approve:
 *   put:
 *     summary: Cliente aprueba el plan de enseñanza
 *     description: RF-025. Cambia el estado del enrollment de PENDING_APPROVAL a ACTIVE. Solo el Cliente dueño.
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del enrollment a aprobar
 *     responses:
 *       '200':
 *         description: Plan aprobado y activado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Plan aprobado exitosamente.
 *                 enrollment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: ACTIVE
 *       '400':
 *         description: Estado inválido (no estaba PENDING_APPROVAL)
 *       '403':
 *         description: Usuario no autorizado (no es el CLIENTE dueño)
 *       '404':
 *         description: Enrollment no encontrado
 *       '500':
 *         description: Error del servidor
 */
router.put(
  '/:id/approve', 
  roleMiddleware(['CLIENT', 'PARENT']), 
  approveEnrollment
);

// Cliente solicita cambios
/**
 * @openapi
 * /enrollments/{id}/request-changes:
 *   post:
 *     summary: Cliente solicita cambios en el plan
 *     description: RF-024. Cambia el estado del enrollment de PENDING_APPROVAL de vuelta a PLANNING. Solo el Cliente dueño.
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del enrollment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *                 description: Comentarios o cambios solicitados por el cliente.
 *                 example: { "comments": "Por favor, añadir 2 horas más de Física." }
 *     responses:
 *       '200':
 *         description: Cambios solicitados. Plan devuelto a PLANNING.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cambios solicitados. El plan ha sido devuelto a PLANNING.
 *                 enrollment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: PLANNING
 *       '400':
 *         description: Estado inválido (no estaba PENDING_APPROVAL)
 *       '403':
 *         description: Usuario no autorizado (no es el CLIENTE dueño)
 *       '404':
 *         description: Enrollment no encontrado
 *       '500':
 *         description: Error del servidor
 */
router.post(
  '/:id/request-changes', 
  roleMiddleware(['CLIENT', 'PARENT']), 
  requestChanges
);

export default router;
