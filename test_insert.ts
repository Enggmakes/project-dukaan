import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('orders').insert({
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    customer_name: 'Test',
    customer_email: 'test@test.com',
    amount: 100
  }).select();
  console.log('Error:', error);
}
run();
