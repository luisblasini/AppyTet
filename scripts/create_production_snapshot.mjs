import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function createSnapshot() {
  console.log('--- Inicianco Snapshot de Producción (Supabase) ---');
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error al obtener productos:', error);
    process.exit(1);
  }

  const snapshotPath = path.join(process.cwd(), 'src', 'data', 'production_snapshot.json');
  
  // Guardamos el snapshot para tener una base segura
  fs.writeFileSync(snapshotPath, JSON.stringify(data, null, 2));
  
  console.log(`✓ Snapshot creado con éxito: ${data.length} productos guardados.`);
  console.log(`Ruta: ${snapshotPath}`);
}

createSnapshot();
