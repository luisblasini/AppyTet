import pandas as pd
import sys

# Set display options to show more columns and rows
pd.set_option('display.max_columns', None)
pd.set_option('display.max_rows', None)
pd.set_option('display.width', 1000)

file_path = "c:\\Users\\User\\OneDrive\\Escritorio\\PROJETOS\\07_TET\\AppyTET\\data_source\\CONFIRMACIONES 2025.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    print(f"Sheets: {xl.sheet_names}")
    
    # Analyze the first sheet which likely contains the voucher template
    sheet_name = xl.sheet_names[0]
    df = xl.parse(sheet_name, header=None, nrows=40)
    
    print(f"\n--- Layout of {sheet_name} (First 40 rows) ---")
    # Replace NaN with empty string for better readability
    df_filled = df.fillna("")
    print(df_filled.to_string())

except Exception as e:
    print(f"Error: {e}")
