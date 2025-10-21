import { supabase } from '../config/supabaseClient.js';

/**
 * RF-027: Agendar una nueva clase para un plan activo.
 * Solo un asesor o admin puede agendar.
 */
export const scheduleClass = async (req, res) => {
  // El ID del usuario (asesor) viene del token JWT a través del middleware
  const advisorUserId = req.user.id; 
  const { plan_subject_id, student_id, start_time, end_time, title, description } = req.body;

  if (!plan_subject_id || !student_id || !start_time || !end_time || !title) {
    return res.status(400).json({ error: 'Faltan campos requeridos (plan_subject_id, student_id, start_time, end_time, title).' });
  }

  try {
    // 1. Validar que el usuario sea un asesor válido y obtener su ID de la tabla 'advisors'
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id, tenant_id')
      .eq('user_id', advisorUserId)
      .single();

    if (advisorError || !advisor) {
      return res.status(403).json({ error: 'Acción no permitida. El usuario no es un asesor válido.' });
    }

    // 2. Obtener el plan_subject y verificar que el plan asociado esté ACTIVO
    const { data: planSubject, error: planSubjectError } = await supabase
      .from('plan_subjects')
      .select(`
        id,
        number_of_classes,
        plans ( id, status, tenant_id, student_id )
      `)
      .eq('id', plan_subject_id)
      .single();

    if (planSubjectError) throw planSubjectError;

    if (!planSubject) {
      return res.status(404).json({ error: 'La materia del plan especificada no existe.' });
    }
    
    // 3. Validaciones de negocio críticas
    if (planSubject.plans.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'No se puede agendar una clase para un plan que no está activo.' });
    }
    if (planSubject.plans.tenant_id !== advisor.tenant_id) {
        return res.status(403).json({ error: 'No tienes permiso para agendar clases en este plan.' });
    }
    if (planSubject.plans.student_id !== student_id) {
        return res.status(400).json({ error: 'El estudiante proporcionado no coincide con el estudiante del plan.' });
    }

    // 4. Contar clases existentes para no exceder el límite del plan
    const { count, error: countError } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('plan_subject_id', plan_subject_id);

    if (countError) throw countError;

    if (count >= planSubject.number_of_classes) {
      return res.status(400).json({ error: 'Se ha alcanzado el número máximo de clases para esta materia del plan.' });
    }

    // 5. Si todo es correcto, insertar la nueva clase en la base de datos
    const { data: newClass, error: insertError } = await supabase
      .from('classes')
      .insert({
        plan_subject_id,
        student_id,
        advisor_id: advisor.id,
        tenant_id: advisor.tenant_id,
        start_time,
        end_time,
        title,
        description,
        status: 'SCHEDULED' // Estado inicial
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({ message: 'Clase agendada exitosamente.', class: newClass });

  } catch (error) {
    console.error('Error scheduling class:', error);
    res.status(500).json({ error: error.message });
  }
};


/**
 * RF-028: Obtiene el calendario de clases de un estudiante.
 * Devuelve todas las clases pasadas y futuras de un estudiante.
 */
export const getStudentCalendar = async (req, res) => {
    const { studentId } = req.params;

    try {
        // La consulta a 'classes' debería estar protegida por Políticas de Seguridad a Nivel de Fila (RLS) en Supabase.
        // Esto asegura que un asesor solo pueda ver estudiantes de su propio tenant.
        const { data: classes, error } = await supabase
            .from('classes')
            .select(`
                id,
                start_time,
                end_time,
                title,
                description,
                status,
                plan_subjects (
                    subjects ( name )
                ),
                advisors (
                    users ( full_name )
                )
            `)
            .eq('student_id', studentId)
            .order('start_time', { ascending: true });

        if (error) throw error;
        
        // Formatear la respuesta para que sea más fácil de usar en el frontend
        const formattedClasses = classes.map(c => ({
            id: c.id,
            start_time: c.start_time,
            end_time: c.end_time,
            title: c.title,
            description: c.description,
            status: c.status,
            subject: c.plan_subjects?.subjects?.name || 'N/A',
            advisor: c.advisors?.users?.full_name || 'N/A'
        }));

        res.status(200).json(formattedClasses);

    } catch (error) {
        console.error('Error fetching student calendar:', error);
        res.status(500).json({ error: error.message });
    }
};
