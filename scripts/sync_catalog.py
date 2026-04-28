import json
import os

filepath = r'c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET_v5\src\data\products_unified.json'

with open(filepath, 'r', encoding='utf-8') as f:
    products = json.load(f)

# 1. Update Existing
for p in products:
    # Bogota: Catedral de Sal
    if p['ID'] == 'PROD-003': 
        p['Valor_venda_COP'] = 480000
        p['ENTRADA'] = 116800 # (Keep existing entrada percentage if possible, but user asked for portfolio price)
    
    # Cartagena: Sibarita
    if p['ID'] == 'PROD-105':
        p['Taxas_valor'] = 18000
    
    # Cartagena: Experiencia Culinaria
    if p['ID'] == 'PROD-064':
        p['Valor_venda_COP'] = 420000
        p['ENTRADA'] = 120000
        p['Comentarios'] = ''

# 2. Add Medellin (if not exists)
medellin_tours = [
    {"ID": "PROD-121", "Passeio": "City Tour Panorâmico", "Ciudad": "Medellín", "Valor_venda_COP": 250000, "Preco_custo_COP": 150000, "ENTRADA": 100000},
    {"ID": "PROD-122", "Passeio": "Comuna 13 - Grafiti Tour", "Ciudad": "Medellín", "Valor_venda_COP": 350000, "Preco_custo_COP": 210000, "ENTRADA": 140000},
    {"ID": "PROD-123", "Passeio": "Tour Não Dizemos seu Nome", "Ciudad": "Medellín", "Valor_venda_COP": 300000, "Preco_custo_COP": 180000, "ENTRADA": 120000},
    {"ID": "PROD-124", "Passeio": "Guatapé - Dia Inteiro", "Ciudad": "Medellín", "Valor_venda_COP": 400000, "Preco_custo_COP": 240000, "ENTRADA": 160000},
    {"ID": "PROD-125", "Passeio": "Tour de Café", "Ciudad": "Medellín", "Valor_venda_COP": 340000, "Preco_custo_COP": 204000, "ENTRADA": 136000}
]

existing_ids = {p['ID'] for p in products}
for mt in medellin_tours:
    if mt['ID'] not in existing_ids:
        # Fill missing fields
        for field in ["Descricao", "Local", "Hora", "Taxas_valor", "Taxas_info", "Comentarios"]:
            if field not in mt: mt[field] = ""
        products.append(mt)

# 3. Alphabetical Sort
products.sort(key=lambda x: (x.get('Passeio') or x.get('name') or '').lower())

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"Update complete. Total products: {len(products)}")
