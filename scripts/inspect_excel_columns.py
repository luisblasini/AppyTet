
import pandas as pd

excel_path = 'c:/Users/User/OneDrive/Escritorio/PROJETOS/07_TET/AppyTET/data_source/Cópia de Diario TET 01 .xlsx'
sheet_name = 'Cópia de Precificação por Produ'

print(f"Reading: {excel_path} - Sheet: {sheet_name}")
df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)

# Expected Header Row is Index 2 (Row 3 in Excel)
header_row_idx = 2
header = df.iloc[header_row_idx]

print("\n=== HEADER ROW (Index 2) ===")
for i, val in enumerate(header):
    if pd.notna(val):
        print(f"Col {i}: {val}")

# Data Row (Index 3)
data_row_idx = 3
data = df.iloc[data_row_idx]
print("\n=== DATA ROW (Index 3) ===")
for i, val in enumerate(data):
    if pd.notna(val):
        print(f"Col {i}: {val}")

