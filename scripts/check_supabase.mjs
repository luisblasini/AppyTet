import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProducts() {
  const { data, error } = await supabase.from('products').select('id, name, price_sale, meet_point, fees_info');
  if (error) {
    console.error(error);
    return;
  }
  console.log("--- PRODUCTOS EN SUPABASE ---");
  data.forEach(p => {
    console.log(`[${p.id}] ${p.name} - Local: ${p.meet_point || 'VACÍO'}`);
  });
}

checkProducts();
