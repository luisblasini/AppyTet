"""
Create Master CSV from products_unified.json
Adds ID and Ciudad columns for Phase 3 migration.
"""
import json
import csv

INPUT = 'c:/Users/User/OneDrive/Escritorio/PROJETOS/07_TET/AppyTET/src/data/products_unified.json'
OUTPUT = 'c:/Users/User/OneDrive/Escritorio/PROJETOS/07_TET/AppyTET/src/data/products_master.csv'

with open(INPUT, 'r', encoding='utf-8') as f:
    products = json.load(f)

# Auto-detect Ciudad based on product name keywords
BOGOTA_KEYWORDS = ['bog', 'monserrate', 'catedral de sal', 'guatavita', 'finca cafeteira', 'zipaquira']
MEDELLIN_KEYWORDS = ['medellin', 'medellín', 'guatape', 'comuna']

def detect_city(name):
    lower = name.lower()
    for kw in BOGOTA_KEYWORDS:
        if kw in lower:
            return 'Bogotá'
    for kw in MEDELLIN_KEYWORDS:
        if kw in lower:
            return 'Medellín'
    return 'Cartagena'  # Default

# Build master list with IDs
CSV_COLUMNS = ['ID', 'Passeio', 'Ciudad', 'Descricao', 'Valor_venda_COP', 'Preco_custo_COP', 
               'ENTRADA', 'Local', 'Hora', 'Taxas_valor', 'Taxas_info', 'Comentarios']

rows = []
for i, p in enumerate(products, start=1):
    row = {
        'ID': f'PROD-{i:03d}',
        'Passeio': p.get('Passeio', ''),
        'Ciudad': detect_city(p.get('Passeio', '')),
        'Descricao': p.get('Descricao', ''),
        'Valor_venda_COP': p.get('Valor_venda_COP', 0),
        'Preco_custo_COP': p.get('Preco_custo_COP', 0),
        'ENTRADA': p.get('ENTRADA', 0),
        'Local': p.get('Local', ''),
        'Hora': p.get('Hora', ''),
        'Taxas_valor': p.get('Taxas_valor', 0),
        'Taxas_info': p.get('Taxas_info', ''),
        'Comentarios': p.get('Comentarios', ''),
    }
    rows.append(row)

with open(OUTPUT, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
    writer.writeheader()
    writer.writerows(rows)

print(f'Master CSV created: {OUTPUT}')
print(f'Total products: {len(rows)}')

# Summary by city
from collections import Counter
cities = Counter(r['Ciudad'] for r in rows)
for city, count in cities.items():
    print(f'  {city}: {count} products')
