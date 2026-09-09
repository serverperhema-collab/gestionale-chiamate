import re

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 3. Add Modal Component
if '<ContactEditModal' not in c:
    c = c.replace('{showWizardModal && histContact && (', """      <ContactEditModal
        isOpen={showEditModal}
        contactId={editContactId}
        onClose={() => setShowEditModal(false)}
        onSaved={fetchContacts}
      />
      {showWizardModal && histContact && (""")

# 4. Add "INSERISCI CONTATTO MANUALMENTE" button
old_header = """            <div className="text-right">
              <span className="text-2xl font-bold text-white">{totalContacts}</span>
              <span className="text-sm text-gray-400 block">Contatti Trovati</span>
            </div>"""

new_header = """            <div className="text-right flex flex-col items-end gap-2">
              <button 
                onClick={() => { setEditContactId(null); setShowEditModal(true); }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-900/20 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Inserisci Contatto Manualmente
              </button>
              <div>
                <span className="text-2xl font-bold text-white mr-2">{totalContacts}</span>
                <span className="text-sm text-gray-400">Contatti Trovati</span>
              </div>
            </div>"""

if 'Inserisci Contatto Manualmente' not in c:
    c = c.replace(old_header, new_header)

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
