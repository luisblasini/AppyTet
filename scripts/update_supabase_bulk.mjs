import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateSupabase() {
  const dataPath = path.resolve('src/data/products_unified.json');
  const products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`Starting update of ${products.length} products to Supabase...`);

  for (const product of products) {
    // Only update if it has an ID
    if (!product.ID && !product.id) continue;
    
    const productId = product.ID || product.id;

    const { error } = await supabase
      .from('products')
      .update({
        meet_point: product.Local || '',
        time: product.Hora || '',
        fees_value: Number(product.Taxas_valor) || 0,
        fees_info: product.Taxas_info || ''
      })
      .eq('id', productId);

    if (error) {
      console.error(`Error updating product ${productId}:`, error.message);
    } else {
      console.log(`✅ Updated product ${productId} (${product.Passeio})`);
    }
  }

  console.log('Update finished!');
}

updateSupabase();
