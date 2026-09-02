import sys

path = 'src/app/tl-dashboard/settings/reviews/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure imports are present
if 'HistoricalApptModal' not in code:
    code = code.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\nimport HistoricalApptModal from "@/components/HistoricalApptModal";\n')

if 'histContact' not in code:
    code = code.replace('const [processingId, setProcessingId] = useState<string | null>(null);', 'const [processingId, setProcessingId] = useState<string | null>(null);\n  const [showHistModal, setShowHistModal] = useState(false);\n  const [histContact, setHistContact] = useState<{id: string, name: string} | null>(null);')

# Find the blacklist button dynamically
lines = code.split('\n')
new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'Sposta in Cestino Permanente' in line:
        # We just added the closing button tag, add the next button
        new_lines.append('                  </button>')
        new_lines.append('                  <button')
        new_lines.append('                    onClick={() => { setHistContact({id: rev.contact.id, name: rev.contact.name}); setShowHistModal(true); }}')
        new_lines.append('                    disabled={processingId === rev.id}')
        new_lines.append('                    className="flex-1 py-2 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"')
        new_lines.append('                  >')
        new_lines.append('                    App. Storico')
        
# Fix duplicate closing tag if any
code_str = '\n'.join(new_lines)
code_str = code_str.replace('                  </button>\n                  </button>', '                  </button>')

# Add modal at the end
if 'HistoricalApptModal' not in code_str.split('return (')[1]:
    modal = """      {showHistModal && histContact && (
        <HistoricalApptModal
          contactId={histContact.id}
          contactName={histContact.name}
          onClose={() => { setShowHistModal(false); setHistContact(null); }}
          onSuccess={() => { setShowHistModal(false); setHistContact(null); fetchReviews(); }}
        />
      )}
"""
    code_str = code_str.replace('    </div>\n  );\n}', modal + '    </div>\n  );\n}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code_str)
