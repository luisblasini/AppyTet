import pandas as pd
import os

file_path = "c:\\Users\\User\\OneDrive\\Escritorio\\PROJETOS\\07_TET\\AppyTET\\data_source\\CONFIRMACIONES 2025.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    print(f"Sheets in {file_path}: {xl.sheet_names}")
    
    for sheet in xl.sheet_names[:3]: # Inspect first 3 sheets
        df = xl.parse(sheet, nrows=50) # Read first 50 rows
        print(f"\n--- Sheet: {sheet} ---")
        print(df.to_string())

except Exception as e:
    print(f"Error inspecting file: {e}")
