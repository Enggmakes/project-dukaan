import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
supabase.from('orders').select('*').then(res => {
  console.log("DATA:");
  console.log(JSON.stringify(res.data, null, 2));
  console.log("ERROR:");
  console.log(res.error);
});
