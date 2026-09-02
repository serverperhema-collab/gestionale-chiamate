import sys

path = 'src/app/tl-dashboard/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """            <Link href="/tl-dashboard/quotes" className="group">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 group-hover:border-pink-500 transition h-full">
                <FileText className="w-8 h-8 text-pink-400 mb-4" />
                <h2 className="text-lg font-semibold text-white">Preventivi</h2>
                <p className="text-sm text-gray-400 mt-2">Sviluppa i preventivi richiesti dai commerciali.</p>
              </div>
            </Link>"""

code = code.replace(target, '')

# Also change the description of outcomes
code = code.replace('Appuntamenti</h2>\n                <p className="text-sm text-gray-400 mt-2">Gestisci lo storico degli appuntamenti, gli esiti delle visite e i pregressi.</p>', 'Appuntamenti e Preventivi</h2>\n                <p className="text-sm text-gray-400 mt-2">Gestisci lo storico degli appuntamenti, gli esiti e sviluppa i preventivi richiesti.</p>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
