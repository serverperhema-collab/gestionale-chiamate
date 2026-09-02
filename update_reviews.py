import sys

path = 'src/app/tl-dashboard/settings/reviews/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add import
import_statement = 'import HistoricalApptModal from "@/components/HistoricalApptModal";\n'
code = code.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\n' + import_statement)

# Add state inside component
state_statement = """  const [showHistModal, setShowHistModal] = useState(false);
  const [histContact, setHistContact] = useState<{id: string, name: string} | null>(null);"""
code = code.replace('  const [processingId, setProcessingId] = useState<string | null>(null);', '  const [processingId, setProcessingId] = useState<string | null>(null);\n' + state_statement)

# Add button
btn_marker = """                  <button
                    onClick={() => handleAction(rev.id, "BLACKLIST")}
                    disabled={processingId === rev.id}
                    className="flex-1 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-500/20 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Sposta in Cestino Permanente
                  </button>"""
                  
hist_btn = """
                  <button
                    onClick={() => { setHistContact({id: rev.contact.id, name: rev.contact.name}); setShowHistModal(true); }}
                    disabled={processingId === rev.id}
                    className="flex-1 py-2 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    App. Storico
                  </button>"""
code = code.replace(btn_marker, btn_marker + hist_btn)

# Add modal at the bottom
modal_ui = """      {showHistModal && histContact && (
        <HistoricalApptModal
          contactId={histContact.id}
          contactName={histContact.name}
          onClose={() => { setShowHistModal(false); setHistContact(null); }}
          onSuccess={() => { setShowHistModal(false); setHistContact(null); fetchReviews(); }}
        />
      )}
"""
code = code.replace('    </div>\n  );\n}', modal_ui + '    </div>\n  );\n}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
