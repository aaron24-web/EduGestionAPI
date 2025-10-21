/**
 * @openapi
 * /progress-reports:
 *   post:
 *     summary: Crea un nuevo reporte de progreso para una clase
 *     description: RF-033. Protegido para Asesores. El asesor que imparte la clase puede crear un reporte de seguimiento. Solo se permite un reporte por clase.
 *     tags:
 *       - Progress Reports
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - strengths
 *               - areas_for_improvement
 *               - next_steps
 *             properties:
 *               class_id:
 *                 type: integer
 *                 description: ID de la clase a la que pertenece el reporte.
 *               strengths:
 *                 type: string
 *                 description: Fortalezas y logros observados durante la clase.
 *               areas_for_improvement:
 *                 type: string
 *                 description: Áreas que necesitan más trabajo o atención.
 *               next_steps:
 *                 type: string
 *                 description: Pasos o temas recomendados para la siguiente sesión.
 *               general_comments:
 *                 type: string
 *                 description: (Opcional) Comentarios generales adicionales.
 *     responses:
 *       '201':
 *         description: Reporte de progreso creado exitosamente.
 *       '400':
 *         description: Faltan datos requeridos.
 *       '403':
 *         description: No autorizado (el usuario no es el asesor de la clase).
 *       '404':
 *         description: La clase no fue encontrada.
 *       '409':
 *         description: Conflicto, ya existe un reporte para esa clase.
 *       '500':
 *         description: Error del servidor.
 */
