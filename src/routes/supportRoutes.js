import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getEducationLevels,
  getSchoolGrades
} from '../controllers/supportController.js';

const router = Router();

// Estas rutas son de "lectura" y son necesarias para
// formularios públicos y privados. Las protegeremos
// para que solo usuarios autenticados puedan verlas.
router.use(authMiddleware);

/**
 * @openapi
 * /support/education-levels:
 *   get:
 *     summary: Obtiene la lista de niveles educativos
 *     description: D. Endpoints de Soporte. Devuelve la tabla 'education_levels'.
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de niveles (ej. Primaria, Secundaria)
 */
router.get('/education-levels', getEducationLevels);

/**
 * @openapi
 * /support/school-grades:
 *   get:
 *     summary: Obtiene la lista de grados escolares
 *     description: D. Endpoints de Soporte. Devuelve la tabla 'school_grades'.
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de grados (ej. 1er Grado Secundaria)
 */
router.get('/school-grades', getSchoolGrades);

export default router;