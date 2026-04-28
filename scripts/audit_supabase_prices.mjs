import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkPrices() {
  console.log("--- AUDITANDO PRODUCTOS EN SUPABASE ---");
  const { data, error } = await supabase.from('products').select('*');
  
  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Encontrados ${data.length} productos.`);
  data.forEach(p => {
    console.log(`ID: ${p.id} | Nombre: ${p.name} | Tasa Actual: ${p.fees_value} | Tasa Info: ${p.fees_info}`);
  });
}

checkPrices();
