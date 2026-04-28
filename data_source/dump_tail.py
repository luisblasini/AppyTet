import pandas as pd

excel_path = r'c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET\data_source\CONFIRMACIONES 2025.xlsx'

try:
    df = pd.read_excel(excel_path, sheet_name='TARIFAS ', header=None)
    
    print(f"Total Rows: {len(df)}")
    
    # Dump rows 150 to the end
    for i in range(150, len(df)):
        row_data = df.iloc[i].tolist()
        print(f"Row {i}: {row_data[:10]}")

except Exception as e:
    print(f"Error: {e}")
