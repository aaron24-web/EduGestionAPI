import { supabase } from '../config/supabaseClient.js';

/**
 * Función helper para obtener el tenant_id del usuario autenticado
 * (Basado en su email -> users.id -> advisors.tenant_id)
 */
const getTenantIdFromUser = async (userEmail) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', userEmail)
    .single();

  if (userError) throw new Error('Usuario no encontrado en public.users');

  // Si es 'CLIENT', no tiene tenant_id en 'advisors'
  if (user.role === 'CLIENT') return null; 

  const { data: advisor, error: advisorError } = await supabase
    .from('advisors')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();
  
  if (advisorError) throw new Error('Perfil de asesor no encontrado');
  
  return advisor.tenant_id;
};

/**
 * A.1: Obtiene todas las especializaciones del tenant
 */
export const getTenantSpecializations = async (req, res) => {
  try {
    const tenantId = await getTenantIdFromUser(req.user.email);
    if (!tenantId) {
      return res.status(403).json({ error: 'Acción no permitida para este rol.' });
    }

    const { data, error } = await supabase
      .from('specializations')
      .select(`
        id,
        subject,
        level_id,
        education_levels ( level_name )
      `)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * A.1: Crea una nueva especialización para el tenant
 */
export const createSpecialization = async (req, res) => {
  const { subject, level_id } = req.body;

  if (!subject || !level_id) {
    return res.status(400).json({ error: 'Faltan campos (subject, level_id)' });
  }

  try {
    const tenantId = await getTenantIdFromUser(req.user.email);
    if (!tenantId) {
      return res.status(403).json({ error: 'Acción no permitida para este rol.' });
    }

    const { data, error } = await supabase
      .from('specializations')
      .insert({
        tenant_id: tenantId,
        subject: subject,
        level_id: level_id
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};