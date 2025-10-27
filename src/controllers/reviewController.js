import { supabase } from '../config/supabaseClient.js';

/**
 * Función helper para verificar si un cliente es dueño de un enrollment
 */
const isClientOwnerOfEnrollment = async (userEmail, enrollmentId) => {
  // 1. Obtener el user_id y client_id del usuario logueado
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', userEmail)
    .eq('role', 'CLIENT')
    .single();

  if (userError) throw new Error('Usuario no es un cliente válido.');

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .single();
  
  if (clientError) throw new Error('Perfil de cliente no encontrado.');
  const clientId = client.id;

  // 2. Obtener el client_id del enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from('enrollments')
    .select('tutoring_requests ( students ( client_id ) )')
    .eq('id', enrollmentId)
    .single();

  if (enrollError) throw new Error('Enrollment no encontrado.');

  const ownerClientId = enrollment.tutoring_requests?.students?.client_id;

  // 3. Comparar
  return clientId === ownerClientId;
};


/**
 * B: Cliente crea una reseña para un enrollment
 */
export const createReview = async (req, res) => {
  const { enrollment_id, rating, public_comment, private_feedback } = req.body;
  
  if (!enrollment_id || !rating) {
    return res.status(400).json({ error: 'Faltan campos (enrollment_id, rating)' });
  }

  // Validar rating (según tu script v3.3)
  if (rating < 1 || rating > 5) {
     return res.status(400).json({ error: 'El rating debe estar entre 1 y 5.' });
  }

  try {
    // 1. Verificar Permiso (que el usuario sea el CLIENTE de ese enrollment)
    const isOwner = await isClientOwnerOfEnrollment(req.user.email, enrollment_id);
    if (!isOwner) {
      return res.status(403).json({ error: 'Acceso denegado. No eres el cliente de este plan.' });
    }
    
    // 2. Insertar la reseña
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        enrollment_id,
        rating,
        public_comment,
        private_feedback,
        status: 'PUBLISHED' // O 'PENDING' si prefieres moderación
      })
      .select()
      .single();

    if (error) {
       // Manejar error si ya existe una reseña (Foreign Key/Unique)
      if (error.code === '23505') { // unique_violation
        return res.status(409).json({ error: 'Ya existe una reseña para este enrollment.' });
      }
      throw error;
    }

    res.status(201).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};