import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan las credenciales de Supabase en el archivo .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncDirectFromCsv() {
  const csvPath = path.resolve('data_source/CSV utfTabla de productos 140426.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`No se encontró el archivo CSV en: ${csvPath}`);
    process.exit(1);
  }

  // Leemos con latin1 para evitar errores de caracteres especiales en Windows
  const content = fs.readFileSync(csvPath, 'latin1'); 
  const lines = content.split('\n').filter(l => l.trim() !== '');

  console.log(`Leídas ${lines.length} líneas. Sincronizando textos y VALORES ECONÓMICOS...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    
    // Split por coma, intentando manejar comillas simples
    const columns = row.split(',').map(c => c.replace(/^"|"$/g, '').trim());
    
    if (columns.length < 9) continue;
    
    const name = columns[1];
    if (!name || name === 'Passeio') continue;

    // Mapeo detallado
    const price_sale = parseFloat(columns[2]) || 0;
    const price_entry = parseFloat(columns[3]) || 0;
    const price_cost = parseFloat(columns[4]) || 0;
    const meet_point = columns[5] !== "No informado" ? columns[5] : "";
    const fees_value = parseFloat(columns[6]) || 0;
    const time = columns[7] !== "No informado" ? columns[7] : "";
    const fees_info = columns[8] !== "No informado" ? columns[8] : "";
    const comments = columns[9] !== "No informado" ? columns[9] : "";

    console.log(`-> Procesando: ${name} (Taxa: ${fees_value}, Venda: ${price_sale})`);

    // Actualización en Supabase
    // Buscamos coincidencia exacta o parecida
    const { data: existing, error: findError } = await supabase
      .from('products')
      .select('id')
      .ilike('name', name);

    if (findError) {
      console.error(`Error buscando ${name}:`, findError.message);
      continue;
    }

    if (existing && existing.length > 0) {
      const productId = existing[0].id;
      
      const { error: updateError } = await supabase
        .from('products')
        .update({
          price_sale: price_sale,
          price_entry: price_entry,
          price_cost: price_cost,
          meet_point: meet_point,
          fees_value: fees_value,
          time: time,
          fees_info: fees_info,
          comments: comments
        })
        .eq('id', productId);

      if (updateError) {
        console.error(`Error actualizando ${name}:`, updateError.message);
        errorCount++;
      } else {
        successCount++;
      }
    } else {
      console.log(`⚠️ Ignorado (No en BD): ${name}`);
    }
  }

  console.log(`\n✅ FINALIZADO`);
  console.log(`Productos actualizados en Supabase: ${successCount}`);
  console.log(`Errores: ${errorCount}`);
  console.log(`\nNOTA: Ejecuta 'node scripts/sync_csv_direct.mjs' para aplicar los cambios.`);
}

syncDirectFromCsv();
