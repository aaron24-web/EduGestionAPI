import { supabase } from '../config/supabaseClient.js';

export const getTenantRequests = async (req, res) => {
  // req.user fue añadido por el authMiddleware
  // No necesitamos req.user.id aquí si RLS está bien configurado.
  // El cliente de Supabase pasará automáticamente el JWT del usuario.

  try {
    // Esta consulta es SEGURA gracias a RLS.
    // Solo devolverá las filas que la política RLS permita para el usuario autenticado.
    const { data: requests, error } = await supabase
      .from('tutoring_requests')
      .select(`
        id,
        status,
        created_at,
        student_needs_description,
        students ( name, school_grade_id ),
        tenants ( business_name )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json(requests);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ... (Aquí va tu función getTenantRequests que ya tienes) ...

// ----------------------------------------------------
// AÑADE ESTAS DOS NUEVAS FUNCIONES AL FINAL DEL ARCHIVO
// ----------------------------------------------------

/**
 * RF-019: Crea una nueva solicitud de asesoría (Formulario Público)
 * Llama a la función RPC 'handle_new_request' en Supabase
 * para manejar la creación transaccional de user, client, student y request.
 */
export const createRequest = async (req, res) => {
  const {
    tenant_id,
    client_name,
    client_email,
    // Nota: 'client_phone' se omite ya que la BBDD v3.4 no lo tiene
    student_name,
    student_school_grade_id,
    student_needs_description
  } = req.body;

  if (!tenant_id || !client_name || !client_email || !student_name || !student_school_grade_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  try {
    // 1. Llamar a la función RPC en la base de datos
    const { data: newRequestId, error } = await supabase.rpc('handle_new_request', {
      p_tenant_id: tenant_id,
      p_client_name: client_name,
      p_client_email: client_email,
      p_student_name: student_name,
      p_student_school_grade_id: student_school_grade_id,
      p_student_needs_description: student_needs_description
    });

    if (error) {
      // Si la RPC falla, devuelve el error de la BBDD
      console.error('Error en RPC handle_new_request:', error);
      return res.status(500).json({ error: 'Error al procesar la solicitud.', details: error.message });
    }

    // 2. Éxito
    res.status(201).json({
      message: 'Solicitud creada exitosamente.',
      requestId: newRequestId // Devuelve el ID de la nueva solicitud
    });

  } catch (error) {
    res.status(500).json({ error: 'Error inesperado del servidor.', details: error.message });
  }
};


/**
 * RF-021: Obtiene el detalle de UNA solicitud (Ruta Protegida)
 */
export const getRequestById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: request, error } = await supabase
      .from('tutoring_requests')
      .select(`
        id,
        status,
        created_at,
        student_needs_description,
        tenant_id,
        
        student_id:students ( 
          name, 
          school_grade_id,
          
          client_id:clients ( 
            user_id:users ( 
              full_name, 
              email
            ) 
          ) 
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Solicitud no encontrada o no tiene permiso para verla.' });
      }
      console.error('Supabase error:', error);
      throw error;
    }

    // Simplificar la estructura de la respuesta (opcional pero recomendado)
    // Para que no tengas data.student_id.client_id.user_id.full_name
    // sino algo más plano como data.client_name
    const response = {
      id: request.id,
      status: request.status,
      created_at: request.created_at,
      student_needs_description: request.student_needs_description,
      tenant_id: request.tenant_id,
      student_name: request.student_id?.name,
      student_school_grade_id: request.student_id?.school_grade_id,
      client_name: request.student_id?.client_id?.user_id?.full_name,
      client_email: request.student_id?.client_id?.user_id?.email,
      // client_phone: request.student_id?.client_id?.user_id?.phone, // Descomentar si añades 'phone' a la tabla 'users'
    };


    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * RF-022: Asigna un Asesor a una Solicitud (para Academy Admin)
 */
export const assignAdvisor = async (req, res) => {
  const { id } = req.params; // ID de la solicitud (tutoring_request)
  const { advisor_id } = req.body;

  if (!advisor_id) {
    return res.status(400).json({ error: 'El campo advisor_id es requerido.' });
  }

  // TODO: Añadir un roleMiddleware para asegurar que solo un 'ACADEMY_ADMIN'
  // o el 'ADVISOR' principal (si es tenant individual) puede hacer esto.
  // const { user } = req; // req.user es inyectado por authMiddleware
  // Aquí iría la lógica de verificación de roles...

  try {
    const { data, error } = await supabase
      .from('tutoring_requests')
      .update({ 
        advisor_id: advisor_id,
        status: 'PENDING_PLAN' // Actualizamos el estado, listo para crear el plan
      })
      .eq('id', id)
      // TODO: Añadir .eq('tenant_id', user.tenant_id) como doble chequeo de seguridad
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No se encontró la fila
        return res.status(404).json({ error: 'Solicitud no encontrada.' });
      }
      throw error;
    }

    res.status(200).json({ message: 'Asesor asignado exitosamente.', request: data });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};