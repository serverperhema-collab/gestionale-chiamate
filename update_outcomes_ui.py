# -*- coding: utf-8 -*-
import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. State changes
target_state = """  const [activeTab, setActiveTab] = useState<"DA_SVOLGERE" | "SVOLTI" | "FUTURI" | "QUOTES_REQUESTS" | "QUOTES_RECEIVED">("SVOLTI");"""
replacement_state = """  const [activeTab, setActiveTab] = useState<"DA_SVOLGERE" | "SVOLTI" | "FUTURI" | "CESTINO" | "QUOTES_REQUESTS" | "QUOTES_RECEIVED">("SVOLTI");
  const [deleteModalApptId, setDeleteModalApptId] = useState<string | null>(null);
  const [deleteAction, setDeleteAction] = useState<"RESTORE" | "BLOCK">("RESTORE");
  const [blockDays, setBlockDays] = useState(30);"""
code = code.replace(target_state, replacement_state)

# 2. Add Delete function
target_fetch = """  const fetchData = async () => {"""
replacement_fetch = """  const handleDeleteAppointment = async () => {
    if (!deleteModalApptId) return;
    try {
      const res = await fetch(`/api/tl/appointments/${deleteModalApptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED", contactAction: deleteAction, blockDays })
      });
      if (res.ok) {
        toast.success("Appuntamento eliminato e spostato nel cestino!");
        setDeleteModalApptId(null);
        fetchData();
      } else {
        toast.error("Errore durante l'eliminazione");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  const fetchData = async () => {"""
code = code.replace(target_fetch, replacement_fetch)

# 3. Filter arrays
target_filter = """  const daSvolgere = data.filter(a => {
    if (a.status === "DONE" || (a.outcomes && a.outcomes.length > 0)) return false;
    const date = new Date(a.date);
    date.setHours(0,0,0,0);
    return date < today;
  });

  const futuri = data.filter(a => {
    if (a.status === "DONE" || (a.outcomes && a.outcomes.length > 0)) return false;
    const date = new Date(a.date);
    date.setHours(0,0,0,0);
    return date >= today;
  });

  const svolti = data.filter(a => a.status === "DONE" || (a.outcomes && a.outcomes.length > 0));

  const getDisplayedData = () => {
    if (activeTab === "DA_SVOLGERE") return daSvolgere;
    if (activeTab === "FUTURI") return futuri;
    return svolti;
  };"""

replacement_filter = """  const cestino = data.filter(a => a.status === "CANCELLED");

  const daSvolgere = data.filter(a => {
    if (a.status === "CANCELLED") return false;
    if (a.status === "DONE" || (a.outcomes && a.outcomes.length > 0)) return false;
    const date = new Date(a.date);
    date.setHours(0,0,0,0);
    return date < today;
  });

  const futuri = data.filter(a => {
    if (a.status === "CANCELLED") return false;
    if (a.status === "DONE" || (a.outcomes && a.outcomes.length > 0)) return false;
    const date = new Date(a.date);
    date.setHours(0,0,0,0);
    return date >= today;
  });

  const svolti = data.filter(a => (a.status === "DONE" || (a.outcomes && a.outcomes.length > 0)) && a.status !== "CANCELLED");

  const getDisplayedData = () => {
    if (activeTab === "DA_SVOLGERE") return daSvolgere;
    if (activeTab === "FUTURI") return futuri;
    if (activeTab === "CESTINO") return cestino;
    return svolti;
  };"""

code = code.replace(target_filter, replacement_filter)

# 4. Tab UI
target_tab_ui = """          <button 
            onClick={() => setActiveTab("FUTURI")}
            className={`w-full text-left px-4 py-4 rounded-xl border transition flex flex-col ${activeTab === "FUTURI" ? 'bg-teal-600/20 border-teal-500 text-teal-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
          >
            <span className="font-bold text-lg mb-1">In Agenda</span>
            <span className="text-xs opacity-80">Futuri / Oggi ({futuri.length})</span>
          </button>
          
          <div className="mt-4 pt-4 border-t border-gray-800">"""

