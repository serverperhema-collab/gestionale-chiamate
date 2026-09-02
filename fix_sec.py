# -*- coding: utf-8 -*-
import sys

path = 'src/app/tl-dashboard/security/SecurityClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = "{/* Operatore Fidato Toggle */}"

replacement = """{/* Limiti Gestione Separata (Pulizie) */}
                      <div className="bg-gray-800 border border-gray-700 p-5 rounded-lg md:col-span-2 mt-4">
                        <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
                          <div className="flex items-center text-gray-300 font-semibold">
                            <svg className="w-4 h-4 mr-2 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M2 15h10"/><path d="M6 12l-4 3 4 3"/></svg>
                            Limiti Gestione Separata (Pulizie)
                          </div>
                        </div>
                        <div className="text-sm text-gray-400 leading-relaxed flex flex-wrap items-center gap-2">
                          <span>L'operatore può inviare un massimo di</span>
                          <input 
                            type="number" min="0" value={op.maxGestioneSeparata ?? 5}
                            onChange={(e) => {
                              const newArr = [...operatorsSettings];
                              newArr[index].maxGestioneSeparata = parseInt(e.target.value) || 0;
                              setOperatorsSettings(newArr);
                            }}
                            className="w-16 bg-teal-900/30 border border-teal-500/50 rounded px-2 py-1 text-center text-teal-300 focus:outline-none focus:border-teal-400 font-bold"
                          />
                          <span>richieste di Gestione Separata ogni</span>
                          <input 
                            type="number" min="0" value={op.maxGestioneSeparataMins ?? 60}
                            onChange={(e) => {
                              const newArr = [...operatorsSettings];
                              newArr[index].maxGestioneSeparataMins = parseInt(e.target.value) || 0;
                              setOperatorsSettings(newArr);
                            }}
                            className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-teal-500 font-bold"
                          />
                          <span>minuti.</span>
                        </div>
                      </div>

                      {/* Operatore Fidato Toggle */}"""

if "Limiti Gestione Separata" not in code:
    code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)