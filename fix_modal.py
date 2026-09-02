# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/operator-terminal/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = "{/* Trash Modal */}"
replacement = """{/* Gestione Separata Modal */}
        {gestioneSeparataModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl border border-teal-500/30 w-full max-w-md p-6 shadow-2xl relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-teal-400">Gestione Separata (Pulizie)</h3>
                <button onClick={() => setGestioneSeparataModalOpen(false)} className="text-gray-400 hover:text-white transition">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                Stai per segnalare questo contatto come appartenente alle <strong>imprese di pulizie</strong>.
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

# Ensure we don't insert it multiple times if it's already there
if "Gestione Separata Modal" not in code:
    code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)