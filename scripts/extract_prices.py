import pandas as pd
import json
import os

excel_path = r"c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET\data_source\Cópia de Diario TET 01 .xlsx"
output_path = r"c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET\src\data\prices.json"

# Ensure directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

try:
    # Read the specific sheet and range
    # Lines 1-79 in Excel correspond to rows 0-78 in pandas if no header, 
    # but based on my inspection, row 1 is 'Precificação' and row 2 (index 1) has the actual headers.
    # Let's adjust skip-rows to find the real header.
    
    df = pd.read_excel(excel_path, sheet_name='Precificação por Produto', skiprows=1)
    
    # We want rows that have a code and a price.
    # Based on inspection, the real columns start around index 2.
    # Let's clean the columns
    df = df.iloc[:78] # Limit to line 79 (approx)
    
    # Clean column names (they were Unnamed: X)
    # The first row of this slice contains the real headers.
    df.columns = df.iloc[0]
    df = df[1:] # Drop header row
    
    # Filter only relevant columns
    cols_to_keep = ['Código', 'Passeio', 'Descrição', 'Preço custo (COP)', 'Valor de venda (COP)', 'ENTRADA']
    # Some columns might have slightly different names or extra spaces
    available_cols = df.columns.tolist()
    final_cols = []
    for c in cols_to_keep:
        for actual in available_cols:
            if str(c).strip() == str(actual).strip():
                final_cols.append(actual)
                break
    
    df_clean = df[final_cols].dropna(subset=['Código', 'Passeio'], how='all')
    
    # Convert to numeric where possible
    for col in ['Preço custo (COP)', 'Valor de venda (COP)', 'ENTRADA']:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce').fillna(0)

    # Convert to list of dicts and replace NaN with None for valid JSON
    df_clean = df_clean.where(pd.notnull(df_clean), None)
    data = df_clean.to_dict(orient='records')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully exported {len(data)} products to {output_path}")

except Exception as e:
    print(f"Error: {e}")
