import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { createReview } from '../controllers/reviewController.js';

const router = Router();

// Proteger todas las rutas de este módulo
router.use(authMiddleware);

/**
 * @openapi
 * /reviews:
 *   post:
 *     summary: (Cliente) Crea una reseña para un enrollment
 *     description: B. Permite a un cliente dejar una reseña (1-5) para un plan completado.
 *     tags: [Reviews (B)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enrollment_id:
 *                 type: integer
 *                 example: 1
 *               rating:
 *                 type: integer
 *                 example: 5
 *               public_comment:
 *                 type: string
 *                 example: "¡Excelente servicio!"
 *               private_feedback:
 *                 type: string
 *                 example: "El asesor fue genial, pero la plataforma..."
 *     responses:
 *       '201':
 *         description: Reseña creada
 *       '400':
 *         description: Faltan campos o rating inválido
 *       '403':
 *         description: No es el cliente dueño de ese enrollment
 *       '409':
 *         description: Ya existe una reseña para ese enrollment
 */
// Solo los Clientes pueden dejar reseñas
router.post('/', roleMiddleware(['CLIENT', 'PARENT']), createReview);

export default router;