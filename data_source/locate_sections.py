import pandas as pd

excel_path = r'c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET\data_source\CONFIRMACIONES 2025.xlsx'

try:
    df = pd.read_excel(excel_path, sheet_name='TARIFAS ', header=None)
    cities = ['CARTAGENA', 'BOGOTA', 'MEDELLIN', 'SANTA MARTA', 'WALKING']
    
    with open('found_sections.txt', 'w', encoding='utf-8') as f:
        f.write(f"Sheet size: {len(df)} rows, {len(df.columns)} columns\n")
        for city in cities:
            for r in range(len(df)):
                row_vals = [str(x).upper() for x in df.iloc[r].tolist()]
                if any(city in val for val in row_vals):
                    f.write(f"Marker for {city} at row {r}: {row_vals}\n")
    print("Results written to found_sections.txt")

except Exception as e:
    print(f"Error: {e}")
