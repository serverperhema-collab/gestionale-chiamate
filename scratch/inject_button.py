import re

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

bad = '<span className="text-2xl font-bold text-white">{totalContacts}</span>'
good = """<div className="flex flex-col items-end gap-2 mb-2">
              <button 
                onClick={() => { setEditContactId(null); setShowEditModal(true); }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-900/20 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Inserisci Contatto Manualmente
              </button>
              <span className="text-2xl font-bold text-white">{totalContacts}</span>
            </div>"""

if 'Inserisci Contatto Manualmente' not in c:
    c = c.replace(bad, good)
    with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'w', encoding='utf-8') as f:
        f.write(c)

print("Done")
