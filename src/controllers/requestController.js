import { supabase } from '../config/supabaseClient.js';

export const getTenantRequests = async (req, res) => {
  // req.user fue añadido por el authMiddleware
  // No necesitamos req.user.id aquí si RLS está bien configurado.
  // El cliente de Supabase pasará automáticamente el JWT del usuario.

  try {
    // Esta consulta es SEGURA gracias a RLS.
    // Solo devolverá las filas que la política RLS permita para el usuario autenticado.
    const { data: requests, error } = await supabase
      .from('tutoring_requests')
      .select(`
        id,
        status,
        created_at,
        student_needs_description,
        students ( name, school_grade_id ),
        tenants ( business_name )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json(requests);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};