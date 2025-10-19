import { Router } from 'express';
import { getTenantRequests } from '../controllers/requestController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
// Importar middleware de rol (¡lo necesitarás!)
// import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = Router();

/**
 * @openapi
 * /requests:
 *   get:
 *     summary: Obtiene la lista de solicitudes de asesoría para el tenant
 *     description: Devuelve todas las 'tutoring_requests' [cite: 168] asociadas al tenant del usuario autenticado (Asesor o Admin). Protegido por RLS.
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
// Aplicamos el middleware de autenticación
router.get(
    '/', 
    authMiddleware, 
    // Aquí podrías añadir un middleware de rol: 
    // roleMiddleware(['ACADEMY_ADMIN', 'ADVISOR']),
    getTenantRequests
);

// Aquí añadirías más rutas: POST /, GET /:id, POST /:id/assign (RF-022), etc.

export default router;