import csv
import io

def process_file(file_path, is_js=False):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    
    new_lines = []
    
    if is_js:
        new_lines.append('window.QuestionBankData = `id,topicId,question,optionA,optionB,optionC,answer,image,explanation,difficulty')
        start_idx = 1
    else:
        new_lines.append('id,topicId,question,optionA,optionB,optionC,answer,image,explanation,difficulty')
        start_idx = 1
        
    topic_items = {}
    
    # First pass to group by topic
    for i in range(start_idx, len(lines)):
        line = lines[i]
        if line.strip() == '' or line.strip() == '`;':
            continue
            
        f_in = io.StringIO(line)
        reader = csv.reader(f_in)
        for r in reader:
            row = r
            break
            
        topicId = int(row[1])
        if topicId not in topic_items:
            topic_items[topicId] = []
        topic_items[topicId].append((i, row))
        
    # Assign difficulties
    difficulties = {}
    for topicId, items in topic_items.items():
        n = len(items)
        chunk = n // 3
        # Ensure minimum 1 question per chunk if possible, or just exact division
        for idx, (original_i, row) in enumerate(items):
            if idx < chunk:
                diff = 1
            elif idx < 2 * chunk:
                diff = 2
            else:
                diff = 3
            if n < 3:
                diff = 1
            difficulties[original_i] = diff
            
    # Second pass to write out
    for i in range(start_idx, len(lines)):
        line = lines[i]
        if line.strip() == '':
            new_lines.append(line)
            continue
        if line.strip() == '`;':
            new_lines.append(line)
            continue
            
        f_in = io.StringIO(line)
        reader = csv.reader(f_in)
        for r in reader:
            row = r
            break
            
        # Padded to at least 8 elements (0 to 7)
        while len(row) < 8:
            row.append('')
            
        # Format: id, topicId, question, optionA, optionB, optionC, answer, image, explanation, difficulty
        new_row = row[:7] + [''] + [row[7], str(difficulties[i])]
        
        f_out = io.StringIO()
        writer = csv.writer(f_out, lineterminator='')
        writer.writerow(new_row)
        new_lines.append(f_out.getvalue())
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))

csv_path = 'c:/Users/Lee_D/OneDrive/Desktop/Circuitly/DIP-Circuitly-main/scratch/lingo_quest/questions/QuestionBank.csv'
js_path = 'c:/Users/Lee_D/OneDrive/Desktop/Circuitly/DIP-Circuitly-main/scratch/lingo_quest/js/services/QuestionBankData.js'

print("Processing files...")
process_file(csv_path, is_js=False)
process_file(js_path, is_js=True)
print("Done!")
