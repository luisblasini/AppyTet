import pandas as pd
import json

excel_path = 'c:/Users/User/OneDrive/Escritorio/PROJETOS/07_TET/AppyTET/data_source/CONFIRMACIONES 2025.xlsx'

# Read Voucher sheet
df_voucher = pd.read_excel(excel_path, sheet_name='Voucher', header=None)
print("--- VOUCHER SHEET (Top 50 rows) ---")
print(df_voucher.head(50).to_string())

# Read TARIFAS sheet to get texts
df_tarifas = pd.read_excel(excel_path, sheet_name='TARIFAS ') # Note the space in name
print("\n--- TARIFAS SHEET (Selected Columns) ---")
# The column names might be numbers as seen in inspection_results
# 1: Name, 3: TET, 4: PVP, 5: ENTRADA, $ 6: TEXTOS, 7: LOCAL, $ 8: VALOR TAXAS, 9: TEXTO TAXAS, $ 10: HORA
print(df_tarifas.columns.tolist())
print(df_tarifas.head(10).to_string())
