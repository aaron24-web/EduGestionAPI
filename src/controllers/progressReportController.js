import { supabase } from '../config/supabaseClient.js';

/**
 * RF-033: Crear un reporte de progreso para una clase.
 * Solo el asesor asignado a la clase puede crear el reporte.
 */
export const createProgressReport = async (req, res) => {
  const advisorUserId = req.user.id;
  const {
    class_id,
    strengths,
    areas_for_improvement,
    next_steps,
    general_comments
  } = req.body;

  if (!class_id || !strengths || !areas_for_improvement || !next_steps) {
    return res.status(400).json({ error: 'Faltan campos requeridos (class_id, strengths, areas_for_improvement, next_steps).' });
  }

  try {
    // 1. Obtener el ID del asesor a partir de su user_id
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id')
      .eq('user_id', advisorUserId)
      .single();

    if (advisorError || !advisor) {
      return res.status(403).json({ error: 'Acción no permitida. El usuario no es un asesor válido.' });
    }

    // 2. Verificar que la clase exista y que el asesor que hace el reporte sea el asignado
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, advisor_id, status')
      .eq('id', class_id)
      .single();

    if (classError) throw classError;
    if (!classData) {
      return res.status(404).json({ error: 'La clase especificada no existe.' });
    }
    if (classData.advisor_id !== advisor.id) {
      return res.status(403).json({ error: 'No tienes permiso para crear un reporte para esta clase.' });
    }

    // 3. Verificar que no exista ya un reporte para esta clase para evitar duplicados
    const { count, error: reportExistsError } = await supabase
        .from('progress_reports')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', class_id);

    if (reportExistsError) throw reportExistsError;

    if (count > 0) {
        return res.status(409).json({ error: 'Ya existe un reporte de progreso para esta clase.' });
    }

    // 4. Crear el reporte de progreso en la base de datos
    const { data: newReport, error: insertError } = await supabase
      .from('progress_reports')
      .insert({
        class_id,
        advisor_id: advisor.id,
        strengths,
        areas_for_improvement,
        next_steps,
        general_comments
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    // 5. Opcional: Actualizar el estado de la clase a 'COMPLETED'
    await supabase
        .from('classes')
        .update({ status: 'COMPLETED' })
        .eq('id', class_id);

    res.status(201).json({ message: 'Reporte de progreso creado exitosamente.', report: newReport });

  } catch (error) {
    console.error('Error creating progress report:', error);
    res.status(500).json({ error: error.message });
  }
};
