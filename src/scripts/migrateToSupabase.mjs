import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://qyvnyntktdqypmkktwwo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5dm55bnRrdGRxeXBta2t0d3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNDk3MzIsImV4cCI6MjA4ODYyNTczMn0.ur66Jsyd9aKKtglDiinJhzn2xa9D1SkY_ukdJyVXCtg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const products = JSON.parse(
  readFileSync(join(__dirname, '../data/products_unified.json'), 'utf8')
);

const mapped = products.map(p => ({
  id:          p.ID,
  name:        p.Passeio,
  city:        p.Ciudad || 'Cartagena',
  description: p.Descricao || '',
  price_sale:  p.Valor_venda_COP || 0,
  price_cost:  p.Preco_custo_COP || 0,
  price_entry: p.ENTRADA || 0,
  meet_point:  (p.Local && p.Local !== '0') ? p.Local : '',
  time:        (p.Hora && p.Hora !== '0') ? p.Hora : '',
  fees_value:  p.Taxas_valor || 0,
  fees_info:   p.Taxas_info || '',
  comments:    p.Comentarios || '',
  status:      p.Valor_venda_COP > 0 ? 'active' : 'tariff_only',
}));

// Deduplicate by name (keep last occurrence) to avoid ON CONFLICT errors
const seen = new Map();
mapped.forEach(p => seen.set(p.name, p));
const deduped = Array.from(seen.values());

console.log(`Migrando ${deduped.length} produtos únicos para Supabase (de ${mapped.length} total)...`);

const { data, error } = await supabase
  .from('products')
  .upsert(deduped, { onConflict: 'name' });


if (error) {
  console.error('❌ Erro na migracao:', error.message);
  process.exit(1);
}

console.log(`✅ Migração concluída! ${mapped.length} produtos inseridos/atualizados.`);
console.log('Verificando...');

const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
console.log(`Total na base Supabase: ${count} produtos`);
