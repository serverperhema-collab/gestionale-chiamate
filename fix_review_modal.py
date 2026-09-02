import sys

path = 'src/components/TLReviewAlertModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add action type to state if not there
if 'histDate' not in code:
    code = code.replace("const [actionType, setActionType] = useState<string>('BLACKLIST');", "const [actionType, setActionType] = useState<string>('BLACKLIST');\n  const [histDate, setHistDate] = useState('');\n  const [histOutcome, setHistOutcome] = useState('VENDUTO');\n  const [histComm, setHistComm] = useState('');\n  const [commerciali, setCommerciali] = useState<any[]>([]);\n\n  useEffect(() => {\n    fetch('/api/users?role=COMMERCIALE').then(res=>res.json()).then(data=>setCommerciali(data.users||[]));\n  }, []);")

# Find the label for RESTORE and append the HISTORICAL radio after it
lines = code.split('\n')
new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'Ignora e Ripristina nel Calderone' in line:
        new_lines.append('                  </label>')
        new_lines.append('                  <label className={`cursor-pointer rounded-lg border p-3 flex items-center transition ${actionType === \'HISTORICAL\' ? \'bg-blue-600/20 border-blue-500 text-white\' : \'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500\'}`}>')
        new_lines.append('                    <input type="radio" name="actionType" className="hidden" checked={actionType === \'HISTORICAL\'} onChange={() => setActionType(\'HISTORICAL\')} />')
        new_lines.append('                    <div className="w-4 h-4 rounded-full border border-current mr-3 flex-shrink-0 flex items-center justify-center">')
        new_lines.append('                      {actionType === \'HISTORICAL\' && <div className="w-2 h-2 rounded-full bg-blue-500" />}')
        new_lines.append('                    </div>')
        new_lines.append('                    <span className="text-sm font-medium">App. Già Svolto (Storico)</span>')
        
code_str = '\n'.join(new_lines)
code_str = code_str.replace('                  </label>\n                  </label>', '                  </label>')

# Add the UI for Historical Appointment details
ui_marker = "            {actionType === 'LEAVE_WITH_NOTE' && ("
ui_hist = """            {actionType === 'HISTORICAL' && (
              <div className="mt-4 p-4 border border-blue-500/50 bg-blue-900/10 rounded-lg">
                <h4 className="text-sm font-bold text-blue-400 mb-3">Dettagli Appuntamento Storico</h4>
                <div className="space-y-3">
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
              </div>
            )}
"""
if 'Dettagli Appuntamento Storico' not in code_str:
    code_str = code_str.replace(ui_marker, ui_hist + ui_marker)

# Add API logic to handleSubmit
submit_marker = "      if (isTrashRequest) {"
submit_hist = """      if (actionType === 'HISTORICAL') {
        if (!histDate || !histComm) {
          toast.error("Compila tutti i campi storici.");
          setLoading(false);
          return;
        }
        try {
          const res = await fetch("/api/tl/appointments/historical", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contactId: alert.contactId,
              date: histDate,
              commercialeId: histComm,
              outcomeFinal: histOutcome,
              notes: adminNote
            })
          });
          if (!res.ok) {
            const err = await res.json();
            toast.error(err.error || "Errore");
            setLoading(false);
            return;
          }
          toast.success("Salvato e risolto!");
          onSuccess();
          return;
        } catch(e) {
          toast.error("Errore di rete");
          setLoading(false);
          return;
        }
      }
"""
if "if (actionType === 'HISTORICAL')" not in code_str:
    code_str = code_str.replace(submit_marker, submit_hist + submit_marker)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code_str)
