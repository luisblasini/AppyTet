import pandas as pd
import sys

# Set display options to show more columns and rows
pd.set_option('display.max_columns', None)
pd.set_option('display.max_rows', None)

file_path = "c:\\Users\\User\\OneDrive\\Escritorio\\PROJETOS\\07_TET\\AppyTET\\data_source\\CONFIRMACIONES 2025.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    sheet_name = 'Voucher'
    
    # Analyze the 'Voucher' sheet
    df = xl.parse(sheet_name, header=None, nrows=60)
    
    print(f"\n--- Layout of {sheet_name} (First 60 rows) ---")
    df_filled = df.fillna("")
    print(df_filled.to_string())

except Exception as e:
    print(f"Error: {e}")
