import json
import re

with open("C:/Users/rog/OneDrive/Desktop/Circuitly/scratch/lingo_quest/js/services/DataService.js", "r", encoding="utf8") as f:
    ds_content = f.read()
    
with open("C:/Users/rog/OneDrive/Desktop/Circuitly/scratch/lingo_quest/questions/QuestionBank.csv", "r", encoding="utf8") as f:
    csv_content = f.read()

# I want to test if parseCSV throws. I will write a simple python parser based on the logic in DataService.js to see if it loops forever or crashes.

def parseCSV(text):
    lines = [l for l in text.split('\n') if l.strip()]
    if len(lines) < 2: return []
    headers = [h.strip().replace('\r', '') for h in lines[0].split(',')]
    
    questions = []
    
    for idx, line in enumerate(lines[1:]):
        try:
            values = []
            inQuote = False
            current = ''
            i = 0
            while i < len(line):
                char = line[i]
                if char == '"' and i+1 < len(line) and line[i+1] == '"':
                    current += '"'
                    i += 1
                elif char == '"':
                    inQuote = not inQuote
                elif char == ',' and not inQuote:
                    values.append(current.strip().replace('\r', ''))
                    current = ''
                else:
                    current += char
                i += 1
            values.append(current.strip().replace('\r', ''))
            
            row = {}
            for i_h, h in enumerate(headers):
                val = values[i_h] if i_h < len(values) else ''
                if val.startswith('"') and val.endswith('"'):
                    val = val[1:-1]
                row[h] = val
        except Exception as e:
            print(f"Error on line {idx}: {line}")
            print(e)
            return

    print("Success, lines parsed:", len(lines)-1)

parseCSV(csv_content)
