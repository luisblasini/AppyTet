import pandas as pd

excel_path = r'c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET\data_source\CONFIRMACIONES 2025.xlsx'

try:
    xl = pd.ExcelFile(excel_path)
    if 'TARIFAS ' in xl.sheet_names:
        df = pd.read_excel(excel_path, sheet_name='TARIFAS ')
        
        # Search for specific terms in column '1'
        search_terms = ['Walking', 'Welcome', 'Medellin', 'Bogotá', 'Bogota']
        
        print("Searching in column '1' (P passeios):")
        for term in search_terms:
            matches = df[df['1'].astype(str).str.contains(term, case=False, na=False)]
            print(f"Match for '{term}': {len(matches)}")
            if not matches.empty:
                print(matches['1'].tolist())
        
        # Check if they are in other columns? 
        # Sometimes there are different sections side by side
        print("\nChecking first 5 columns for 'Medellin':")
        for col in df.columns[:10]:
            matches = df[df[col].astype(str).str.contains('Medellin', case=False, na=False)]
            if not matches.empty:
                print(f"Col '{col}' has {len(matches)} matches")

except Exception as e:
    print(f"Error: {e}")
