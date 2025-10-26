import { supabase } from '../config/supabaseClient.js';

/**
 * Registra el pago de un cliente y activa el plan de inscripción (RF-035).
 */
export const registerPayment = async (req, res) => {
  try {
    const { enrollment_id, amount, payment_method } = req.body;

    if (!enrollment_id || !amount || !payment_method) {
      return res.status(400).json({ error: 'enrollment_id, amount, y payment_method son requeridos.' });
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
