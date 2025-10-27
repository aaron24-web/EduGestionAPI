import { supabase } from '../config/supabaseClient.js';

/**
 * Función helper para obtener el advisor_id del usuario autenticado
 * (Basado en su email -> users.id -> advisors.id)
 */
const getAdvisorIdFromUser = async (userEmail) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', userEmail)
    .single();

  if (userError) throw new Error('Usuario no encontrado en public.users');
  if (user.role === 'CLIENT') return null; 

  const { data: advisor, error: advisorError } = await supabase
    .from('advisors')
    .select('id') // Obtenemos el ID de advisor, no el tenant_id
    .eq('user_id', user.id)
    .single();
  
  if (advisorError) throw new Error('Perfil de asesor no encontrado');
  
  return advisor.id; // Devuelve el 'id' de la tabla 'advisors'
};

/**
 * A.2: Obtiene el horario de trabajo de un asesor
 */
export const getWorkSchedule = async (req, res) => {
  const { advisor_id } = req.params; // ID del asesor

  try {
    const { data, error } = await supabase
      .from('work_schedules')
      .select('id, day_of_week, start_time, end_time')
      .eq('advisor_id', advisor_id)
      .order('day_of_week', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * A.2: Define el horario de trabajo para el asesor autenticado
 * Esto reemplaza todo el horario anterior del asesor.
 */
export const setWorkSchedule = async (req, res) => {
  // Se espera un array: [ { day_of_week: 1, start_time: '09:00', end_time: '12:00' }, ... ]
  const { schedule } = req.body; 

  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: 'Se requiere un array de "schedule".' });
  }

  try {
    const advisorId = await getAdvisorIdFromUser(req.user.email);
    if (!advisorId) {
      return res.status(403).json({ error: 'Acción no permitida.' });
    }

    // 1. Borrar el horario antiguo de este asesor (transacción)
    const { error: deleteError } = await supabase
        .from('work_schedules')
        .delete()
        .eq('advisor_id', advisorId);

    if (deleteError) throw deleteError;
    
    // 2. Insertar el nuevo horario
    const scheduleToInsert = schedule.map(slot => ({
        advisor_id: advisorId,
        day_of_week: slot.day_of_week, // (0=Domingo, 1=Lunes, ... 6=Sábado)
        start_time: slot.start_time,
        end_time: slot.end_time
    }));
    
    const { data, error: insertError } = await supabase
        .from('work_schedules')
        .insert(scheduleToInsert)
        .select();

    if (insertError) throw insertError;

    res.status(201).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};