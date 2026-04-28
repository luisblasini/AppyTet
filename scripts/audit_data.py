
import pandas as pd
import json

# === 1. Check Source Excel (Diario TET) ===
EXCEL_PATH = 'c:/Users/User/OneDrive/Escritorio/PROJETOS/07_TET/AppyTET/data_source/Cópia de Diario TET 01 .xlsx'

print(f"Reading: {EXCEL_PATH}")
df = pd.read_excel(EXCEL_PATH, sheet_name='Cópia de Precificação por Produ', header=None)

print("\n=== RAW EXCEL VIEW (Rows 0-5, Cols 0-8) ===")
print(df.iloc[0:6, 0:9].to_string())

# Check column at index 6 (G) - Is it really ENTRADA?
# 0=A, 1=B, 2=C, 3=D, 4=E, 5=F, 6=G, 7=H, 8=I
# Expected:
# Col 2 (C): Passeio
# Col 5 (F): Valor venda
# Col 6 (G): ENTRADA?

print("\n=== Header Row (Index 2) ===")
print(df.iloc[2].values)

print("\n=== Sample Data Row (Index 3) ===")
print(df.iloc[3].values)

# === 2. Check Generated JSON DB ===
JSON_PATH = 'c:/Users/User/OneDrive/Escritorio/PROJETOS/07_TET/AppyTET/src/data/products_unified.json'
with open(JSON_PATH, 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"\n=== JSON PRODUCTS CHECK (File: {JSON_PATH}) ===")
print(f"Total Products: {len(products)}")
for p in products[:5]:
    venda = p.get('Valor_venda_COP', 0)
    entrada = p.get('ENTRADA', 0)
    saldo_unit = venda - entrada
    print(f"  {p['Passeio']}: Venda={venda}, Entrada={entrada}, SaldoUnit={saldo_unit}")

