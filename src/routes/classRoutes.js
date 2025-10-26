/**
 * @openapi
 * /classes:
 *   post:
 *     summary: Agenda una nueva clase para un plan activo
 *     description: RF-027. Protegido para Asesores/Admins. Valida que el plan esté activo y no se exceda el número de clases.
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan_subject_id
 *               - student_id
 *               - start_time
 *               - end_time
 *               - title
 *             properties:
 *               plan_subject_id:
 *                 type: integer
 *                 description: ID de la materia dentro del plan (tabla 'plan_subjects').
 *               student_id:
 *                 type: integer
 *                 description: ID del estudiante al que se le agenda la clase.
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de inicio de la clase (formato ISO 8601).
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de finalización de la clase (formato ISO 8601).
 *               title:
 *                 type: string
 *                 description: Título o tema principal de la clase.
 *               notes:
 *                 type: string
 *                 description: (Opcional) Descripción o notas adicionales.
 *     responses:
 *       '201':
 *         description: Clase agendada exitosamente.
 *       '400':
 *         description: Datos inválidos o violación de reglas de negocio (ej. plan no activo).
 *       '403':
 *         description: No autorizado (el usuario no es un asesor o no pertenece al tenant).
 *       '404':
 *         description: Recurso no encontrado (ej. plan_subject_id no existe).
 *       '500':
 *         description: Error del servidor.
 */
