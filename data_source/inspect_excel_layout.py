import pandas as pd

excel_path = r'c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET\data_source\CONFIRMACIONES 2025.xlsx'

try:
    df = pd.read_excel(excel_path, sheet_name='TARIFAS ', header=None)
    
    # Print a grid of the first 20 rows and 30 columns to see the layout
    print("Excel Layout (First 20 rows, 30 columns):")
    sample = df.iloc[:20, :30].fillna('-')
    print(sample.to_string())
    
    # Search for city markers
    cities = ['CARTAGENA', 'BOGOTA', 'MEDELLIN', 'SANTA MARTA']
    for city in cities:
        results = []
        for r in range(min(100, len(df))):
            for c in range(min(50, len(df.columns))):
                val = str(df.iloc[r, c]).upper()
                if city in val:
                    results.append((r, c, df.iloc[r, c]))
        if results:
            print(f"\nFound {city} markers at:")
            for res in results:
                print(f"Row {res[0]}, Col {res[1]}: {res[2]}")

except Exception as e:
    print(f"Error: {e}")
