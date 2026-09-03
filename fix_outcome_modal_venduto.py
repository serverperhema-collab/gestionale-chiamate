# -*- coding: utf-8 -*-
import sys
import re

path = 'src/components/OutcomeModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = r'(<div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 space-y-4">\s*<label className="block text-sm font-medium text-gray-300">Preventivo</label>[\s\S]*?)(\s*\{\/\* NOTE \*\/\})'

replacement = '''
                  {/* VENDUTO: CONTRATTO FIRMATO */}
                  {outcomeFinal === "VENDUTO" && (
                    <div className="bg-emerald-900/20 border border-emerald-500/50 rounded-xl p-4 animate-in fade-in zoom-in-95 duration-300">
                      <h4 className="text-emerald-400 font-bold text-lg mb-2 flex items-center">
                        <Handshake className="w-5 h-5 mr-2" />
                        COMPLIMENTI!
                      </h4>
                      <p className="text-sm text-gray-300 mb-4">
                        Ottimo lavoro! Allega qui il contratto firmato e gli eventuali documenti necessari. Puoi caricare più file.
                      </p>
                      <input 
                        type="file" 
                        accept=".pdf,image/*"
                        multiple
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-900/30 file:text-emerald-400 hover:file:bg-emerald-900/50 transition-all cursor-pointer"
                      />
                      {files.length > 0 && (
                        <div className="mt-2 text-xs text-emerald-400">
                          {files.length} {files.length === 1 ? 'file selezionato' : 'file selezionati'}
                        </div>
                      )}
                    </div>
                  )}

                  {outcomeFinal !== "VENDUTO" && (
                    <>
\\1                    </>
                  )}
\\2'''

code = re.sub(target, replacement, code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")