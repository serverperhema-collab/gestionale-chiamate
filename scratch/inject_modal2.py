import re

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Imports
if 'import ContactEditModal' not in c:
    c = c.replace('import TrattativaTimeline from "@/components/TrattativaTimeline";', 'import TrattativaTimeline from "@/components/TrattativaTimeline";\nimport ContactEditModal from "@/components/ContactEditModal";')
    c = c.replace('Calendar, AlertCircle, ArrowRightCircle', 'Calendar, AlertCircle, ArrowRightCircle, Plus')

# 2. State
if 'const [showEditModal' not in c:
    c = c.replace('const [search, setSearch] = useState("");', 'const [search, setSearch] = useState("");\n  const [showEditModal, setShowEditModal] = useState(false);\n  const [editContactId, setEditContactId] = useState<string | null>(null);')

# 3. Add Modal Component (find `{showWizardModal &&`)
if '<ContactEditModal' not in c:
    c = c.replace('{showWizardModal && (', """      <ContactEditModal
        isOpen={showEditModal}
        contactId={editContactId}
        onClose={() => setShowEditModal(false)}
        onSaved={fetchContacts}
      />
      {showWizardModal && (""")

# 4. Add "INSERISCI CONTATTO MANUALMENTE" button
if 'Inserisci Contatto Manualmente' not in c:
    c = c.replace("""<div className="text-right">
              <span className="text-2xl font-bold text-white">{totalContacts}</span>""", """<div className="text-right flex flex-col items-end gap-2">
              <button 
                onClick={() => { setEditContactId(null); setShowEditModal(true); }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-900/20 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Inserisci Contatto Manualmente
              </button>
              <div>
                <span className="text-sm text-gray-400 mr-2">Totale:</span>
                <span className="text-2xl font-bold text-white">{totalContacts}</span>
              </div>""")

# 5. Make Row Clickable
c = c.replace("""<td className="py-4">
                      <div className="font-semibold text-gray-200">{c.name}</div>""", """<td className="py-4 cursor-pointer hover:bg-gray-800/80" onClick={() => { setEditContactId(c.id); setShowEditModal(true); }}>
                      <div className="font-semibold text-gray-200">{c.name}</div>""")

c = c.replace("""<td className="py-4 text-gray-400">{c.cap || "-"}</td>""", """<td className="py-4 text-gray-400 cursor-pointer hover:bg-gray-800/80" onClick={() => { setEditContactId(c.id); setShowEditModal(true); }}>{c.cap || "-"}</td>""")
c = c.replace("""<td className="py-4 text-gray-400">{c.sector || "-"}</td>""", """<td className="py-4 text-gray-400 cursor-pointer hover:bg-gray-800/80" onClick={() => { setEditContactId(c.id); setShowEditModal(true); }}>{c.sector || "-"}</td>""")

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
