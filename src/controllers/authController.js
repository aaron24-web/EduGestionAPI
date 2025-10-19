import { supabase } from '../config/supabaseClient.js';

/**
 * Registra un nuevo Suscriptor (Asesor o Academia)
 * RF-006
 */
export const registerUser = async (req, res) => {
  try {
    const { email, password, full_name, tenant_type } = req.body;

    // Validar que el tipo de tenant sea correcto
    const validTenantTypes = ['INDIVIDUAL_ADVISOR', 'ACADEMY'];
    if (!tenant_type || !validTenantTypes.includes(tenant_type)) {
      return res.status(400).json({ 
        error: 'Tipo de cuenta inválido. Debe ser INDIVIDUAL_ADVISOR o ACADEMY.' 
      });
    }

    // Mapear el rol del usuario según el tipo de tenant
    // RF-006, RF-011, Schema 
    const role = tenant_type === 'ACADEMY' ? 'ACADEMY_ADMIN' : 'ADVISOR';

    // 1. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Almacenamos datos adicionales que usaremos en los triggers
        data: {
          full_name: full_name,
          role: role,
          tenant_type: tenant_type,
          business_name: full_name // Usamos el full_name como business_name inicial
        }
      }
    });

    if (authError) {
      // Manejar errores comunes, como email ya existente
      if (authError.message.includes('User already registered')) {
        return res.status(400).json({ error: 'Este correo electrónico ya está registrado.' });
      }
      throw authError;
    }
    
    // NOTA: En un proyecto real, aquí es donde un Trigger de BBDD
    // (o más código de API) crearía las entradas en las tablas
    // 'users', 'tenants' y 'advisors' usando el authData.user.id.
    // Por ahora, el registro en Supabase Auth es suficiente para probar el login.

    res.status(201).json({ 
      message: 'Usuario registrado. Por favor, verifica tu correo electrónico.', 
      user: authData.user 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Autentica un usuario y devuelve un token
 * RF-007
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    res.status(200).json({ 
      message: 'Inicio de sesión exitoso.', 
      session: data.session,
      user: data.user
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};