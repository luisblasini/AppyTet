import csv

csv_path = r'c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET_v5\data_source\CSV utfTabla de productos 140426.csv'
try:
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        print("Header:", header)
        for i, row in enumerate(reader):
            if any("Bora" in cell for cell in row):
                print(f"Row {i}:", row)
except Exception as e:
    print("Error:", e)
