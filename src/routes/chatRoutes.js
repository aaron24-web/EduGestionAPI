import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
// No necesitamos roleMiddleware aquí, la lógica de permisos está en el controlador
import {
  getConversations,
  getMessages,
  sendMessage
} from '../controllers/chatController.js';

const router = Router();

// Proteger todas las rutas de chat
router.use(authMiddleware);

/**
 * @openapi
 * /chat/conversations:
 *   get:
 *     summary: Obtiene las conversaciones del usuario
 *     description: C.1. Lista las conversaciones activas para el usuario autenticado (Cliente o Asesor/Admin).
 *     tags: [Chat (C)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de conversaciones
 */
router.get('/conversations', getConversations);

/**
 * @openapi
 * /chat/conversations/{id}/messages:
 *   get:
 *     summary: Obtiene los mensajes de una conversación
 *     description: C.2. Devuelve todos los mensajes de una conversación específica.
 *     tags: [Chat (C)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la conversación
 *     responses:
 *       '200':
 *         description: Lista de mensajes
 *       '403':
 *         description: No pertenece a la conversación
 *       '404':
 *         description: Conversación no encontrada
 */
router.get('/conversations/:id/messages', getMessages);

/**
 * @openapi
 * /chat/conversations/{id}/messages:
 *   post:
 *     summary: Envía un mensaje a una conversación
 *     description: C.3. Permite al usuario enviar un nuevo mensaje a una conversación de la que es participante.
 *     tags: [Chat (C)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la conversación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Hola, ¿podemos reagendar la clase del martes?"
 *     responses:
 *       '201':
 *         description: Mensaje enviado
 *       '400':
 *         description: Falta contenido
 *       '403':
 *         description: No pertenece a la conversación
 *       '404':
 *         description: Conversación no encontrada
 */
router.post('/conversations/:id/messages', sendMessage);

export default router;