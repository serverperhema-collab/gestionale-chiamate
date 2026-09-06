import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\settings\\hidden-contacts\\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# First replace the div structure properly around search.
import re

content = re.sub(r'<div className="flex gap-4 w-full xl:w-auto">[\s\S]*?</div>\s*</div>\s*</div>\s*</div>', 
                 '<div className="relative w-full xl:w-72">', content)
                 
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)