import csv
import json

csv_path = r'c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET_v5\data_source\CSV utfTabla de productos 140426.csv'
try:
    with open(csv_path, 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        rows = list(reader)
        print("Total rows:", len(rows))
        for i in range(min(5, len(rows))):
            print(f"Row {i}:", json.dumps(rows[i], ensure_ascii=False))
except Exception as e:
    print(f"Error reading with latin-1: {e}")
