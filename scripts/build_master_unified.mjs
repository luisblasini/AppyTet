/**
 * build_master_unified.mjs V8 — SEPARACIÓN DE HORA Y LOCAL
 * 
 * MAPEO FINAL:
 *   - meet_point (Local) = "Dica" o "Local e hora" (SIN la hora)
 *   - time (Hora) = Extraída y guardada en su propio campo
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const snapshotPath = path.join(ROOT, 'src', 'data', 'production_snapshot.json');
let supabaseProducts = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));

const realCsvPath = path.join(ROOT, 'data_source', 'CSV utfTabla de productos 140426.csv');
const rawData = fs.readFileSync(realCsvPath, 'utf-8');

function cleanBrokenChars(str) {
  if (!str) return '';
  return str.replace(/\uFFFD/g, 'ã')
            .replace(/Porto/g, 'Portão')
            .replace(/Rosrio/g, 'Rosário')
            .replace(/acrscimo/g, 'acréscimo')
            .replace(/carto/g, 'cartão')
            .replace(/assistncia/g, 'assistência')
            .replace(/embarqu/g, 'embarque')
            .replace(/presentar/g, 'apresentar');
}

function parseRealCSV(raw) {
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line.startsWith('"') && line.endsWith('"')) {
      line = line.substring(1, line.length - 1).replace(/""/g, '"');
    }
    const values = parseCSVLine(line);
    if (values.length >= 7) {
      results.push({
        ciudad: values[0],
        nombre: cleanBrokenChars(values[1]),
        venta: values[2],
        custo: values[3],
        localHora: values[5],
        taxas: values[6],
        dica: values[9]
      });
    }
  }
  return results;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

const masterData = parseRealCSV(rawData);

function normalize(name) {
  if (!name) return '';
  return name.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

function safeNum(val) {
  if (!val) return 0;
  const n = parseFloat(String(val).replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function formatCOP(val) {
  return new Intl.NumberFormat('de-DE').format(val);
}

const masterIndex = {};
for (const m of masterData) {
  const key = normalize(m.nombre);
  if (key) masterIndex[key] = m;
}

const aliases = {
  // Islas & Beach Clubs
  "top 3": "top 3 islas",
  "bela": "isla bela",
  "isla bela": "bela",
  "capri": "capri classic",
  "bora bora club": "bora bora beach club",
  "bora bora vip": "bora bora vip",
  "rosario de mar": "rosário de mar",
  "paue": "pa'ue",
  "catamara bona vida": "catamarã bona vida",
  
  // Sunsets & Jantares
  "sibarita master": "sunset sibarita master",
  "sunset bonavida": "sunset catamarã bonavida",
  "jantar fenix": "jantar em fenix beach",
  
  // Tours Terrestres
  "walking tour": "walking tour + visita guiada castillo san felipe em português",
  "aviario": "aviário de cartagena",
  "experiencia culinaria": "experiência culinária"
};

let finalCatalog = [];

for (const sp of supabaseProducts) {
  const name = sp.name || '';
  const normName = normalize(name);
  let m = masterIndex[normName];
  
  if (!m && aliases[normName]) {
    m = masterIndex[normalize(aliases[normName])];
  }

  // Si no hay match, mantenemos los datos de Supabase pero aplicamos limpieza de fees
  if (!m) {
    const fees_value = safeNum(sp.fees_value);
    const fees_info = fees_value > 0 
      ? `Valor Taxas: COP ${formatCOP(fees_value)} em pesos colombianos por pessoa (somente dinheiro) - sujeto a alteração`
      : '';
    
    finalCatalog.push({
      ...sp,
      fees_value: fees_value,
      fees_info: fees_info,
      voucher_obs: sp.voucher_obs || getObs(name)
    });
    continue;
  }

  // --- Si hay MATCH, procesamos logística del CSV ---
  let time = '';
  if (m.localHora && m.localHora.includes(',')) {
    time = m.localHora.split(',').pop().trim();
  }

  const localFinal = m.dica || m.localHora || '';
  const fees_value = safeNum(m.taxas);
  const fees_info = fees_value > 0 
    ? `Valor Taxas: COP ${formatCOP(fees_value)} em pesos colombianos por pessoa (somente dinheiro) - sujeto a alteração`
    : '';

  finalCatalog.push({
    id: sp.id,
    name: sp.name,
    city: m.ciudad || sp.city,
    description: sp.description,
    price_sale: safeNum(sp.price_sale) > 0 ? safeNum(sp.price_sale) : safeNum(m.venta),
    price_cost: safeNum(sp.price_cost) > 0 ? safeNum(sp.price_cost) : safeNum(m.custo),
    price_entry: safeNum(sp.price_entry),
    meet_point: cleanBrokenChars(localFinal),
    time: time || sp.time,
    fees_value: fees_value,
    fees_info: fees_info,
    comments: '',
    has_variable_time: sp.has_variable_tim,
    status: sp.status,
    voucher_obs: getObs(name)
  });
}

function getObs(name) {
  const DEFAULT_BEACH_OBS = "Lembramos que não está permitida a entrada de coolers, alimentos e bebidas alcoólicas nos beach clubes e praias privadas.";
  const VOUCHER_OBS = {
    "top 3": DEFAULT_BEACH_OBS,
    "bela": DEFAULT_BEACH_OBS,
    "capri": DEFAULT_BEACH_OBS,
    "bora bora": DEFAULT_BEACH_OBS,
    "bora vip": DEFAULT_BEACH_OBS + " Apenas para maiores de 18 anos.",
    "rosario de mar": DEFAULT_BEACH_OBS,
    "paue": DEFAULT_BEACH_OBS,
    "isla palma": DEFAULT_BEACH_OBS,
    "pao pao": DEFAULT_BEACH_OBS + " Apenas para mayores de 12 años.",
    "corona": DEFAULT_BEACH_OBS,
    "makani": DEFAULT_BEACH_OBS,
    "fenix": DEFAULT_BEACH_OBS,
    "sabai": DEFAULT_BEACH_OBS,
    "bona vida": DEFAULT_BEACH_OBS,
    "sibarita": DEFAULT_BEACH_OBS,
    "aula de salsa": "Quintas-feiras das 18:00 às 19:00."
  };
  const norm = normalize(name);
  const sorted = Object.entries(VOUCHER_OBS).sort((a, b) => b[0].length - a[0].length);
  for (const [key, obs] of sorted) {
    if (norm.includes(normalize(key))) return obs;
  }
  return '';
}

fs.writeFileSync(path.join(ROOT, 'src', 'data', 'final_master_catalog.json'), JSON.stringify(finalCatalog, null, 2), 'utf-8');

console.log(`\n✅ CATÁLOGO V8 GENERADO`);