replacement_tab_ui = """          <button 
            onClick={() => setActiveTab("FUTURI")}
            className={`w-full text-left px-4 py-4 rounded-xl border transition flex flex-col ${activeTab === "FUTURI" ? 'bg-teal-600/20 border-teal-500 text-teal-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
          >
            <span className="font-bold text-lg mb-1">In Agenda</span>
            <span className="text-xs opacity-80">Futuri / Oggi ({futuri.length})</span>
          </button>

          <button 
            onClick={() => setActiveTab("CESTINO")}
            className={`w-full text-left px-4 py-4 rounded-xl border transition flex flex-col ${activeTab === "CESTINO" ? 'bg-red-600/20 border-red-500 text-red-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
          >
            <span className="font-bold text-lg mb-1">Cestino</span>
            <span className="text-xs opacity-80">Eliminati ({cestino.length})</span>
          </button>
          
          <div className="mt-4 pt-4 border-t border-gray-800">"""

code = code.replace(target_tab_ui, replacement_tab_ui)

# 5. Add "Elimina" button on card
target_card_btn = """                      <button onClick={() => setEditModalAppt(app)} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded border border-gray-700 transition" title="Modifica Appuntamento">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDetailModalContactId(app.contact.id)} className="px-3 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 text-xs font-bold rounded border border-blue-500/30 transition">
                        Apri Scheda
                      </button>"""

replacement_card_btn = """                      <button onClick={() => setEditModalAppt(app)} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded border border-gray-700 transition" title="Modifica Appuntamento">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {app.status !== "CANCELLED" && (
                        <button onClick={() => setDeleteModalApptId(app.id)} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded border border-red-500/20 transition" title="Elimina Appuntamento">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setDetailModalContactId(app.contact.id)} className="px-3 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 text-xs font-bold rounded border border-blue-500/30 transition">
                        Apri Scheda
                      </button>"""

code = code.replace(target_card_btn, replacement_card_btn)

# 5.1 Import Trash2
target_import = """import { Search, Filter, Phone, MapPin, RefreshCw, FileText, Calendar, CheckCircle, AlertCircle } from "lucide-react";"""
replacement_import = """import { Search, Filter, Phone, MapPin, RefreshCw, FileText, Calendar, CheckCircle, AlertCircle, Trash2 } from "lucide-react";"""
code = code.replace(target_import, replacement_import)


# 6. Delete Modal
target_modal = """      {editModalAppt && (
        <EditAppointmentModal"""

replacement_modal = """      {deleteModalApptId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-red-500/30 rounded-xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center">
              <Trash2 className="w-6 h-6 mr-2" /> Elimina Appuntamento
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Come gestiamo il contatto associato a questo appuntamento?
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${deleteAction === 'RESTORE' ? 'bg-indigo-900/20 border-indigo-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}">
                <input type="radio" checked={deleteAction === 'RESTORE'} onChange={() => setDeleteAction('RESTORE')} className="mt-1" />
                <div>
                  <div className="font-bold text-white">Ripristina nel Calderone</div>
                  <div className="text-xs text-gray-400">Torna immediatamente disponibile per essere richiamato.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${deleteAction === 'BLOCK' ? 'bg-orange-900/20 border-orange-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}">
                <input type="radio" checked={deleteAction === 'BLOCK'} onChange={() => setDeleteAction('BLOCK')} className="mt-1" />
                <div className="w-full">
                  <div className="font-bold text-white">Blocca Temporaneamente</div>
                  <div className="text-xs text-gray-400 mb-2">Nascondi dal calderone per un po' di tempo.</div>
                  {deleteAction === 'BLOCK' && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-400">Blocca per</span>
                      <input type="number" min="1" value={blockDays} onChange={(e) => setBlockDays(parseInt(e.target.value)||1)} className="w-16 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-center text-white" />
                      <span className="text-sm text-gray-400">giorni</span>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModalApptId(null)} className="px-4 py-2 text-gray-400 hover:text-white">Annulla</button>
              <button onClick={handleDeleteAppointment} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition shadow-lg shadow-red-900/50">
                Conferma Eliminazione
              </button>
            </div>
          </div>
        </div>
      )}

      {editModalAppt && (
        <EditAppointmentModal"""

code = code.replace(target_modal, replacement_modal)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)