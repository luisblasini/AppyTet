import pandas as pd

excel_path = r'c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET\data_source\CONFIRMACIONES 2025.xlsx'

try:
    df = pd.read_excel(excel_path, sheet_name='TARIFAS ', header=None)
    
    cities = ['CARTAGENA', 'BOGOTA', 'MEDELLIN', 'SANTA MARTA', 'WALKING']
    
    print(f"Sheet size: {len(df)} rows, {len(df.columns)} columns")
    
    for city in cities:
        for r in range(len(df)):
            row_vals = [str(x).upper() for x in df.iloc[r].tolist()]
            # If a row is mostly empty but contains a city name, it's likely a header
            if any(city in val for val in row_vals):
                print(f"Potential marker for {city} at row {r}: {row_vals}")

except Exception as e:
    print(f"Error: {e}")
