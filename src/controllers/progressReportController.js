import { supabase } from '../config/supabaseClient.js';

/**
 * RF-033: Crea un nuevo reporte de progreso
 */
export const createProgressReport = async (req, res) => {
  // --- CORRECCIÓN: Usar los campos de la BBDD v3.4 ---
  const { 
    class_id, 
    topics_covered, 
    strengths, 
    areas_for_improvement, 
    homework_recommendations 
  } = req.body;

  // 1. Validar campos requeridos
  // (Asumimos que todos son requeridos, excepto quizás 'homework')
  if (!class_id || !topics_covered || !strengths || !areas_for_improvement) {
    return res.status(400).json({ error: 'Faltan campos requeridos (class_id, topics_covered, strengths, areas_for_improvement).' });
  }

  try {
    // 2. (Opcional) Verificar que el usuario sea el Asesor de esa clase
    // const authUser = req.user;
    // ... (lógica de permisos) ...

    // 3. Insertar el reporte en la base de datos
    const { data: newReport, error } = await supabase
      .from('progress_reports')
      .insert({
        class_id,
        topics_covered,
        strengths,
        areas_for_improvement,
        homework_recommendations
      })
      .select()
      .single();

    if (error) {
      // Manejar error si la clase no existe (Foreign Key violation)
      if (error.code === '23503') { // foreign_key_violation
        return res.status(404).json({ error: 'La "class_id" no existe o ya tiene un reporte.' });
      }
      throw error;
    }

    res.status(201).json(newReport);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};