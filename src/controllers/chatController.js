import { supabase } from '../config/supabaseClient.js';

/**
 * Función helper para obtener el perfil completo del usuario (ID numérico, rol, client_id/advisor_id)
 */
const getUserProfile = async (userEmail) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', userEmail)
    .single();

  if (userError) throw new Error('Usuario no encontrado en public.users');

  let profile = { userId: user.id, role: user.role, clientId: null, advisorId: null };

  if (user.role === 'CLIENT') {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (clientError) throw new Error('Perfil de cliente no encontrado.');
    profile.clientId = client.id;
  } else if (user.role === 'ADVISOR' || user.role === 'ACADEMY_ADMIN') {
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (advisorError) throw new Error('Perfil de asesor no encontrado.');
    profile.advisorId = advisor.id;
  }
  
  return profile;
};

/**
 * C.1: Obtiene las conversaciones del usuario autenticado
 */
export const getConversations = async (req, res) => {
  try {
    const userProfile = await getUserProfile(req.user.email);
    let query;

    // Construir la consulta según el rol
    if (userProfile.role === 'CLIENT') {
      query = supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          advisors ( users ( full_name ) ) 
        `)
        .eq('client_id', userProfile.clientId);
    } else if (userProfile.advisorId) { // ADVISOR o ACADEMY_ADMIN
      query = supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          clients ( users ( full_name ) )
        `)
        .eq('advisor_id', userProfile.advisorId);
    } else {
      return res.status(403).json({ error: 'Rol no válido para ver conversaciones.' });
    }

    const { data, error } = await query;
    if (error) throw error;
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * C.2: Obtiene los mensajes de una conversación específica
 */
export const getMessages = async (req, res) => {
  const { id } = req.params; // ID de la conversación

  try {
    const userProfile = await getUserProfile(req.user.email);
    
    // 1. Verificar que el usuario pertenece a esta conversación
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('client_id, advisor_id')
        .eq('id', id)
        .single();
        
    if (convError) return res.status(404).json({ error: 'Conversación no encontrada.' });

    const isParticipant = (userProfile.clientId && conversation.client_id === userProfile.clientId) ||
                          (userProfile.advisorId && conversation.advisor_id === userProfile.advisorId);

    if (!isParticipant) {
        return res.status(403).json({ error: 'No tienes permiso para ver esta conversación.' });
    }

    // 2. Obtener mensajes
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_user_id,
        read_at,
        users ( full_name )
      `)
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * C.3: Envía un nuevo mensaje a una conversación
 */
export const sendMessage = async (req, res) => {
  const { id } = req.params; // ID de la conversación
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'El contenido del mensaje es requerido.' });
  }

  try {
    const userProfile = await getUserProfile(req.user.email);
    
    // 1. Verificar que el usuario pertenece a esta conversación (igual que en getMessages)
     const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('client_id, advisor_id')
        .eq('id', id)
        .single();
    if (convError) return res.status(404).json({ error: 'Conversación no encontrada.' });
    const isParticipant = (userProfile.clientId && conversation.client_id === userProfile.clientId) ||
                          (userProfile.advisorId && conversation.advisor_id === userProfile.advisorId);
    if (!isParticipant) {
        return res.status(403).json({ error: 'No tienes permiso para enviar mensajes a esta conversación.' });
    }

    // 2. Insertar el mensaje
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        sender_user_id: userProfile.userId, // ID numérico de la tabla users
        content: content
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};