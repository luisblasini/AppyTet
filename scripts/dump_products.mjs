import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspectSchema() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Columns found in 'products' table:");
    console.log(Object.keys(data[0]));
    console.log("\nSample data (first row):");
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log("No data found in 'products' table.");
  }
}

inspectSchema();
