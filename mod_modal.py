import sys

path = 'src/components/ContactDetailModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add translation function
translation_code = """
const translateAction = (action: string) => {
  const map: Record<string, string> = {
    "LOGIN": "Accesso",
    "LOGOUT": "Uscita",
    "FORCE_LOGOUT": "Disconnessione Forzata",
    "AUTO_LOGOUT": "Disconnessione Automatica",
    "TIME_ADJUSTMENT": "Modifica Orario",
    "CONTACT_EXTRACTED": "Contatto Pescato",
    "APPOINTMENT_SCHEDULED": "Fissato Appuntamento",
    "TL_CREATED_APPOINTMENT": "TL ha Fissato Appuntamento",
    "TL_APPOINTMENT_ACTION": "TL ha Gestito Appuntamento",
    "CALL": "Chiamata Effettuata",
    "FORCE_ASSIGN": "Assegnazione Forzata (TL)",
    "FORCE_UNASSIGN": "Rimozione Assegnazione (TL)",
    "REVIEW_REQUESTED": "Richiesta Revisione/Scarto",
    "REVIEW_APPROVED": "Scarto Approvato",
    "REVIEW_REJECTED": "Scarto Rifiutato",
    "TRASH": "Cestinato",
    "RECALL": "Richiamo Impostato",
    "RECALL_UPDATED": "Richiamo Modificato",
    "NEGOTIATION_STARTED": "Trattativa Iniziata",
    "NEGOTIATION_UPDATED": "Trattativa Aggiornata"
  };
  return map[action] || action;
};
"""

# Insert translation function before the return statement
code = code.replace('  return (\n    <div className="fixed inset-0', translation_code + '\n  return (\n    <div className="fixed inset-0')

# Apply translation to logs and print hiding
target_log = """<div className="w-full md:w-1/2 flex flex-col h-[500px] md:h-auto">
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md flex flex-col h-full">"""

replacement_log = """<div className="w-full md:w-1/2 flex flex-col h-[500px] md:h-auto print:hidden">
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md flex flex-col h-full">"""

code = code.replace(target_log, replacement_log)

code = code.replace('<p className="font-bold text-white mb-1">{log.action}</p>', '<p className="font-bold text-white mb-1">{translateAction(log.action)}</p>')

# Add Stampa button next to the close button
header_target = """          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition">
            <X className="w-6 h-6" />
          </button>"""

header_replacement = """          <div className="flex items-center space-x-2">
            <button onClick={() => window.print()} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-600 text-sm font-medium transition print:hidden flex items-center">
              <FileText className="w-4 h-4 mr-2" /> Stampa
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition print:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>"""

code = code.replace(header_target, header_replacement)

# Make sure the modal covers the full screen when printing, or just add print classes to the background
code = code.replace('<div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">', '<div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 print:bg-white print:p-0">')
code = code.replace('<div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">', '<div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:bg-white print:border-none print:shadow-none print:max-w-full print:h-auto print:max-h-full print:overflow-visible text-white print:text-black">')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
