import { Router } from 'express';
import { registerPayment } from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /payments:
 *   post:
 *     summary: Registra el pago de un cliente para activar un plan de inscripción.
 *     description: Corresponde a RF-035. Registra un pago en la tabla 'payments' y actualiza el estado de la inscripción a 'ACTIVE'.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enrollment_id, amount, payment_method]
 *             properties:
 *               enrollment_id:
 *                 type: integer
 *                 description: ID de la inscripción a la que se asocia el pago.
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: Monto del pago.
 *               payment_method:
 *                 type: string
 *                 description: Método de pago (ej. 'Credit Card', 'Transferencia Bancaria').
 *     responses:
 *       201:
 *         description: Pago registrado exitosamente y plan activado.
 *       400:
 *         description: Error de validación o inscripción no encontrada.
 *       401:
 *         description: No autorizado (token inválido o no proporcionado).
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/', authMiddleware, registerPayment);

export default router;
