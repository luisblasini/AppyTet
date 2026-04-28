import csv

csv_path = r'c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET_v5\data_source\CSV utfTabla de productos 140426.csv'
tours_to_find = ["Bora Bora", "Paue", "Aviario", "Top 3"]

# Probamos con utf-8 o utf-16 ya que el nombre dice "utf"
encodings = ['utf-8', 'utf-16', 'latin-1']

for enc in encodings:
    try:
        with open(csv_path, 'r', encoding=enc) as f:
            content = f.read()
            if not content: continue
            print(f"--- Probando encoding: {enc} ---")
            lines = content.split('\n')
            for line in lines:
                for tour in tours_to_find:
                    if tour.lower() in line.lower():
                        print(line.strip())
            # Si encontramos algo, paramos
            if "Bora" in content:
                break
    except Exception as e:
        print(f"Error con {enc}: {e}")
