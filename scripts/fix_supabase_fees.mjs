import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function updateFees() {
  console.log("--- ACTUALIZANDO TASAS EN SUPABASE ---");
  
  const { data: products, error: fetchError } = await supabase.from('products').select('*');
  
  if (fetchError) {
    console.error("Error fetching products:", fetchError);
    return;
  }

  for (const p of products) {
    let newFee = null;
    const name = p.name.toLowerCase();

    if (name.includes('top 3 islas')) {
      newFee = 40000;
    } else if (
      name.includes('capri') || 
      name.includes('pa\'ue') || 
      name.includes('pao pao') || 
      name.includes('bora bora') || 
      name.includes('rosário de mar') || 
      name.includes('bela') || 
      name.includes('isla palma')
    ) {
      newFee = 31500;
    } else if (name.includes('fenix beach')) {
      newFee = 16000;
    } else if (name.includes('makani')) {
      newFee = 14000;
    } else if (name.includes('sunset sibarita')) {
      newFee = 18000;
    }

    if (newFee !== null) {
      console.log(`Actualizando ${p.name}: ${p.fees_value} -> ${newFee}`);
      const { error: updateError } = await supabase
        .from('products')
        .update({ fees_value: newFee })
        .eq('id', p.id);
      
      if (updateError) {
        console.error(`Error en ${p.name}:`, updateError.message);
      }
    }
  }
  console.log("--- FINALIZADO ---");
}

updateFees();
