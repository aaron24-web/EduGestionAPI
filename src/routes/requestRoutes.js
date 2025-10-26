import { Router } from 'express';
import { 
  getTenantRequests,
  createRequest,
  getRequestById,
  assignAdvisor // <-- AÑADIR ESTA IMPORTACIÓN
} from '../controllers/requestController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /requests:
 *   post:
 *     summary: Crea una nueva solicitud de asesoría (Formulario Público)
 *     description: RF-019. Endpoint público para que un cliente cree una solicitud, un estudiante y un cliente/usuario (si no existe).
 *     tags: [Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenant_id, client_name, client_email, student_name, student_school_grade_id]
 *             properties:
 *               tenant_id:
 *                 type: integer
 *               client_name:
 *                 type: string
 *               client_email:
 *                 type: string
 *               student_name:
 *                 type: string
 *               student_school_grade_id:
 *                 type: integer
 *               student_needs_description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Solicitud creada exitosamente.
 *       400:
 *         description: Datos inválidos.
 *       500:
 *         description: Error del servidor.
 */
router.post('/', createRequest); // <-- Endpoint PÚBLICO (sin authMiddleware)

/**
 * @openapi
 * /requests:
 *   get:
 *     summary: Obtiene la lista de solicitudes del tenant
 *     description: RF-021. Endpoint protegido. Devuelve todas las 'tutoring_requests' asociadas al tenant del usuario autenticado (Asesor o Admin).
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes.
 *       401:
 *         description: No autorizado (token inválido o ausente).
 *       500:
 *         description: Error del servidor.
 */
router.get('/', authMiddleware, getTenantRequests); // <-- Endpoint PROTEGIDO (como ya lo tenías)

/**
 * @openapi
 * /requests/{id}:
 *   get:
 *     summary: Obtiene el detalle de una solicitud específica
 *     description: RF-021. Endpoint protegido. Devuelve los detalles de una 'tutoring_request' por su ID.
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID de la solicitud.
 *     responses:
 *       200:
 *         description: Detalles de la solicitud.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Solicitud no encontrada o no pertenece al tenant.
 *       500:
 *         description: Error del servidor.
 */
router.get('/:id', authMiddleware, getRequestById); // <-- Endpoint PROTEGIDO (el que te te faltaba)

/**
 * @openapi
 * /requests/{id}/assign:
 *   put:
 *     summary: Asigna un asesor a una solicitud
 *     description: RF-022. Endpoint protegido (Admin). Asigna un 'advisor_id' a una 'tutoring_request'.
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID de la solicitud (tutoring_request).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [advisor_id]
 *             properties:
 *               advisor_id:
 *                 type: integer
 *                 description: El ID del asesor a asignar.
 *     responses:
 *       200:
 *         description: Asesor asignado exitosamente.
 *       400:
 *         description: Faltan datos (ej. advisor_id).
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Solicitud no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.put('/:id/assign', authMiddleware, assignAdvisor); // <-- AÑADIR ESTA RUTA

export default router;