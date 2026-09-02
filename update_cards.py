import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add import
code = code.replace('import QuotesClient from "../quotes/QuotesClient";', 'import QuotesClient from "../quotes/QuotesClient";\nimport ContactDetailModal from "@/components/ContactDetailModal";')

# Add State
state_target = 'const [selectedCommerciale, setSelectedCommerciale] = useState("");'
state_replacement = 'const [selectedCommerciale, setSelectedCommerciale] = useState("");\n  const [detailModalContactId, setDetailModalContactId] = useState<string | null>(null);'
code = code.replace(state_target, state_replacement)

# Add Modal rendering at the end
end_target = '        </div>\n      </div>\n      )}\n      </div>\n    </div>\n    </div>\n  );\n}'
end_replacement = '        </div>\n      </div>\n      )}\n      </div>\n    </div>\n\n      {detailModalContactId && (\n        <ContactDetailModal contactId={detailModalContactId} onClose={() => setDetailModalContactId(null)} />\n      )}\n\n    </div>\n  );\n}'
code = code.replace(end_target, end_replacement)

# Redesign Cards
card_target = """                   return (
                     <div key={appt.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                       
                       <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">"""
                       
card_replacement = """                   const isOverdue = new Date(appt.date) < new Date() && appt.status !== "DONE";
                   const isDone = appt.status === "DONE";
                   const borderColor = isDone ? "border-emerald-500" : isOverdue ? "border-red-500" : "border-blue-500";
                   
                   return (
                     <div key={appt.id} className={`bg-gray-800 border border-gray-700 border-l-4 ${borderColor} rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:border-gray-500 transition`}>
                       
                       <div className="px-5 py-3 border-b border-gray-700/50 flex flex-wrap justify-between items-center bg-gray-900/40 gap-3">"""
                       
code = code.replace(card_target, card_replacement)

# Add Apri Scheda button next to the right-side elements
# Target the `flex items-center space-x-2`
btn_target = """                          <div className="flex items-center space-x-2">
                             {outcome ? ("""
                             
btn_replacement = """                          <div className="flex items-center space-x-3">
                             <button 
                               onClick={() => setDetailModalContactId(appt.contactId)}
                               className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-bold transition shadow-sm"
                             >
                               Apri Scheda
                             </button>
                             {outcome ? ("""
code = code.replace(btn_target, btn_replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
