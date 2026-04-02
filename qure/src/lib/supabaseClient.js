import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL; //use environment variables
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; //use environment variables

export const supabaseclient = createClient(supabaseUrl, supabaseKey);
