import sys

path1 = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\trattative\\[id]\\actions\\route.ts'
with open(path1, 'r', encoding='utf-8') as f:
    content1 = f.read()

content1 = content1.replace('case "upload-quote":', 'case "preventivo-complete":')
content1 = content1.replace('result = await service.uploadQuote(', 'result = await service.completePreventivo(')

with open(path1, 'w', encoding='utf-8') as f:
    f.write(content1)

path2 = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\quotes\\QuotesClient.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace('action: "upload-quote"', 'action: "preventivo-complete"')

with open(path2, 'w', encoding='utf-8') as f:
    f.write(content2)