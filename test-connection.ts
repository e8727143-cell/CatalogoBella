import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Checking connection to:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('products').select('count');
  if (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  }
  console.log('Connection successful! Found products count:', data);
}

test();
