import { supabase } from '../config/supabaseClient.js';

/**
 * RF-025: El Cliente aprueba el plan de enseñanza (enrollment)
 * PUT /enrollments/:id/approve
 * 
 * Lógica:
 * 1. Verificar que el usuario autenticado es el CLIENT dueño del enrollment
 * 2. Verificar que el enrollment está en estado PENDING_APPROVAL
 * 3. Cambiar el estado a ACTIVE (aprobado y listo para agendar clases)
 */
export const approveEnrollment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado.' });
  }

  try {
    // 1. Obtener el enrollment con la información del cliente
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        tutoring_request_id,
        tutoring_requests!inner (
          id,
          student_id,
          students!inner (
            id,
            client_id,
            clients!inner (
              id,
              user_id
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Enrollment no encontrado.' });
      }
      throw fetchError;
    }

    // 2. Verificar que el usuario es el cliente dueño del enrollment
    const clientUserId = enrollment.tutoring_requests?.students?.clients?.user_id;
    
    if (clientUserId !== userId) {
      return res.status(403).json({ 
        error: 'No tienes permiso para aprobar este enrollment. Solo el cliente puede aprobarlo.' 
      });
    }

    // 3. Verificar que el estado actual permite la aprobación
    if (enrollment.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ 
        error: `No se puede aprobar un enrollment en estado '${enrollment.status}'. Debe estar en 'PENDING_APPROVAL'.` 
      });
    }

    // 4. Actualizar el estado a ACTIVE
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('enrollments')
      .update({ 
        status: 'ACTIVE',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({ 
      message: 'Enrollment aprobado exitosamente. Ahora se pueden agendar clases.',
      enrollment: updatedEnrollment
    });

  } catch (error) {
    console.error('Error al aprobar enrollment:', error);
    res.status(500).json({ error: error.message });
  }
};


/**
 * RF-024: El Cliente rechaza el plan y solicita cambios
 * POST /enrollments/:id/request-changes
 * 
 * Lógica:
 * 1. Verificar que el usuario es el CLIENT dueño
 * 2. Verificar que el enrollment está en PENDING_APPROVAL
 * 3. Cambiar el estado de vuelta a PLANNING (para que el asesor lo revise)
 * 4. Opcionalmente guardar los comentarios del cliente
 */
export const requestChanges = async (req, res) => {
  const { id } = req.params;
  const { comments } = req.body; // Comentarios opcionales del cliente
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado.' });
  }

  try {
    // 1. Obtener el enrollment con la información del cliente
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        tutoring_request_id,
        tutoring_requests!inner (
          id,
          student_id,
          students!inner (
            id,
            client_id,
            clients!inner (
              id,
              user_id
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Enrollment no encontrado.' });
      }
      throw fetchError;
    }

    // 2. Verificar que el usuario es el cliente dueño
    const clientUserId = enrollment.tutoring_requests?.students?.clients?.user_id;
    
    if (clientUserId !== userId) {
      return res.status(403).json({ 
        error: 'No tienes permiso para solicitar cambios en este enrollment.' 
      });
    }

    // 3. Verificar que el estado actual permite solicitar cambios
    if (enrollment.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ 
        error: `No se pueden solicitar cambios en un enrollment con estado '${enrollment.status}'. Debe estar en 'PENDING_APPROVAL'.` 
      });
    }

    // 4. Cambiar el estado de vuelta a PLANNING
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('enrollments')
      .update({ 
        status: 'PLANNING',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. (OPCIONAL) Si quieres guardar los comentarios del cliente,
    // podrías crear una tabla 'enrollment_feedback' o añadir un campo de notas
    // Por ahora solo devolvemos el resultado
    
    res.status(200).json({ 
      message: 'Solicitud de cambios enviada. El asesor revisará el plan nuevamente.',
      enrollment: updatedEnrollment,
      client_comments: comments || null
    });

  } catch (error) {
    console.error('Error al solicitar cambios:', error);
    res.status(500).json({ error: error.message });
  }
};


/**
 * RF-026: El Asesor envía el plan completo para aprobación del cliente
 * PUT /enrollments/:id/submit-for-approval
 * 
 * Lógica:
 * 1. Verificar que el usuario es un ADVISOR asignado a algún plan_subject del enrollment
 * 2. Verificar que el enrollment está en estado PLANNING
 * 3. Verificar que hay al menos un plan_subject creado (no se puede enviar un plan vacío)
 * 4. Cambiar el estado a PENDING_APPROVAL
 */
export const submitForApproval = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado.' });
  }

  try {
    // 1. Obtener el enrollment con sus plan_subjects
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        tutoring_request_id,
        plan_subjects (
          id,
          advisor_id,
          advisors!inner (
            id,
            user_id
          )
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Enrollment no encontrado.' });
      }
      throw fetchError;
    }

    // 2. Verificar que el enrollment tiene plan_subjects
    if (!enrollment.plan_subjects || enrollment.plan_subjects.length === 0) {
      return res.status(400).json({ 
        error: 'No se puede enviar para aprobación un enrollment sin plan_subjects. Debe crear al menos una materia en el plan.' 
      });
    }

    // 3. Verificar que el usuario es uno de los asesores asignados al enrollment
    const advisorUserIds = enrollment.plan_subjects.map(ps => ps.advisors?.user_id).filter(Boolean);
    
    if (!advisorUserIds.includes(userId)) {
      return res.status(403).json({ 
        error: 'No tienes permiso para enviar este enrollment. Solo los asesores asignados pueden hacerlo.' 
      });
    }

    // 4. Verificar que el estado actual es PLANNING
    if (enrollment.status !== 'PLANNING') {
      return res.status(400).json({ 
        error: `No se puede enviar para aprobación un enrollment en estado '${enrollment.status}'. Debe estar en 'PLANNING'.` 
      });
    }

    // 5. Cambiar el estado a PENDING_APPROVAL
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('enrollments')
      .update({ 
        status: 'PENDING_APPROVAL',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({ 
      message: 'Plan enviado al cliente para aprobación exitosamente.',
      enrollment: updatedEnrollment
    });

  } catch (error) {
    console.error('Error al enviar enrollment para aprobación:', error);
    res.status(500).json({ error: error.message });
  }
};


/**
 * Función auxiliar: Obtener detalle completo de un enrollment
 * GET /enrollments/:id
 * 
 * Devuelve el enrollment con todos sus plan_subjects, clases, etc.
 * Útil tanto para el cliente como para el asesor
 */
export const getEnrollmentById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        tutoring_request_id,
        tutoring_requests (
          id,
          student_needs_description,
          students (
            id,
            name,
            school_grades (
              id,
              grade_name
            ),
            clients (
              id,
              users (
                full_name,
                email
              )
            )
          )
        ),
        plan_subjects (
          id,
          diagnosis,
          goals,
          methodology,
          specializations (
            id,
            subject,
            education_levels (
              level_name
            )
          ),
          advisors (
            id,
            users (
              full_name,
              email
            )
          ),
          classes (
            id,
            start_time,
            end_time,
            status
          )
        ),
        payments (
          id,
          amount,
          status,
          paid_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Enrollment no encontrado o no tiene permiso para verlo.' });
      }
      throw error;
    }

    res.status(200).json(enrollment);

  } catch (error) {
    console.error('Error al obtener enrollment:', error);
    res.status(500).json({ error: error.message });
  }
};
