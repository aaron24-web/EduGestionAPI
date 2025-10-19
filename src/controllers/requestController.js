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
 * Esta función es compleja porque debe crear/encontrar al cliente,
 * crear al estudiante, y luego crear la solicitud.
 */
export const createRequest = async (req, res) => {
  const {
    tenant_id, // El frontend debe saber a qué academia (tenant) pertenece
    client_name,
    client_email,
    client_phone,
    student_name,
    student_school_grade_id,
    student_needs_description
  } = req.body;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id es requerido.' });
  }

  try {
    // ----
    // NOTA: Idealmente, esto se maneja con una "Función RPC" en Supabase
    // para que sea una transacción (si algo falla, se revierte todo).
    // Por ahora, lo hacemos paso a paso en la API:
    // ----

    // 1. Encontrar o crear al Cliente (padre)
    let { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('email', client_email)
      .eq('tenant_id', tenant_id)
      .single();

    if (clientError && clientError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw clientError;
    }

    if (!client) {
      // Cliente no existe, lo creamos
      const { data: newClient, error: newClientError } = await supabase
        .from('clients')
        .insert({
          tenant_id: tenant_id,
          full_name: client_name,
          email: client_email,
          phone: client_phone
          // Asumimos que no necesita 'user_id' hasta que acepte una invitación
        })
        .select('id')
        .single();
      
      if (newClientError) throw newClientError;
      client = newClient;
    }

    // 2. Crear al Estudiante
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        client_id: client.id,
        tenant_id: tenant_id,
        name: student_name,
        school_grade_id: student_school_grade_id
      })
      .select('id')
      .single();

    if (studentError) throw studentError;

    // 3. Crear la Solicitud de Asesoría
    const { data: request, error: requestError } = await supabase
      .from('tutoring_requests')
      .insert({
        tenant_id: tenant_id,
        client_id: client.id,
        student_id: student.id,
        student_needs_description: student_needs_description,
        status: 'PENDING_REVIEW' // Estado inicial del flujo
      })
      .select('id')
      .single();
    
    if (requestError) throw requestError;

    res.status(201).json({ 
      message: 'Solicitud creada exitosamente.', 
      requestId: request.id 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
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