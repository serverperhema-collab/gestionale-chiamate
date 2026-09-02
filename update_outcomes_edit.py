import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Imports
if 'EditAppointmentModal' not in code:
    code = code.replace('import ContactDetailModal from "@/components/ContactDetailModal";', 'import ContactDetailModal from "@/components/ContactDetailModal";\nimport EditAppointmentModal from "@/components/EditAppointmentModal";\nimport { Edit2 } from "lucide-react";')

# State
if 'editModalAppt' not in code:
    code = code.replace('const [detailModalContactId, setDetailModalContactId] = useState<string | null>(null);', 'const [detailModalContactId, setDetailModalContactId] = useState<string | null>(null);\n  const [editModalAppt, setEditModalAppt] = useState<any | null>(null);')

# Button
btn_target = """<button onClick={() => setDetailModalContactId(appt.contactId)} className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-bold transition shadow-sm">Apri Scheda</button>"""
btn_replacement = """<button onClick={() => setEditModalAppt(appt)} className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-600 rounded-lg transition shadow-sm" title="Modifica Appuntamento">
                               <Edit2 className="w-4 h-4" />
                             </button>
                             <button onClick={() => setDetailModalContactId(appt.contactId)} className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-bold transition shadow-sm">Apri Scheda</button>"""
code = code.replace(btn_target, btn_replacement)

# Modal render
end_target = """      {detailModalContactId && (
        <ContactDetailModal contactId={detailModalContactId} onClose={() => setDetailModalContactId(null)} />
      )}"""
end_replacement = """      {detailModalContactId && (
        <ContactDetailModal contactId={detailModalContactId} onClose={() => setDetailModalContactId(null)} />
      )}
      {editModalAppt && (
        <EditAppointmentModal appt={editModalAppt} onClose={() => setEditModalAppt(null)} onSaved={() => { setEditModalAppt(null); fetchData(); }} />
      )}"""
code = code.replace(end_target, end_replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
