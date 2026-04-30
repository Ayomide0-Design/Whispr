import { createClient } from '@supabase/supabase-js'

// Uses the service role key — bypasses RLS for admin operations like hiding messages
// Never expose this key to the browser
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
