import sys

path = 'src/app/tl-dashboard/settings/contacts/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add import
import_statement = 'import HistoricalApptModal from "@/components/HistoricalApptModal";\n'
code = code.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\n' + import_statement)

# Add state
state_statement = """  const [showHistModal, setShowHistModal] = useState(false);
  const [histContact, setHistContact] = useState<any>(null);"""
code = code.replace('const [showTimeline, setShowTimeline] = useState(false);', 'const [showTimeline, setShowTimeline] = useState(false);\n' + state_statement)

# Add button next to Cronologia
btn_marker = """                          className="inline-flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition"
                        >
                          <History className="w-4 h-4 mr-1.5" />
                          Cronologia
                        </button>"""
hist_btn = """                        <button
                          onClick={() => { setHistContact(contact); setShowHistModal(true); }}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 rounded border border-blue-800 transition"
                        >
                          App. Storico
                        </button>"""
code = code.replace(btn_marker, btn_marker + '\n' + hist_btn)

# Add modal at the bottom
modal_ui = """      {showHistModal && histContact && (
        <HistoricalApptModal
          contactId={histContact.id}
          contactName={histContact.name}
          onClose={() => { setShowHistModal(false); setHistContact(null); }}
          onSuccess={() => { setShowHistModal(false); setHistContact(null); fetchContacts(); }}
        />
      )}
"""
code = code.replace('    </div>\n  );\n}', modal_ui + '    </div>\n  );\n}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
