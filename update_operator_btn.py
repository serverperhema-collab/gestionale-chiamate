# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/operator-terminal/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add states
target_states = """  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [trashNotes, setTrashNotes] = useState("");"""
replacement_states = """  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [trashNotes, setTrashNotes] = useState("");
  const [gestioneSeparataModalOpen, setGestioneSeparataModalOpen] = useState(false);
  const [gestioneSeparataNotes, setGestioneSeparataNotes] = useState("");"""
code = code.replace(target_states, replacement_states)

# Add handler
target_handler = """  const handleTrashRequest = async () => {
    if (!trashNotes.trim()) {
      toast.error("Inserisci la motivazione");
      return;
    }
    handleOutcome("TRASH_REQUEST", trashNotes);
    setTrashModalOpen(false);
  };"""
replacement_handler = """  const handleTrashRequest = async () => {
    if (!trashNotes.trim()) {
      toast.error("Inserisci la motivazione");
      return;
    }
    handleOutcome("TRASH_REQUEST", trashNotes);
    setTrashModalOpen(false);
  };

  const handleGestioneSeparataRequest = async () => {
    if (!gestioneSeparataNotes.trim()) {
      toast.error("Inserisci la motivazione");
      return;
    }
    if (!contact) return;
    try {
      const res = await fetch("/api/contacts/gestione-separata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, reason: gestioneSeparataNotes })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.autoApproved) {
            toast.success("Contatto cestinato (Gestione Separata auto-approvata)");
        } else {
            toast.success("Richiesta Gestione Separata inviata alla TL");
        }
        setGestioneSeparataModalOpen(false);
        setGestioneSeparataNotes("");
        fetchNextContact();
      } else {
        toast.error(data.error || "Errore durante l'invio della richiesta");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };"""
code = code.replace(target_handler, replacement_handler)

# Add Button
target_btn = """                    <button disabled={noAnswerLocked} onClick={() => { setReviewNotes(""); setReviewModalOpen(true); }} className="px-6 py-3 bg-indigo-900/30 text-indigo-400 hover:bg-indigo-800 hover:text-white border border-indigo-700/50 rounded-lg transition shadow-sm disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                      <span className="font-bold">RICHIEDI REVISIONE TL</span>
                      <span className="text-xs italic opacity-85 font-normal">contatto già gestito o anomalo</span>
                    </button>"""
replacement_btn = """                    <button disabled={noAnswerLocked} onClick={() => { setReviewNotes(""); setReviewModalOpen(true); }} className="px-6 py-3 bg-indigo-900/30 text-indigo-400 hover:bg-indigo-800 hover:text-white border border-indigo-700/50 rounded-lg transition shadow-sm disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                      <span className="font-bold">RICHIEDI REVISIONE TL</span>
                      <span className="text-xs italic opacity-85 font-normal">contatto già gestito o anomalo</span>
                    </button>
                    {!contact.isGestioneSeparata && (
                      <button disabled={noAnswerLocked} onClick={() => { setGestioneSeparataNotes(""); setGestioneSeparataModalOpen(true); }} className="px-6 py-3 bg-teal-900/30 text-teal-400 hover:bg-teal-800 hover:text-white border border-teal-700/50 rounded-lg transition shadow-sm disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                        <span className="font-bold">GESTIONE SEPARATA</span>
                        <span className="text-xs italic opacity-85 font-normal">invia alla società di pulizie</span>
                      </button>
                    )}"""
code = code.replace(target_btn, replacement_btn)

# Add Modal
target_modal = """        {/* Trash Modal */}"""
replacement_modal = """        {/* Gestione Separata Modal */}
        {gestioneSeparataModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl border border-teal-500/30 w-full max-w-md p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-teal-400">Gestione Separata (Pulizie)</h3>
                <button onClick={() => setGestioneSeparataModalOpen(false)} className="text-gray-400 hover:text-white transition">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                Stai per segnalare questo contatto come appartenente alle **imprese di pulizie**.
                Inserisci una nota per il Team Leader che dovrà approvare la richiesta.
              </p>
              <textarea
                value={gestioneSeparataNotes}
                onChange={e => setGestioneSeparataNotes(e.target.value)}
                placeholder="Es. Fa solo pulizie, non usa abbigliamento..."
                className="w-full h-24 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500 mb-4 resize-none"
              />
              <div className="flex justify-end space-x-3">
                <button onClick={() => setGestioneSeparataModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Annulla</button>
                <button onClick={handleGestioneSeparataRequest} className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition shadow-lg shadow-teal-900/50">
                  Invia Richiesta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trash Modal */}"""
code = code.replace(target_modal, replacement_modal)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)