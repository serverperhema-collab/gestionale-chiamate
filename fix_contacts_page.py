import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\settings\\contacts\\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

legacy_row = """                      <button
                        onClick={() => openAssignModal(c)}
                        className="inline-flex items-center px-3 py-1.5 bg-purple-900/30 hover:bg-purple-800/50 text-purple-400 rounded border border-purple-800/50 transition"
                        title="Assegna a Commerciale o Operatore"
                      >
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        Assegna
                      </button>"""

new_row = """                      <button
                        onClick={() => openAssignModal(c)}
                        className="inline-flex items-center px-3 py-1.5 bg-purple-900/30 hover:bg-purple-800/50 text-purple-400 rounded border border-purple-800/50 transition"
                        title="Assegna a Commerciale o Operatore"
                      >
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        Assegna
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm("Vuoi forzare l'apertura di una Trattativa su questo contatto?")) {
                            const res = await fetch("/api/trattative", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ contactId: c.id, forceOpen: true })
                            });
                            if (res.ok) {
                              // alert toast handled below if we want, or simple reload
                              fetchData();
                            }
                          }
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 rounded border border-emerald-800/50 transition"
                        title="Forza Apertura Trattativa"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Apri ST
                      </button>"""

content = content.replace(legacy_row, new_row)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)