"""
Sync Script: Converts products_master.csv -> products_unified.json
Run this after editing the CSV (from Google Sheets or Excel).
Usage: python scripts/sync_csv_to_json.py
"""
import csv
import json

CSV_PATH = 'src/data/products_master.csv'
JSON_PATH = 'src/data/products_unified.json'

def sync():
    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        products = []
        for row in reader:
            products.append({
                'ID': row.get('ID', ''),
                'Passeio': row.get('Passeio', ''),
                'Ciudad': row.get('Ciudad', 'Cartagena'),
                'Descricao': row.get('Descricao', ''),
                'Valor_venda_COP': float(row.get('Valor_venda_COP', 0) or 0),
                'Preco_custo_COP': float(row.get('Preco_custo_COP', 0) or 0),
                'ENTRADA': float(row.get('ENTRADA', 0) or 0),
                'Local': row.get('Local', ''),
                'Hora': row.get('Hora', ''),
                'Taxas_valor': float(row.get('Taxas_valor', 0) or 0),
                'Taxas_info': row.get('Taxas_info', ''),
                'Comentarios': row.get('Comentarios', ''),
            })
    
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    
    print(f'Synced {len(products)} products from CSV -> JSON')
    print(f'  CSV: {CSV_PATH}')
    print(f'  JSON: {JSON_PATH}')

if __name__ == '__main__':
    sync()
