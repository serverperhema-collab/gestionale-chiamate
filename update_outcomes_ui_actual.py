# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = r'''                               <button onClick=\{\(\) => setEditModalAppt\(appt\)\} className="p-1\.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-600 rounded-lg transition shadow-sm" title="Modifica Appuntamento">
                                 <Edit2 className="w-4 h-4" />
                               </button>
                               <button onClick=\{\(\) => setDetailModalContactId\(appt\.contactId\)\} className="px-3 py-1\.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-bold transition shadow-sm">Apri Scheda</button>'''

replacement = '''                               <button onClick={() => setEditModalAppt(appt)} className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-600 rounded-lg transition shadow-sm" title="Modifica Info Appuntamento">
                                 <Edit2 className="w-4 h-4" />
                               </button>
                               {appt.status !== "CANCELLED" && (
                                <button onClick={() => setOutcomeModalApptId(appt.id)} className="p-1.5 bg-indigo-900/20 hover:bg-indigo-900/40 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-lg transition shadow-sm" title="Registra/Modifica Esito">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                               )}
                               {appt.status !== "CANCELLED" && (
                                <button onClick={() => setDeleteModalApptId(appt.id)} className="p-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg transition shadow-sm" title="Elimina Appuntamento (Sposta nel Cestino)">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                               )}
                               <button onClick={() => setDetailModalContactId(appt.contactId)} className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-bold transition shadow-sm">Apri Scheda</button>'''

new_code = re.sub(target, replacement, code)
if new_code == code:
    print("REPLACE FAILED!")
else:
    print("REPLACE SUCCESS!")

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_code)