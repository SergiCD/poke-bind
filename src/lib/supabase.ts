import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// Public credentials only. Authorization is enforced by the SQL policies, never the UI.
export const supabase = url && key ? createClient(url, key) : null;
