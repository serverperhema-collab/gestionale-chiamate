import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\settings\\hidden-contacts\\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("User className", "FileText className") # replace User icon with FileText to avoid import error
content = content.replace("{contact.province} • ", "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)