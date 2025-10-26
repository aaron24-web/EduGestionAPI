import { supabase } from '../config/supabaseClient.js';

/**
 * Middleware de Autorización Basada en Roles (RBAC).
 * * Este middleware se ejecuta DESPUÉS de authMiddleware y verifica
 * si el rol del usuario autenticado está en la lista de roles permitidos.
 * * @param {string[]} allowedRoles - Array de roles permitidos (ej. ['CLIENT', 'ADVISOR'])
 */
export const roleMiddleware = (allowedRoles) => {
  return async (req, res, next) => {
    // 1. Obtener el EMAIL del usuario (inyectado por authMiddleware)
    // req.user es el objeto de Supabase Auth
    const userEmail = req.user.email; 

    if (!userEmail) {
      return res.status(401).json({ error: 'No se encontró email de usuario en el token.' });
    }

    try {
      // 2. Consultar la tabla 'public.users' para obtener el rol del usuario USANDO EL EMAIL
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('email', userEmail) // <-- ESTA ES LA CORRECCIÓN (usar 'email' en lugar de 'id')
        .single();

      if (userError || !userData) {
        return res.status(404).json({ error: 'Perfil de usuario no encontrado en la tabla public.users.' });
      }

      const userRole = userData.role;

      // 3. Verificar si el rol del usuario está en la lista de roles permitidos
      if (allowedRoles.includes(userRole)) {
        // ¡Permiso concedido!
        next();
      } else {
        // ¡Permiso denegado!
        return res.status(403).json({ 
          error: 'Acceso denegado. No tienes permiso para realizar esta acción.',
          userRole: userRole,
          requiredRoles: allowedRoles
        });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error al verificar el rol del usuario.', details: error.message });
    }
  };
};