import sys
import re

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add Link import
if 'next/link' not in code:
    code = code.replace('import React', 'import Link from "next/link";\nimport React')

# Add ArrowLeft icon
if 'ArrowLeft' not in code:
    code = code.replace('Calendar, Phone, MapPin', 'Calendar, Phone, MapPin, ArrowLeft')

# Add the button
target = """        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Appuntamenti & Preventivi</h1>
            <p className="text-gray-400">Monitora gli appuntamenti e gli esiti dei commerciali.</p>
          </div>
        </div>"""

replacement = """        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Appuntamenti & Preventivi</h1>
            <p className="text-gray-400">Monitora gli appuntamenti e gli esiti dei commerciali.</p>
          </div>
          <Link href="/tl-dashboard" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition font-medium flex items-center border border-gray-700 hover:border-gray-500 shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Dashboard
          </Link>
        </div>"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
