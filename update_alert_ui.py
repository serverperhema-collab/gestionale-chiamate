import sys

path = 'src/components/TLAlertProvider.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """      if (activeModalAlert.type === 'DEROGA_APP_REQUEST') {"""

replacement = """      if (activeModalAlert.type === 'GESTIONE_SEPARATA_REQUEST') {
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-2xl border border-emerald-500/30 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
              <div className="bg-emerald-500/20 p-5 flex items-center justify-between border-b border-emerald-500/30">
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-500/30 p-2 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Richiesta Gestione Separata</h3>
                </div>
                <button onClick={() => setActiveModalAlert(null)} className="text-emerald-400 hover:text-white transition">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-1">Azienda</div>
                  <div className="text-lg font-bold text-white">{activeModalAlert.contactName}</div>
                </div>

                <div className="mb-6">
                  <div className="text-sm text-gray-400 mb-2">Motivazione dell'Operatore:</div>
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-gray-300 italic text-sm">
                    "{activeModalAlert.reason}"
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                  <button 
                    onClick={async () => {
                      setActionLoading(true);
                      await fetch("/api/tl/gestione-separata", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: activeModalAlert.requestId, action: "REJECT" })
                      });
                      toast.error("Richiesta Scartata");
                      setActionLoading(false);
                      setActiveModalAlert(null);
                    }}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-red-900/30 text-red-400 hover:bg-red-800 hover:text-white border border-red-700/50 rounded-lg transition font-medium disabled:opacity-50"
                  >
                    Scarta
                  </button>
                  <button 
                    onClick={async () => {
                      setActionLoading(true);
                      await fetch("/api/tl/gestione-separata", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: activeModalAlert.requestId, action: "APPROVE" })
                      });
                      toast.success("Gestione Separata Approvata!");
                      setActionLoading(false);
                      setActiveModalAlert(null);
                    }}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded-lg transition font-medium disabled:opacity-50 shadow-lg shadow-emerald-900/50"
                  >
                    Approva (Sposta in Pulizie)
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (activeModalAlert.type === 'DEROGA_APP_REQUEST') {"""
code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
