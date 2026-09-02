import sys
import re

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the card wrapper
code = re.sub(
    r'<div key=\{appt\.id\} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden\s*shadow-lg">',
    r'const isOverdue = new Date(appt.date) < new Date() && appt.status !== "DONE";\n                   const isDone = appt.status === "DONE";\n                   const borderColor = isDone ? "border-emerald-500" : isOverdue ? "border-red-500" : "border-blue-500";\n                   return (\n                     <div key={appt.id} className={`bg-gray-800 border border-gray-700 border-l-4 ${borderColor} rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:border-gray-500 transition`}>',
    code
)
# Fix double return
code = re.sub(r'return \(\s*const isOverdue', 'const isOverdue', code)

# Replace the header
code = re.sub(
    r'<div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center\s*bg-gray-900/50">',
    '<div className="px-5 py-3 border-b border-gray-700/50 flex flex-wrap justify-between items-center bg-gray-900/40 gap-3">',
    code
)

# Replace button area. We can use regex here too if spacing is weird.
code = re.sub(
    r'<div className="flex items-center space-x-2">\s*\{outcome \? \(',
    '<div className="flex items-center space-x-3">\n                             <button onClick={() => setDetailModalContactId(appt.contactId)} className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-bold transition shadow-sm">Apri Scheda</button>\n                             {outcome ? (',
    code
)

# Import ContactDetailModal if not imported
if 'ContactDetailModal' not in code:
    code = code.replace('import QuotesClient from "../quotes/QuotesClient";', 'import QuotesClient from "../quotes/QuotesClient";\nimport ContactDetailModal from "@/components/ContactDetailModal";')

# State for modal
if 'detailModalContactId' not in code:
    code = code.replace('const [selectedCommerciale, setSelectedCommerciale] = useState("");', 'const [selectedCommerciale, setSelectedCommerciale] = useState("");\n  const [detailModalContactId, setDetailModalContactId] = useState<string | null>(null);')

# Modal rendering at the end
if 'ContactDetailModal contactId=' not in code:
    end_target = '        </div>\n      </div>\n      )}\n      </div>\n    </div>\n    </div>\n  );\n}'
    end_replacement = '        </div>\n      </div>\n      )}\n      </div>\n    </div>\n\n      {detailModalContactId && (\n        <ContactDetailModal contactId={detailModalContactId} onClose={() => setDetailModalContactId(null)} />\n      )}\n\n    </div>\n  );\n}'
    code = code.replace(end_target, end_replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
