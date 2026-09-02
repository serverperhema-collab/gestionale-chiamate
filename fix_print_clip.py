import sys

path = 'src/components/ContactDetailModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Fix fixed inset-0 clipping
target = '<div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 print:bg-white print:p-0">'
replacement = '<div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 print:static print:inset-auto print:bg-white print:p-0">'
code = code.replace(target, replacement)

target2 = '<div className="hidden print:block absolute top-0 left-0 w-full min-h-screen bg-white text-black p-8 font-sans">'
replacement2 = '<div className="hidden print:block w-full min-h-screen bg-white text-black p-8 font-sans">'
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
