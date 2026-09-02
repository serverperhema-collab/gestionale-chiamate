import sys

path = 'src/app/operator-terminal/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. State
state_target = 'const [reviewNotes, setReviewNotes] = useState("");'
state_replacement = 'const [reviewNotes, setReviewNotes] = useState("");\n  const [gestioneSeparataModalOpen, setGestioneSeparataModalOpen] = useState(false);\n  const [gestioneSeparataNotes, setGestioneSeparataNotes] = useState("");'
code = code.replace(state_target, state_replacement)

# 2. Function
func_target = '  const handleOutcome = async (outcome: string, notes?: string, customDelay?: string) => {'
func_replacement = """  const handleGestioneSeparata = async () => {
    if (!gestioneSeparataNotes.trim()) {
      toast.error("Devi inserire una motivazione.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contacts/gestione-separata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, reason: gestioneSeparataNotes })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Richiesta inviata. Pesco il prossimo...");
        setGestioneSeparataModalOpen(false);
        fetchNextContact();
      } else {
        toast.error(data.error || "Errore durante l'invio");
        setGestioneSeparataModalOpen(false);
        if (data.error.includes("limite")) {
           // Do not fetch next, just stay
        } else {
           fetchNextContact();
        }
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  const handleOutcome = async (outcome: string, notes?: string, customDelay?: string) => {"""
code = code.replace(func_target, func_replacement)

# 3. Button (conditionally rendered if contact.isGestioneSeparata is false)
btn_target = """<button disabled={noAnswerLocked} onClick={() => { setReviewNotes(""); setReviewModalOpen(true); }} className="px-6 py-3 bg-indigo-900/30 text-indigo-400 hover:bg-indigo-800 hover:text-white border border-indigo-700/50 rounded-lg transition shadow-sm disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                      <span className="font-bold">RICHIEDI REVISIONE TL</span>
                      <span className="text-xs italic opacity-85 font-normal">contatto già gestito o anomalo</span>
                    </button>"""

btn_replacement = btn_target + """
                    {!contact.isGestioneSeparata && (
                      <button disabled={noAnswerLocked} onClick={() => { setGestioneSeparataNotes(""); setGestioneSeparataModalOpen(true); }} className="px-6 py-3 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-800 hover:text-white border border-emerald-700/50 rounded-lg transition shadow-sm disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                        <span className="font-bold">GESTIONE SEPARATA</span>
                        <span className="text-xs italic opacity-85 font-normal">invia alla campagna pulizie</span>
                      </button>
                    )}"""
code = code.replace(btn_target, btn_replacement)

# 4. Modal
modal_target = """        {reviewModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">"""

modal_replacement = """        {gestioneSeparataModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-emerald-400">Richiedi Gestione Separata</h3>
                <button onClick={() => setGestioneSeparataModalOpen(false)} className="text-gray-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Vuoi spostare questo contatto nella Campagna Pulizie? Inserisci una nota obbligatoria per il Team Leader che dovrà approvarlo. (Attenzione: ci sono dei limiti orari/giornalieri per questa funzione).
              </p>
              <textarea
                autoFocus
                className="w-full h-32 bg-gray-900 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-emerald-500 resize-none mb-4"
                placeholder="Specifica le esigenze del cliente (es. 'Interessato a pulizie condominiali, chiamare settimana prossima')..."
                value={gestioneSeparataNotes}
                onChange={e => setGestioneSeparataNotes(e.target.value)}
              />
              <div className="flex justify-end space-x-3">
                <button onClick={() => setGestioneSeparataModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">
                  Annulla
                </button>
                <button 
                  onClick={handleGestioneSeparata} 
                  disabled={!gestioneSeparataNotes.trim() || loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition disabled:opacity-50"
                >
                  {loading ? "Invio in corso..." : "Invia Richiesta"}
                </button>
              </div>
            </div>
          </div>
        )}

        {reviewModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">"""
code = code.replace(modal_target, modal_replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
