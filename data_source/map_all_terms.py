import pandas as pd

excel_path = r'c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET\data_source\CONFIRMACIONES 2025.xlsx'

try:
    df = pd.read_excel(excel_path, sheet_name='TARIFAS ', header=None)
    
    terms = ['Walking', 'Welcome', 'Medellin', 'Bogota', 'Bogotá', 'Cartagena']
    
    print(f"Mapping all occurrences in sheet 'TARIFAS ' ({len(df)} rows, {len(df.columns)} columns):")
    
    for term in terms:
        found = []
        for r in range(len(df)):
            for c in range(len(df.columns)):
                val = str(df.iloc[r, c])
                if term.lower() in val.lower():
                    found.append((r, c, val.strip()))
        
        if found:
            print(f"\n--- Matches for '{term}' ({len(found)}) ---")
            # Print only first 10 matches to keep output sane
            for f in found[:20]:
                print(f"Row {f[0]}, Col {f[1]}: {f[2]}")
            if len(found) > 20:
                print(f"... and {len(found)-20} more.")

except Exception as e:
    print(f"Error: {e}")
