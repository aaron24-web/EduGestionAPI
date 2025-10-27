import { supabase } from '../config/supabaseClient.js';

/**
 * D.1: Obtiene todos los niveles educativos
 */
export const getEducationLevels = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('education_levels')
      .select('id, level_name')
      .order('id', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * D.2: Obtiene todos los grados escolares
 */
export const getSchoolGrades = async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('school_grades')
        .select('id, grade_name')
        .order('id', { ascending: true });
  
      if (error) throw error;
      res.status(200).json(data);
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };