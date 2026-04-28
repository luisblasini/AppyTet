import pandas as pd
import os

files = ["Cópia de Diario TET 01 .xlsx", "CONFIRMACIONES 2025.xlsx"]
base_path = r"c:\Users\User\OneDrive\Escritorio\PROJETOS\07_TET\AppyTET\data_source"

output = []

for file in files:
    full_path = os.path.join(base_path, file)
    output.append(f"\n{'='*30}\nFILE: {file}\n{'='*30}")
    try:
        xl = pd.ExcelFile(full_path)
        output.append(f"Sheets found: {xl.sheet_names}")
        
        # Analyze each sheet
        for sheet in xl.sheet_names:
            df = pd.read_excel(full_path, sheet_name=sheet)
            output.append(f"\n--- SHEET: {sheet} ---")
            output.append(f"Shape: {df.shape}")
            output.append(f"Columns: {df.columns.tolist()}")
            # Show first 3 non-empty rows
            sample = df.dropna(how='all').head(3)
            output.append(f"Sample data:\n{sample.to_string(index=False)}")
            output.append("-" * 20)
            
    except Exception as e:
        output.append(f"Error reading {file}: {str(e)}")

# Write results to a text file for easy reading
with open(os.path.join(base_path, "inspection_results.txt"), "w", encoding='utf-8') as f:
    f.write("\n".join(output))

print("Inspection complete. Results written to inspection_results.txt")
