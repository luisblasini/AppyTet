import pandas as pd
excel_path = 'c:/Users/User/OneDrive/Escritorio/PROJETOS/07_TET/AppyTET/data_source/CONFIRMACIONES 2025.xlsx'
df = pd.read_excel(excel_path, sheet_name='Voucher')
df.to_csv('voucher_sheet_dump.csv', index=False)
print("Voucher sheet dumped to voucher_sheet_dump.csv")
