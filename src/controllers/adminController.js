import { supabase } from '../config/supabaseClient.js';

/**
 * RF-002: Ver todos los suscriptores (tenants)
 */
export const getAllTenants = async (req, res) => {
  try {
    // --- CORRECCIÓN DE CONSULTA ---
    // Ahora consultamos la relación anidada: tenants -> advisors -> users
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select(`
        id,
        business_name,
        tenant_type,
        verification_status,
        created_at,
        advisors (
          user_id,
          users (
            full_name,
            email,
            role
          )
        )
      `);

    if (error) throw error;

    // (Opcional) Podemos simplificar la respuesta para que 
    // el frontend no tenga que lidiar con tantos anidamientos.
    const simplifiedTenants = tenants.map(tenant => {
      // Intentar encontrar el 'user' admin de esa academia
      const adminUser = tenant.advisors
        .find(a => a.users.role === 'ACADEMY_ADMIN')?.users;
        
      // O tomar el primer asesor si no hay admin (para asesores individuales)
      const primaryUser = tenant.advisors[0]?.users;
      
      return {
        tenant_id: tenant.id,
        business_name: tenant.business_name,
        tenant_type: tenant.tenant_type,
        verification_status: tenant.verification_status,
        created_at: tenant.created_at,
        admin_name: adminUser?.full_name || primaryUser?.full_name || 'N/A',
        admin_email: adminUser?.email || primaryUser?.email || 'N/A'
      };
    });

    res.status(200).json(simplifiedTenants);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * RF-003: Aprobar o Rechazar un tenant
 * (Esta función ya estaba bien)
 */
export const verifyTenant = async (req, res) => {
  const { id } = req.params; // ID del tenant
  const { verification_status } = req.body; // 'APPROVED' o 'REJECTED'

  const validStatus = ['APPROVED', 'REJECTED'];
  if (!verification_status || !validStatus.includes(verification_status)) {
    return res.status(400).json({ error: "El estado debe ser 'APPROVED' o 'REJECTED'." });
  }

  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({ verification_status: verification_status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No se encontró la fila
        return res.status(404).json({ error: 'Tenant no encontrado.' });
      }
      throw error;
    }

    res.status(200).json({ message: 'Estado del tenant actualizado.', tenant });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};