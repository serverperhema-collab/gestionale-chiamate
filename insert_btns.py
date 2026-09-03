# -*- coding: utf-8 -*-
import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'Apri Scheda</button>' in line and 'setDetailModalContactId' in line:
        # Insert our buttons before it
        new_lines.append('                               {appt.status !== "CANCELLED" && (\n')
        new_lines.append('                                <button onClick={() => setOutcomeModalApptId(appt.id)} className="p-1.5 bg-indigo-900/20 hover:bg-indigo-900/40 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-lg transition shadow-sm" title="Registra/Modifica Esito">\n')
        new_lines.append('                                  <CheckCircle className="w-4 h-4" />\n')
        new_lines.append('                                </button>\n')
        new_lines.append('                               )}\n')
        new_lines.append('                               {appt.status !== "CANCELLED" && (\n')
        new_lines.append('                                <button onClick={() => setDeleteModalApptId(appt.id)} className="p-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg transition shadow-sm" title="Elimina Appuntamento (Sposta nel Cestino)">\n')
        new_lines.append('                                  <Trash2 className="w-4 h-4" />\n')
        new_lines.append('                                </button>\n')
        new_lines.append('                               )}\n')
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("DONE")