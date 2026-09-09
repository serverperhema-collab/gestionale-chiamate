import re

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Imports
c = c.replace('import { Handshake, Database, Search, Filter, Plus, History, X, ChevronLeft, ChevronRight, User, Phone, PhoneOff, Calendar, AlertCircle, ArrowRightCircle }', 'import { Handshake, Database, Search, Filter, Plus, History, X, ChevronLeft, ChevronRight, User, Phone, PhoneOff, Calendar, AlertCircle, ArrowRightCircle, Trash2, RefreshCw }')
if 'Trash2' not in c: # If the previous replace failed because it didn't match the exact string
    # Fallback import injection
    c = re.sub(r'import \{ (.*?) \} from "lucide-react";', r'import { \1, Trash2, RefreshCw } from "lucide-react";', c)

# 2. State and logic
state_injection = """  const [showEditModal, setShowEditModal] = useState(false);
  const [editContactId, setEditContactId] = useState<string | null>(null);

  // Trash Logic
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [trashContact, setTrashContact] = useState<any>(null);
  const [trashReason, setTrashReason] = useState("");

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/tl/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blacklisted: false, blacklistReason: null })
      });
      if (res.ok) {
        toast.success("Contatto ripristinato!");
        fetchContacts();
      } else {
        toast.error("Errore durante il ripristino");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };"""
c = c.replace("""  const [showEditModal, setShowEditModal] = useState(false);
  const [editContactId, setEditContactId] = useState<string | null>(null);""", state_injection)

# 3. Action Buttons (Find the Delega button and insert Trash button before it)
bad_btn_group = """                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openAssignModal(c)}
                          className="inline-flex items-center px-3 py-1.5 bg-purple-900/30 hover:bg-purple-800/50 text-purple-400 rounded border border-purple-800/50 transition\""""

good_btn_group = """                      <div className="flex items-center justify-end space-x-2">
                        {!c.blacklisted ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); setTrashContact(c); setShowTrashModal(true); }}
                            className="inline-flex items-center px-2 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded border border-red-800/50 transition whitespace-nowrap"
                            title="Cestina Contatto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRestore(c.id); }}
                            className="inline-flex items-center px-2 py-1.5 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 rounded border border-blue-800/50 transition whitespace-nowrap"
                            title="Ripristina Contatto"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openAssignModal(c); }}
                          className="inline-flex items-center px-3 py-1.5 bg-purple-900/30 hover:bg-purple-800/50 text-purple-400 rounded border border-purple-800/50 transition\""""
c = c.replace(bad_btn_group, good_btn_group)

# 4. Trash Modal JSX (Inject before final `</div>` of the page)
# I will find `{/* Wizard Modals */}` and place it above it
trash_modal = """      {/* Trash Modal */}
      {showTrashModal && trashContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col p-6 space-y-4">
            <h3 className="text-xl font-bold text-red-400 flex items-center">
              <Trash2 className="w-5 h-5 mr-2" /> Cestina Contatto
            </h3>
            <p className="text-sm text-gray-300">
              Stai per cestinare definitivamente il contatto <strong className="text-white">{trashContact.name}</strong>.
            </p>
            <textarea
              value={trashReason}
              onChange={(e) => setTrashReason(e.target.value)}
              placeholder="Inserisci il motivo (Es. Numero inesistente, azienda chiusa...)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-red-500 resize-none h-24"
            />
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => { setShowTrashModal(false); setTrashContact(null); setTrashReason(""); }}
                className="px-4 py-2 bg-gray-800 text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
              >
                Annulla
              </button>
              <button
                onClick={async () => {
                  if (!trashReason.trim()) return toast.error("Inserisci un motivo.");
                  try {
                    const res = await fetch(`/api/tl/contacts/${trashContact.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ blacklisted: true, blacklistReason: trashReason })
                    });
                    if (res.ok) {
                      toast.success("Contatto cestinato!");
                      setShowTrashModal(false);
                      setTrashContact(null);
                      setTrashReason("");
                      fetchContacts();
                    } else {
                      toast.error("Errore durante il cestinamento");
                    }
                  } catch (e) {
                    toast.error("Errore di rete");
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-bold shadow-lg shadow-red-900/20"
              >
                Conferma Cestino
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Modals */}"""

c = c.replace('{/* Wizard Modals */}', trash_modal)

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
