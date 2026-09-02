# -*- coding: utf-8 -*-
import sys

path = 'src/app/tl-dashboard/security/SecurityClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """                      </div>

                      {/* Azione Salva */}"""

replacement = """                      </div>

                      {/* Operatore Fidato Toggle */}
                      <div className="bg-gray-800 border border-emerald-900/30 p-5 rounded-lg mt-4 flex items-center justify-between shadow-sm">
                        <div>
                          <h4 className="text-emerald-400 font-bold flex items-center mb-1">
                            ⭐ Operatore Fidato (Immunità e Auto-Approvazione)
                          </h4>
                          <p className="text-sm text-gray-400">
                            Se attivo, l'operatore non subirà mai blocchi (Skip, KO, Modifiche) e le sue richieste (Cestino, Gestione Separata) saranno approvate istantaneamente senza creare code di notifica per il TL.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                          <input 
                            type="checkbox" 
                            checked={op.isTrusted || false}
                            onChange={(e) => {
                              const newArr = [...operatorsSettings];
                              newArr[index].isTrusted = e.target.checked;
                              setOperatorsSettings(newArr);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>

                      {/* Azione Salva */}"""

code = code.replace(target, replacement)

# Need to make sure `isTrusted` is passed to the backend when saving!
save_target = """                              try {
                                const res = await fetch(`/api/users/${op.id}/settings`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    alertSkipLock: op.alertSkipLock,"""

save_replacement = """                              try {
                                const res = await fetch(`/api/users/${op.id}/settings`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    isTrusted: op.isTrusted,
                                    alertSkipLock: op.alertSkipLock,"""

code = code.replace(save_target, save_replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)