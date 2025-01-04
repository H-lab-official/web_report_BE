import pandas as pd

# Read the JSON file
input_file = '/path/to/your/data.json'  # Replace with your file path
data = pd.read_json(input_file)

# Convert JSON data to DataFrame
df = pd.DataFrame(data)

# Save DataFrame to Excel
output_file = '/path/to/output/logs_data.xlsx'  # Replace with desired output path
df.to_excel(output_file, index=False)

print(f"Excel file saved to {output_file}")
