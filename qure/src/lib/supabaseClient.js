import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "URL"; //use environment variables
const supabaseKey = "Key"; //use environment variables

export const supabaseclient = createClient(supabaseUrl, supabaseKey);
