import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargamos variables de entorno desde .env cuando exista
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Mensaje claro si faltan variables esenciales
if (!supabaseUrl || !supabaseKey) {
	console.error('\n[ERROR] Missing Supabase configuration: SUPABASE_URL and/or SUPABASE_SERVICE_KEY are not set.');
	console.error('Please copy `.env.example` to `.env` and fill the values, or set the environment variables in your shell.');
	console.error('Development will exit to avoid confusing runtime errors.');
	// Exit with non-zero so nodemon shows the failure clearly
	process.exit(1);
}

// Usamos la Service Key para operaciones de backend
export const supabase = createClient(supabaseUrl, supabaseKey);