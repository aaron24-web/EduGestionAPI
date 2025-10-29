import { Router } from 'express';
// Importamos los controladores que acabamos de crear
import { registerUser, loginUser } from '../controllers/authController.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Registra un nuevo suscriptor (Asesor, Academia o Padre)
 *     description: Corresponde a RF-006. Crea una nueva cuenta de suscriptor. El usuario recibirá un email de confirmación.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, full_name, tenant_type]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico para la cuenta.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña (Supabase requiere 6+ caracteres).
 *               full_name:
 *                 type: string
 *                 description: Nombre completo del asesor, de la academia o del padre.
 *               tenant_type:
 *                 type: string
 *                 enum: [INDIVIDUAL_ADVISOR, ACADEMY, PARENT]
 *                 description: El tipo de cuenta a crear.
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente. Esperando verificación de email.
 *       400:
 *         description: Error de validación (ej. email ya existe, tipo de cuenta inválido).
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/register', registerUser);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Inicia sesión para cualquier tipo de usuario
 *     description: Corresponde a RF-007. Autentica a un usuario usando email y contraseña, y devuelve una sesión (incluyendo el token JWT).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso. Devuelve la sesión del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 session:
 *                   type: object
 *                   description: Objeto de sesión de Supabase, contiene el access_token (JWT).
 *                 user:
 *                   type: object
 *                   description: Objeto de usuario de Supabase.
 *       401:
 *         description: No autorizado (credenciales inválidas).
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/login', loginUser);

export default router;