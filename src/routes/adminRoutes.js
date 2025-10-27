import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js'; // Importamos el middleware de roles
import {
  getAllTenants,
  verifyTenant
} from '../controllers/adminController.js';

const router = Router();

// ¡CRÍTICO! Todas las rutas de admin deben estar protegidas
// por 'authMiddleware' Y 'roleMiddleware'
router.use(authMiddleware);
router.use(roleMiddleware(['SUPER_ADMIN'])); // Solo el SUPER_ADMIN puede acceder

/**
 * @openapi
 * /admin/tenants:
 *   get:
 *     summary: (Super Admin) Obtiene todos los tenants (suscriptores)
 *     description: RF-002. Lista todas las academias y asesores suscritos.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de tenants
 *       '403':
 *         description: Acceso denegado (no es SUPER_ADMIN)
 */
router.get('/tenants', getAllTenants);

/**
 * @openapi
 * /admin/tenants/{id}/verify:
 *   put:
 *     summary: (Super Admin) Aprueba o rechaza un tenant
 *     description: RF-003. Actualiza el 'verification_status' de un tenant.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del tenant a verificar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verification_status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *                 description: El nuevo estado de verificación.
 *     responses:
 *       '200':
 *         description: Tenant actualizado
 *       '400':
 *         description: Estado inválido
 *       '403':
 *         description: Acceso denegado
 *       '404':
 *         description: Tenant no encontrado
 */
router.put('/tenants/:id/verify', verifyTenant);

export default router;