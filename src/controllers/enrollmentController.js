import { supabase } from '../config/supabaseClient.js';

/**
 * Crea un nuevo Enrollment (Plan de Enseñanza)
 */
export const createEnrollment = async (req, res) => {
  const { tutoring_request_id } = req.body;

  if (!tutoring_request_id) {
    return res.status(400).json({ error: 'tutoring_request_id es requerido.' });
  }

  try {
    // 1. Opcional: Verificar que la solicitud existe y está en estado 'NEW'
    const { data: request, error: requestError } = await supabase
      .from('tutoring_requests')
      .select('id, status')
      .eq('id', tutoring_request_id)
      .single();

    if (requestError) {
      return res.status(404).json({ error: 'Solicitud de tutoría no encontrada.' });
    }
    // Descomenta si solo quieres crear planes para solicitudes nuevas
    // if (request.status !== 'NEW') {
    //     return res.status(400).json({ error: 'La solicitud no está en estado NEW.' });
    // }

    // 2. Crear el enrollment (versión simple según BBDD v3.4)
    // *** CORRECCIÓN: Se usa 'PLANNING' como estado inicial ***
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        tutoring_request_id: tutoring_request_id,
        status: 'PLANNING' // <-- ESTADO INICIAL CORRECTO
      })
      .select()
      .single();

    if (enrollError) {
      // Este chequeo ya no debería ser necesario, pero lo dejamos por seguridad
      if (enrollError.message.includes('invalid input value for enum')) {
          return res.status(500).json({
            error: `Error de BBDD: El valor '${'PLANNING'}' no es válido para el enum 'enrollment_status'. Revisa los ENUMs.`,
            details: enrollError.message
          });
      }
      throw enrollError; // Lanza otros errores
    }

    // 3. Opcional: Actualizar estado de la solicitud a 'UNDER_REVIEW' o 'ENROLLED'
    // Verifica que 'UNDER_REVIEW' exista en tu enum 'request_status_enum'
    await supabase
      .from('tutoring_requests')
      .update({ status: 'UNDER_REVIEW' }) // O 'ENROLLED', según tu lógica
      .eq('id', tutoring_request_id);

    res.status(201).json({ message: 'Enrollment creado exitosamente.', enrollment });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Añade una o más materias (PlanSubjects) a un Enrollment
 */
export const addSubjectsToEnrollment = async (req, res) => {
  const { id } = req.params; // ID del Enrollment
  // El body ahora debe coincidir con la BBDD v3.4
  const { subjects } = req.body; // Se espera: [ { specialization_id, advisor_id, diagnosis, goals, ... }, ... ]

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de "subjects".' });
  }

  try {
    // Mapeamos los subjects para añadir el enrollment_id
    const subjectsToInsert = subjects.map(sub => ({
      enrollment_id: id,
      specialization_id: sub.specialization_id,
      advisor_id: sub.advisor_id,
      diagnosis: sub.diagnosis,
      goals: sub.goals,
      methodology: sub.methodology
      // La BBDD v3.4 no tiene 'total_hours' o 'hourly_rate' aquí,
      // esos parecen estar en 'specializations' o en otro lado.
    }));

    const { data, error } = await supabase
      .from('plan_subjects')
      .insert(subjectsToInsert)
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Materias añadidas al plan.', subjects: data });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene un Enrollment y sus materias (PlanSubjects)
 */
export const getEnrollmentById = async (req, res) => {
  const { id } = req.params; // ID del Enrollment

  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        tutoring_request_id,
        plan_subjects ( 
          *,
          advisors ( user_id, bio ),
          specializations ( subject, level_id )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Enrollment no encontrado.' });
      }
      throw error;
    }

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};