import sys

path = 'src/components/ContactDetailModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """                        {appt.outcomes?.length > 0 && (
                          <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700 text-sm">
                            <p className="font-medium text-emerald-400 mb-1">Esito: {appt.outcomes[0].status}</p>
                            <p className="text-gray-300 italic">"{appt.outcomes[0].notes || "Nessuna nota"}"</p>
                          </div>
                        )}"""

replacement = """                        {appt.clientNeeds && (
                          <div className="mt-2 p-2 bg-gray-800/50 rounded text-sm text-gray-300">
                            <span className="text-gray-500 text-xs block uppercase">Esigenze (Op):</span>
                            {appt.clientNeeds}
                          </div>
                        )}
                        {appt.tlNotes && (
                          <div className="mt-2 p-2 bg-orange-900/20 rounded border border-orange-500/20 text-sm text-orange-200">
                            <span className="text-orange-500/70 text-xs block uppercase">Note TL:</span>
                            {appt.tlNotes}
                          </div>
                        )}
                        {appt.outcomes?.length > 0 && (
                          <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700 text-sm">
                            <p className="font-medium text-emerald-400 mb-1">Esito Comm: {appt.outcomes[0].status}</p>
                            <p className="text-gray-300 italic">"{appt.outcomes[0].notes || "Nessuna nota"}"</p>
                          </div>
                        )}"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
