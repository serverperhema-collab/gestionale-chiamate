# -*- coding: utf-8 -*-
import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target_import = """import EditAppointmentModal from "@/components/EditAppointmentModal";"""
replacement_import = """import EditAppointmentModal from "@/components/EditAppointmentModal";
import OutcomeModal from "@/components/OutcomeModal";"""
code = code.replace(target_import, replacement_import)

target_state = """  const [deleteAction, setDeleteAction] = useState<"RESTORE" | "BLOCK">("RESTORE");"""
replacement_state = """  const [deleteAction, setDeleteAction] = useState<"RESTORE" | "BLOCK">("RESTORE");
  const [outcomeModalApptId, setOutcomeModalApptId] = useState<string | null>(null);"""
code = code.replace(target_state, replacement_state)

target_btn = """                      {app.status !== "CANCELLED" && (
                        <button onClick={() => setDeleteModalApptId(app.id)} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded border border-red-500/20 transition" title="Elimina Appuntamento">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setDetailModalContactId(app.contact.id)} className="px-3 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 text-xs font-bold rounded border border-blue-500/30 transition">
                        Apri Scheda
                      </button>"""

replacement_btn = """                      {app.status !== "CANCELLED" && (
                        <button onClick={() => setOutcomeModalApptId(app.id)} className="p-2 bg-indigo-900/20 hover:bg-indigo-900/40 text-indigo-400 hover:text-indigo-300 rounded border border-indigo-500/20 transition" title="Registra/Modifica Esito">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {app.status !== "CANCELLED" && (
                        <button onClick={() => setDeleteModalApptId(app.id)} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded border border-red-500/20 transition" title="Elimina Appuntamento">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setDetailModalContactId(app.contact.id)} className="px-3 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 text-xs font-bold rounded border border-blue-500/30 transition">
                        Apri Scheda
                      </button>"""
code = code.replace(target_btn, replacement_btn)

target_modal = """      {editModalAppt && (
        <EditAppointmentModal"""
replacement_modal = """      {outcomeModalApptId && (
        <OutcomeModal
          appointmentId={outcomeModalApptId}
          onClose={() => setOutcomeModalApptId(null)}
          onSuccess={() => {
            setOutcomeModalApptId(null);
            fetchData();
          }}
        />
      )}

      {editModalAppt && (
        <EditAppointmentModal"""
code = code.replace(target_modal, replacement_modal)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)