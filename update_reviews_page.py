# -*- coding: utf-8 -*-
import sys

path = 'src/app/tl-dashboard/settings/reviews/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add handleGestioneSeparataAction
target_action = """  const handleAction = async (id: string, action: "RESTORE" | "BLACKLIST") => {"""
replacement_action = """  const handleGestioneSeparataAction = async (id: string, action: "APPROVE" | "REJECT") => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/tl/gestione-separata", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        if (action === "APPROVE") {
          toast.success("Approvato: Contatto spostato nelle Pulizie!");
        } else {
          toast.success("Scartato: Contatto ripristinato!");
        }
        setReviews(reviews.filter(r => r.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAction = async (id: string, action: "RESTORE" | "BLACKLIST") => {"""
code = code.replace(target_action, replacement_action)

# Update map
target_map = """                  <span className="bg-indigo-900/30 text-indigo-400 text-xs px-2 py-1 rounded border border-indigo-500/20 font-semibold">
                    Da Revisionare
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {rev.originalPhone && rev.originalPhone !== "N/D" && (
                    <div className="text-sm text-gray-300 font-mono">
                      <span className="text-gray-500">Tel:</span> {rev.originalPhone}
                    </div>
                  )}
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-sm">
                    <div className="flex items-center text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                      Segnalazione Operatore:
                    </div>
                    <p className="text-gray-300 italic">"{rev.reviewNote || "Nessuna nota fornita"}"</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">
                <button
                  onClick={() => handleAction(rev.id, "RESTORE")}
                  disabled={processingId === rev.id}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded border border-gray-700 transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Ripristina nel Calderone
                </button>
                <button
                  onClick={() => handleAction(rev.id, "BLACKLIST")}
                  disabled={processingId === rev.id}
                  className="flex-1 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-500/20 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> Sposta in Cestino Permanente
                  </button>
                  <button
                    onClick={() => { setHistContact({id: rev.contact.id, name: rev.contact.name}); setShowHistModal(true); }}
                    disabled={processingId === rev.id}
                    className="flex-1 py-2 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    App. Storico
                </button>
              </div>"""

replacement_map = """                  {rev.type === 'GESTIONE_SEPARATA' ? (
                    <span className="bg-teal-900/30 text-teal-400 text-xs px-2 py-1 rounded border border-teal-500/20 font-semibold">
                      Gestione Separata
                    </span>
                  ) : (
                    <span className="bg-indigo-900/30 text-indigo-400 text-xs px-2 py-1 rounded border border-indigo-500/20 font-semibold">
                      Da Revisionare
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {rev.originalPhone && rev.originalPhone !== "N/D" && (
                    <div className="text-sm text-gray-300 font-mono">
                      <span className="text-gray-500">Tel:</span> {rev.originalPhone}
                    </div>
                  )}
                  <div className={`bg-gray-900 border ${rev.type === 'GESTIONE_SEPARATA' ? 'border-teal-900/30' : 'border-gray-800'} rounded-lg p-3 text-sm`}>
                    <div className={`flex items-center ${rev.type === 'GESTIONE_SEPARATA' ? 'text-teal-400' : 'text-indigo-400'} font-bold text-xs uppercase tracking-wider mb-1`}>
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                      Segnalazione Operatore:
                    </div>
                    <p className="text-gray-300 italic">"{rev.reviewNote || "Nessuna nota fornita"}"</p>
                  </div>
                </div>
              </div>

              {rev.type === 'GESTIONE_SEPARATA' ? (
                <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">
                  <button
                    onClick={() => handleGestioneSeparataAction(rev.id, "REJECT")}
                    disabled={processingId === rev.id}
                    className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded border border-gray-700 transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Scarta Richiesta
                  </button>
                  <button
                    onClick={() => handleGestioneSeparataAction(rev.id, "APPROVE")}
                    disabled={processingId === rev.id}
                    className="flex-1 py-2 bg-teal-900/30 hover:bg-teal-900/50 text-teal-400 hover:text-teal-300 border border-teal-500/30 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Approva (Sposta in Pulizie)
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">
                  <button
                    onClick={() => handleAction(rev.id, "RESTORE")}
                    disabled={processingId === rev.id}
                    className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded border border-gray-700 transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Ripristina nel Calderone
                  </button>
                  <button
                    onClick={() => handleAction(rev.id, "BLACKLIST")}
                    disabled={processingId === rev.id}
                    className="flex-1 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-500/20 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Sposta in Cestino Permanente
                    </button>
                    <button
                      onClick={() => { setHistContact({id: rev.contactId || rev.id, name: rev.name}); setShowHistModal(true); }}
                      disabled={processingId === rev.id}
                      className="flex-1 py-2 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      App. Storico
                  </button>
                </div>
              )}"""
code = code.replace(target_map, replacement_map)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)