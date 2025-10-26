import { supabase } from '../config/supabaseClient.js';

// --- FUNCIÓN scheduleClass (CORREGIDA) ---
export const scheduleClass = async (req, res) => {
  const authUser = req.user; 
  // 'title' SE HA ELIMINADO de los parámetros de entrada
  const { plan_subject_id, start_time, end_time } = req.body;

  // 1. Validar campos
  if (!plan_subject_id || !start_time || !end_time) {
    return res.status(400).json({ error: 'Faltan campos requeridos (plan_subject_id, start_time, end_time).' });
  }

  try {
    // 2. Obtener el plan subject, estado del enrollment, y cliente (Esta lógica ya está corregida)
    const { data: planSubject, error: planError } = await supabase
      .from('plan_subjects')
      .select(`
        advisor_id,
        enrollments (
          status,
          tutoring_requests (
            students (
              client_id
            )
          )
        )
      `)
      .eq('id', plan_subject_id)
      .single();

    if (planError) {
      console.error('Error finding planSubject:', planError);
      return res.status(404).json({ error: 'PlanSubject no encontrado.', details: planError.message });
    }

    // 3. Verificar que el enrollment esté ACTIVO (Esta lógica ya está corregida)
    if (planSubject.enrollments.status !== 'ACTIVE') {
      return res.status(400).json({ error: `El plan de enseñanza no está activo (estado actual: ${planSubject.enrollments.status}). No se pueden agendar clases.` });
    }

    // 4. Obtener perfil de 'public.users' (Esta lógica ya está corregida)
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', authUser.email)
      .single();
    if (publicUserError) {
      return res.status(404).json({ error: 'Perfil de usuario no encontrado en public.users.' });
    }
    
    // 5. Validar permisos (Esta lógica ya está corregida)
    const userRole = publicUser.role;
    const publicUserId = publicUser.id; 
    if (userRole === 'ADVISOR') { 
        const { data: advisorData } = await supabase.from('advisors').select('id').eq('user_id', publicUserId).single();
        if (!advisorData || advisorData.id !== planSubject.advisor_id) {
            return res.status(403).json({ error: 'Acción no permitida. No eres el asesor asignado a esta materia.' });
        }
    } 
    else if (userRole === 'CLIENT') { 
        const clientId = planSubject.enrollments.tutoring_requests.students.client_id;
        const { data: clientData } = await supabase.from('clients').select('user_id').eq('id', clientId).single();
        if (clientData.user_id !== publicUserId) {
            return res.status(403).json({ error: 'Acción no permitida. No eres el cliente dueño de este plan.' });
        }
    }

    // 6. --- CORRECCIÓN DE INSERT ---
    // 'title' SE HA ELIMINADO del objeto a insertar
    const { data: newClass, error: classError } = await supabase
      .from('classes')
      .insert({
        plan_subject_id,
        start_time,
        end_time,
        status: 'SCHEDULED'
      })
      .select()
      .single();

    if (classError) throw classError;

    res.status(201).json(newClass);

  } catch (error) {
    console.error('Error en scheduleClass:', error);
    res.status(500).json({ error: error.message });
  }
};

// --- FUNCIÓN getStudentCalendar (CORREGIDA) ---
export const getStudentCalendar = async (req, res) => {
  const { id } = req.params; // ID del estudiante (student_id)
  const authUser = req.user; 

  try {
    // (Validación de permisos del usuario - esta parte está bien)
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users').select('id, role').eq('email', authUser.email).single();
    if (publicUserError) return res.status(404).json({ error: 'Perfil de usuario no encontrado en public.users.' });
    
    const userRole = publicUser.role;
    const publicUserId = publicUser.id; 

    if (userRole === 'CLIENT') {
      const { data: studentClient } = await supabase
        .from('students')
        .select('client_id')
        .eq('id', id)
        .single();
        
      const { data: clientUser } = await supabase
        .from('clients')
        .select('user_id')
        .eq('id', studentClient.client_id)
        .single();

      if (clientUser.user_id !== publicUserId) {
         return res.status(403).json({ error: 'Acción no permitida. No puedes ver el calendario de un estudiante que no te pertenece.' });
      }
    }
    
    // 4. --- CORRECCIÓN DE CONSULTA ---
    // 'title' SE HA ELIMINADO del select
    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        id, start_time, end_time, status,
        plan_subjects!inner (
          enrollments!inner (
            tutoring_requests!inner (
              student_id
            )
          )
        )
      `)
      .eq('plan_subjects.enrollments.tutoring_requests.student_id', id);

    if (error) throw error;

    res.status(200).json(classes);

  } catch (error) { // <-- AQUÍ ESTABA EL ERROR (S{)
    res.status(500).json({ error: error.message });
  }
};