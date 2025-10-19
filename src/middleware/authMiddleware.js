import { supabase } from '../config/supabaseClient.js';

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Acceso denegado.' });
  }

  const token = authHeader.split(' ')[1];

  // Supabase valida el token y devuelve el usuario
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido. Acceso denegado.' });
  }

  // ¡Importante! Añadimos el usuario al objeto 'req'
  req.user = user; 
  next();
};