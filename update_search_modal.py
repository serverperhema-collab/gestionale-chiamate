import sys

path = 'src/components/SearchContactModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add new state for the historical modal
code = code.replace("const [assigning, setAssigning] = useState(false);", "const [assigning, setAssigning] = useState(false);\n  const [showHistModal, setShowHistModal] = useState(false);\n  const [histDate, setHistDate] = useState('');\n  const [histOutcome, setHistOutcome] = useState('VENDUTO');\n  const [histComm, setHistComm] = useState('');\n  const [commerciali, setCommerciali] = useState<any[]>([]);\n\n  useEffect(() => {\n    fetch('/api/users?role=COMMERCIALE').then(res=>res.json()).then(data=>setCommerciali(data.users||[]));\n  }, []);")

# Add the button next to the others
btn_marker = "                {isStrict ? ("
hist_btn = """
                <button 
                  disabled={assigning || submittingReview}
                  onClick={() => setShowHistModal(true)}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  Segna come App. Storico
                </button>
"""
code = code.replace(btn_marker, hist_btn + btn_marker)

# Add the historical modal UI and submit logic inside the return (if showWarning && selectedContact)
ui_hist = """
      if (showHistModal) {
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-xl border border-blue-500 w-full max-w-md p-6 shadow-2xl relative">
              <h3 className="text-xl font-bold text-white mb-4">Appuntamento Storico</h3>
              <p className="text-gray-400 text-sm mb-4">Stai inserendo un appuntamento pregresso per <strong>{selectedContact.name}</strong>.</p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Commerciale</label>
                  <select value={histComm} onChange={e=>setHistComm(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white">
                    <option value="">Seleziona...</option>
                    {commerciali.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Data</label>
                  <input type="date" value={histDate} onChange={e=>setHistDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Esito</label>
                  <select value={histOutcome} onChange={e=>setHistOutcome(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white">
                    <option value="VENDUTO">Venduto</option>
                    <option value="KO">KO</option>
                    <option value="FOLLOWUP">Follow-up</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 w-full">
                <button 
                  disabled={submittingReview}
                  onClick={() => setShowHistModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Annulla
                </button>
                <button 
                  disabled={submittingReview}
                  onClick={async () => {
                    if(!histDate || !histComm) return toast.error("Compila tutti i campi");
                    setSubmittingReview(true);
                    try {
                      const res = await fetch("/api/tl/appointments/historical", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          contactId: selectedContact.id,
                          date: histDate,
                          commercialeId: histComm,
                          outcomeFinal: histOutcome
                        })
                      });
                      if(!res.ok) {
                         const e = await res.json();
                         toast.error(e.error);
                         setSubmittingReview(false);
                         return;
                      }
                      toast.success("Salvato");
                      setShowHistModal(false);
                      setShowWarning(false);
                      setSelectedContact(null);
                      if (onSelect) onSelect(selectedContact.id);
                    } catch(e) {
                      toast.error("Errore");
                    } finally {
                      setSubmittingReview(false);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  {submittingReview ? "Salvataggio..." : "Salva Storico"}
                </button>
              </div>
            </div>
          </div>
        );
      }
"""
code = code.replace("if (showWarning && selectedContact) {", "if (showWarning && selectedContact) {\n" + ui_hist)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
