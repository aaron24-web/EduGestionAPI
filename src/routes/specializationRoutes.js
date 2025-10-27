import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import {
  getTenantSpecializations,
  createSpecialization
} from '../controllers/specializationController.js';

const router = Router();

// Proteger todas las rutas de este módulo
router.use(authMiddleware);
// Solo Admins de Academia o Asesores pueden gestionar especializaciones
router.use(roleMiddleware(['ACADEMY_ADMIN', 'ADVISOR']));

/**
 * @openapi
 * /specializations:
 *   get:
 *     summary: (Admin/Asesor) Obtiene las especializaciones del tenant
 *     description: A.1. Devuelve todas las materias/especializaciones que el tenant ofrece.
 *     tags: [Management (A)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de especializaciones
 */
router.get('/', getTenantSpecializations);

/**
 * @openapi
 * /specializations:
 *   post:
 *     summary: (Admin/Asesor) Crea una nueva especialización
 *     description: A.1. Añade una nueva materia/especialización a la oferta del tenant.
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
 *               subject:
 *                 type: string
 *                 example: "Cálculo Diferencial"
 *               level_id:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       '201':
 *         description: Especialización creada
 */
router.post('/', createSpecialization);

export default router;