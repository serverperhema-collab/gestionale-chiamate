import re

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Imports
c = c.replace('import { Handshake, Database, Search, Filter', 'import ContactEditModal from "@/components/ContactEditModal";\nimport { Handshake, Database, Search, Filter, Plus')

# 2. State
state_code = """  const [search, setSearch] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContactId, setEditContactId] = useState<string | null>(null);"""
c = c.replace('const [search, setSearch] = useState("");', state_code)

# 3. Add Contact Edit Modal to the render tree
modal_code = """      {/* Contact Edit Modal */}
      <ContactEditModal
        isOpen={showEditModal}
        contactId={editContactId}
        onClose={() => setShowEditModal(false)}
        onSaved={fetchContacts}
      />

      {/* Wizard Modals */}"""
c = c.replace('{/* Wizard Modals */}', modal_code)

# 4. Add "INSERISCI CONTATTO MANUALMENTE" button
button_code = """            <h1 className="text-3xl font-bold text-white flex items-center mb-2">
              <Database className="w-8 h-8 mr-3 text-blue-500" />
              Database Contatti
            </h1>
            <button 
              onClick={() => { setEditContactId(null); setShowEditModal(true); }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-900/20 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Inserisci Contatto Manualmente
            </button>
            <p className="text-gray-400 mt-2">"""
c = c.replace("""            <h1 className="text-3xl font-bold text-white flex items-center mb-2">
              <Database className="w-8 h-8 mr-3 text-blue-500" />
              Database Contatti
            </h1>
            <p className="text-gray-400">""", button_code)

# 5. Make the row clickable for editing
# Wait, let's wrap the info part in a clickable element instead of the entire <tr>, to prevent clicking buttons from triggering the edit.
# We'll just add onClick to the first 3 <td>s (Nome, CAP, Settore).
td_code_bad = """                  <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="py-4">
                      <div className="font-semibold text-white">{c.name}</div>
                      <div className="text-sm text-gray-400">{c.originalPhone || "N/D"}</div>
                    </td>
                    <td className="py-4 text-gray-400">{c.cap || "-"}</td>
                    <td className="py-4 text-gray-400">{c.sector || "-"}</td>"""

td_code_good = """                  <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="py-4 cursor-pointer hover:bg-gray-800/50" onClick={() => { setEditContactId(c.id); setShowEditModal(true); }}>
                      <div className="font-semibold text-white">{c.name}</div>
                      <div className="text-sm text-gray-400">{c.originalPhone || "N/D"}</div>
                    </td>
                    <td className="py-4 text-gray-400 cursor-pointer hover:bg-gray-800/50" onClick={() => { setEditContactId(c.id); setShowEditModal(true); }}>{c.cap || "-"}</td>
                    <td className="py-4 text-gray-400 cursor-pointer hover:bg-gray-800/50" onClick={() => { setEditContactId(c.id); setShowEditModal(true); }}>{c.sector || "-"}</td>"""

c = c.replace(td_code_bad, td_code_good)

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
