import pandas as pd
import json

excel_path = r'c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET\data_source\CONFIRMACIONES 2025.xlsx'
output_json = r'c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET\data_source\import_products.json'

try:
    df = pd.read_excel(excel_path, sheet_name='TARIFAS ', skiprows=0)
    
    # Mapping based on inspection:
    # '1': Passeio
    # ' $  6 ': Textos/Comentarios
    # '7': Local
    # '9': Taxas_info
    # ' $  10 ': Hora
    
    products_list = []
    
    for _, row in df.iterrows():
        name = str(row['1']).strip()
        if name == 'nan' or not name or name == 'Passeio' or name == 'TET': # Skip headers/empty
            continue
            
        # Clean data
        to_title_case = lambda s: ' '.join(w.capitalize() for w in str(s).split())
        
        product = {
            "Passeio": name, # Keep original or Title Case? User said Title Case is preferred
            "Local": str(row['7']) if str(row['7']) != 'nan' else "",
            "Hora": str(row[' $  10 ']) if str(row[' $  10 ']) != 'nan' else "",
            "Taxas_info": str(row['9']) if str(row['9']) != 'nan' else "",
            "Comentarios": str(row[' $  6 ']) if str(row[' $  6 ']) != 'nan' else "",
            # Initialize prices as 0 or null as we won't import them from here
            "Valor_venda_COP": 0,
            "ENTRADA": 0,
            "Preco_custo_COP": 0,
            "Taxas_valor": 0
        }
        
        # Basic cleanup for Hora (sometimes Excel adds date)
        if len(product["Hora"]) > 5 and ":" in product["Hora"]:
             # Try to extract just HH:MM
             import re
             m = re.search(r'(\d{1,2}:\d{2})', product["Hora"])
             if m: product["Hora"] = m.group(1)

        products_list.append(product)

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(products_list, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully generated {len(products_list)} products in {output_json}")

except Exception as e:
    print(f"Error: {e}")
