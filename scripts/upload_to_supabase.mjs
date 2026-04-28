/**
 * upload_to_supabase.mjs — Subida del Catálogo Maestro Unificado a Supabase
 * 
 * LEE: final_master_catalog.json
 * ESCRIBE: Realiza UPSERT (Inserta o Actualiza) cada producto en la tabla 'products'
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function askConfirmation(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function uploadCatalog() {
  const catalogPath = path.join(ROOT, 'src', 'data', 'final_master_catalog.json');
  
  if (!fs.existsSync(catalogPath)) {
    console.error('✗ No se encontró final_master_catalog.json.');
    process.exit(1);
  }
  
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  console.log(`\n📦 Catálogo cargado: ${catalog.length} productos.`);
  
  const answer = await askConfirmation(`\n¿Confirmas el UPSERT de ${catalog.length} productos a Supabase (IDs numéricos)? (s/n): `);
  if (answer !== 's' && answer !== 'si' && answer !== 'y') {
    console.log('Operación cancelada.');
    process.exit(0);
  }
  
  console.log('\n--- Sincronizando con Supabase (Modo Tabula Rasa) ---\n');
  
  let processed = 0;
  let errors = 0;
  
  for (const product of catalog) {
    const upsertData = {
      id: product.id,
      name: product.name,
      city: product.city,
      description: product.description || '',
      price_sale: product.price_sale,
      price_cost: product.price_cost,
      price_entry: product.price_entry,
      meet_point: product.meet_point || '',
      time: product.time || '',
      fees_value: product.fees_value,
      fees_info: product.fees_info || '',
      comments: product.comments || '',
      has_variable_time: product.has_variable_time,
      voucher_obs: product.voucher_obs || '',
      status: product.status || 'active',
    };
    
    const { error } = await supabase
      .from('products')
      .upsert(upsertData);
    
    if (error) {
      console.error(`  ✗ ${product.name} (${product.id}): ${error.message}`);
      errors++;
    } else {
      console.log(`  ✓ ${product.name} (${product.id})`);
      processed++;
    }
  }
  
  console.log(`\n═══════════════════════════════════════`);
  console.log(`✅ Proceso completado.`);
  console.log(`   Procesados: ${processed}`);
  console.log(`   Errores:    ${errors}`);
  console.log(`═══════════════════════════════════════\n`);
}

uploadCatalog();
