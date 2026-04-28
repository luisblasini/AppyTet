"""
Build Unified Product Database for AppyTET v1.5
Merges pricing from 'Diario TET' with Local/Taxas/Hora from 'CONFIRMACIONES 2025'.
Uses fuzzy matching + manual overrides for name discrepancies.
"""
import pandas as pd
import json
import re
from difflib import SequenceMatcher

# === CONFIG ===
DIARIO_PATH = 'c:/Users/User/OneDrive/Escritorio/PROJETOS/07_TET/AppyTET/data_source/Cópia de Diario TET 01 .xlsx'
CONFIRMACIONES_PATH = 'c:/Users/User/OneDrive/Escritorio/PROJETOS/07_TET/AppyTET/data_source/CONFIRMACIONES 2025.xlsx'
OUTPUT_PATH = 'c:/Users/User/OneDrive/Escritorio/PROJETOS/07_TET/AppyTET/src/data/products_unified.json'

# === MANUAL OVERRIDES for known name mismatches ===
# diario_name_lower -> tarifas_name_lower
MANUAL_MAP = {
    'bona vida islas adulto': 'bonavida',
    'bona vida islas chd - 7 a 14 anos': 'bonavida criança',
    'bona vida sunset adulto': 'bonavida',  # same local info
    'bona vida sunset chd - 7 a 14 anos': 'bonavida criança',
    'bora bora club': 'bora bora bc',
    'bora vip': 'bora bora vip',
    'capri classic': 'coralina isleño',  # Capri -> Coralina mapping
    'capri premium': 'coralina vip',
    'corona island': 'isla del encanto',  # Corona -> Isla del Encanto
    'jantar fenix beach': 'fenix cena',
    'mergulho iniciante': 'mergulho com cilindro primeiro mergulho',
    'mergulho para certificados': 'mergulho com cilindro padi',
    'pao pao': 'pao pao',
    'paue': "pau'e",
    'paue chd 04 a 07 anos': "pau'e criança",
    'isla bela': 'isla bela',
    'isla bela chd - 03 a 10 anos': 'isla bela criança',
    'isla palma': 'isla palma',
    'isla palma chd 04 a 06 anos': 'isla palma',  # no child version in tarifas
    'sabai': 'sabai',
    'sabai chd 5 a 09 anos': 'sabai criança',
    'rosario de mar plan arrecife': 'rosario de mar',
    'rosario de mar plan abanico (open bar)': 'rosario de mar',
    'rosario de mar chd 04 a 07 anos plan arrecife': 'rosário de mar criança',
}

def normalize(name):
    """Normalize name for fuzzy matching"""
    s = name.lower().strip()
    s = re.sub(r'[^a-z0-9\s]', '', s)
    s = re.sub(r'\s+', ' ', s)
    return s

def fuzzy_match(name, candidates, threshold=0.6):
    """Find best fuzzy match"""
    norm = normalize(name)
    best_score = 0
    best_match = None
    for c in candidates:
        score = SequenceMatcher(None, norm, normalize(c)).ratio()
        if score > best_score:
            best_score = score
            best_match = c
    if best_score >= threshold:
        return best_match, best_score
    return None, 0

# === READ DIARIO (Prices) ===
df_d = pd.read_excel(DIARIO_PATH, sheet_name='Cópia de Precificação por Produ', header=None)
diario_products = []
for i in range(3, 83):
    name = str(df_d.iloc[i, 2]) if pd.notna(df_d.iloc[i, 2]) else ''
    if not name or name == 'nan':
        continue
    diario_products.append({
        'Passeio': name.strip(),
        'Descricao': str(df_d.iloc[i, 3]).strip() if pd.notna(df_d.iloc[i, 3]) else '',
        'Preco_custo_COP': float(df_d.iloc[i, 4]) if pd.notna(df_d.iloc[i, 4]) else 0,
        'Valor_venda_COP': float(df_d.iloc[i, 5]) if pd.notna(df_d.iloc[i, 5]) else 0,
        'ENTRADA': float(df_d.iloc[i, 19]) if pd.notna(df_d.iloc[i, 19]) else 0,
    })

