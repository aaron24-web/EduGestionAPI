import { supabase } from '../config/supabaseClient.js';

const getUserProfile = async (userEmail) => {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', userEmail)
      .single();
  
    if (userError) throw new Error('Usuario no encontrado en public.users');
  
    let profile = { userId: user.id, role: user.role, clientId: null, advisorId: null };
  
    if (user.role === 'CLIENT' || user.role === 'PARENT') {
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
 * Registra el pago de un cliente y activa el plan de inscripción (RF-035).
 */
export const registerPayment = async (req, res) => {
  try {
    const { enrollment_id, amount, payment_method } = req.body;

    if (!enrollment_id || !amount || !payment_method) {
      return res.status(400).json({ error: 'enrollment_id, amount, y payment_method son requeridos.' });
    }

    const userProfile = await getUserProfile(req.user.email);

    const { data: enrollment, error: enrollmentErrorGet } = await supabase
      .from('enrollments')
      .select('client_id')
      .eq('id', enrollment_id)
      .single();

    if (enrollmentErrorGet || !enrollment) {
        return res.status(404).json({ error: 'Enrollment not found.' });
    }

    if (enrollment.client_id !== userProfile.clientId) {
        return res.status(403).json({ error: 'You are not authorized to pay for this enrollment.' });
    }

    // 1. Registrar el pago en la tabla 'payments'
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert([{ enrollment_id, amount, payment_method, paid_at: new Date().toISOString(), status: 'PAID', edugestion_fee: 450.00, net_amount_for_tenant: amount - 450.00 }])
      .select();

    if (paymentError) {
      console.error('Error al registrar el pago:', paymentError);
      return res.status(500).json({ error: 'Error al registrar el pago.' });
    }

    // 2. Actualizar el estado del enrollment a 'ACTIVE'
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('enrollments')
      .update({ status: 'ACTIVE' })
      .eq('id', enrollment_id)
      .select();

    if (enrollmentError) {
      console.error('Error al actualizar el estado del enrollment:', enrollmentError);
      // Considerar revertir el pago si la actualización del enrollment falla
      return res.status(500).json({ error: 'Error al actualizar el estado del enrollment.' });
    }

    if (!enrollmentData || enrollmentData.length === 0) {
      return res.status(404).json({ error: 'Enrollment no encontrado o no se pudo actualizar.' });
    }

    res.status(201).json({ 
      message: 'Pago registrado exitosamente y plan activado.', 
      payment: paymentData[0],
      enrollment: enrollmentData[0]
    });

  } catch (error) {
    console.error('Error en registerPayment:', error);
    res.status(500).json({ error: error.message });
  }
};
