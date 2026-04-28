import pandas as pd

excel_path = r'c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET\data_source\CONFIRMACIONES 2025.xlsx'
try:
    xl = pd.ExcelFile(excel_path)
    if 'TARIFAS ' in xl.sheet_names:
        df = pd.read_excel(excel_path, sheet_name='TARIFAS ', nrows=60)
        # Find a row that has text in the 'Unnamed' columns
        sample_row = df[df['Unnamed: 13'].notna()].iloc[0].to_dict()
        print("Detailed Row Mapping:")
        for k, v in sample_row.items():
            print(f"{k}: {v}")
        
        # Save unique product names for later
        products = df['1'].dropna().unique().tolist()
        print(f"\nTotal products found in Excel: {len(products)}")
    else:
        print(f"Sheet 'Tarifas' not found. Available sheets: {xl.sheet_names}")
except Exception as e:
    print(f"Error: {e}")