# === READ TARIFAS (Local, Taxas, Hora) ===
df_t = pd.read_excel(CONFIRMACIONES_PATH, sheet_name='TARIFAS ', header=None)
tarifa_map = {}
for i in range(2, 80):
    name = str(df_t.iloc[i, 0]) if pd.notna(df_t.iloc[i, 0]) else ''
    if not name or name == 'nan' or name == '-':
        continue
    key = name.strip().lower()
    tarifa_map[key] = {
        'Local': str(df_t.iloc[i, 6]).strip() if pd.notna(df_t.iloc[i, 6]) else '',
        'Taxas_valor': float(df_t.iloc[i, 7]) if pd.notna(df_t.iloc[i, 7]) else 0,
        'Taxas_info': str(df_t.iloc[i, 8]).strip() if pd.notna(df_t.iloc[i, 8]) else '',
        'Hora': str(df_t.iloc[i, 9]).strip() if pd.notna(df_t.iloc[i, 9]) else '',
    }

# === MERGE ===
unified = []
match_log = []
for p in diario_products:
    key = p['Passeio'].lower()
    tarifa = None
    match_type = 'none'
    
    # 1) Exact match
    if key in tarifa_map:
        tarifa = tarifa_map[key]
        match_type = 'exact'
    # 2) Manual override
    elif key in MANUAL_MAP:
        override_key = MANUAL_MAP[key]
        if override_key in tarifa_map:
            tarifa = tarifa_map[override_key]
            match_type = 'manual'
    # 3) Fuzzy match
    if tarifa is None:
        match, score = fuzzy_match(key, tarifa_map.keys(), threshold=0.65)
        if match:
            tarifa = tarifa_map[match]
            match_type = f'fuzzy({score:.2f}→{match})'
    
    if tarifa is None:
        tarifa = {'Local': '', 'Taxas_valor': 0, 'Taxas_info': '', 'Hora': ''}
    
    match_log.append(f"  {match_type:40s} | {p['Passeio']}")
    
    unified.append({
        'Passeio': p['Passeio'],
        'Descricao': p['Descricao'],
        'Valor_venda_COP': p['Valor_venda_COP'],
        'Preco_custo_COP': p['Preco_custo_COP'],
        'ENTRADA': p['ENTRADA'],
        'Local': tarifa['Local'],
        'Taxas_valor': tarifa['Taxas_valor'],
        'Taxas_info': tarifa['Taxas_info'],
        'Hora': tarifa['Hora'],
        'Comentarios': ''
    })

# Also add TARIFAS-only products not in Diario (e.g. Aula de Salsa, Fenix, etc.)
diario_keys = {p['Passeio'].lower() for p in diario_products}
manual_values = set(MANUAL_MAP.values())
for tkey, tval in tarifa_map.items():
    # Skip if already matched
    already = False
    for dk in diario_keys:
        if dk == tkey or MANUAL_MAP.get(dk) == tkey:
            already = True
            break
        _, score = fuzzy_match(dk, [tkey], threshold=0.65)
        if score >= 0.65:
            already = True
            break
    if not already:
        unified.append({
            'Passeio': tkey.title(),  # capitalize for display
            'Descricao': '',
            'Valor_venda_COP': 0,
            'Preco_custo_COP': 0,
            'ENTRADA': 0,
            'Local': tval['Local'],
            'Taxas_valor': tval['Taxas_valor'],
            'Taxas_info': tval['Taxas_info'],
            'Hora': tval['Hora'],
            'Comentarios': 'TARIFAS-only (precio pendiente)'
        })
        match_log.append(f"  {'tarifas-only':40s} | {tkey.title()}")

# Save
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(unified, f, ensure_ascii=False, indent=2)

# Summary
matched = sum(1 for u in unified if u['Local'] or u['Taxas_valor'] or u['Hora'])
print(f"=== UNIFIED DB CREATED ===")
print(f"Total products: {len(unified)}")
print(f"Products with TARIFAS data: {matched}/{len(unified)}")
print(f"\n=== MATCH LOG ===")
for l in match_log:
    print(l)
