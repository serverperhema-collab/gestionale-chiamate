"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Phone, MapPin, RefreshCw, FileText, Calendar, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import QuotesClient from "../quotes/QuotesClient";
import ContactDetailModal from "@/components/ContactDetailModal";
import EditAppointmentModal from "@/components/EditAppointmentModal";
import OutcomeModal from "@/components/OutcomeModal";
import { Edit2 } from "lucide-react";
import toast from "react-hot-toast";

export default function OutcomesClient() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"DA_SVOLGERE" | "SVOLTI" | "FUTURI" | "CESTINO" | "QUOTES_REQUESTS" | "QUOTES_RECEIVED">("SVOLTI");
  const [deleteModalApptId, setDeleteModalApptId] = useState<string | null>(null);
  const [deleteAction, setDeleteAction] = useState<"RESTORE" | "BLOCK">("RESTORE");
  const [outcomeModalApptId, setOutcomeModalApptId] = useState<string | null>(null);
  const [blockDays, setBlockDays] = useState(30);
  const [commerciali, setCommerciali] = useState<any[]>([]);
  const [selectedCommerciale, setSelectedCommerciale] = useState("");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [detailModalContactId, setDetailModalContactId] = useState<string | null>(null);
  const [editModalAppt, setEditModalAppt] = useState<any | null>(null);
  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tl/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success("Stato aggiornato!");
        fetchData();
      } else {
        toast.error("Errore aggiornamento");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  const handleDeleteAppointment = async () => {
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/tl/outcomes", window.location.origin);
      if (selectedCommerciale) url.searchParams.append("commercialeId", selectedCommerciale);
      
      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setData(json.appointments || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Errore nel caricamento appuntamenti");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommerciali = async () => {
    try {
      const res = await fetch("/api/users?role=COMMERCIALE");
      if (res.ok) {
        const json = await res.json();
        setCommerciali(json.users || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchCommerciali();
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCommerciale]);

  // Filtriamo i dati nelle 3 liste
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cestino = data.filter(a => a.status === "CANCELLED");

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
  };

  const displayedData = getDisplayedData();

  return (
    <div className="p-6 max-w-[1600px] w-full mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Appuntamenti & Preventivi</h1>
          <p className="text-gray-400">Monitora gli appuntamenti e gli esiti dei commerciali.</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        
        {/* Menu Laterale */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          <span className="text-sm font-bold text-white uppercase tracking-wider mb-1 block px-1">Area Appuntamenti</span>
          <button 
            onClick={() => setActiveTab("DA_SVOLGERE")}
            className={`w-full text-left px-4 py-4 rounded-xl border transition flex flex-col ${activeTab === "DA_SVOLGERE" ? 'bg-orange-600/20 border-orange-500 text-orange-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
          >
            <span className="font-bold text-lg mb-1">Da Esitare</span>
            <span className="text-xs opacity-80">Svolti SENZA Esito ({daSvolgere.length})</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("SVOLTI")}
            className={`w-full text-left px-4 py-4 rounded-xl border transition flex flex-col ${activeTab === "SVOLTI" ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
          >
            <span className="font-bold text-lg mb-1">Esitati</span>
            <span className="text-xs opacity-80">Svolti CON Esito ({svolti.length})</span>
          </button>
          
          <button 
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
          
          <div className="mt-4 pt-4 border-t border-gray-800">
            <span className="text-sm font-bold text-white uppercase tracking-wider mb-3 block px-1">Area Preventivi</span>
            <button 
              onClick={() => setActiveTab("QUOTES_REQUESTS")}
              className={`w-full text-left px-4 py-4 rounded-xl border transition flex flex-col mb-2 ${activeTab === "QUOTES_REQUESTS" ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
            >
              <span className="font-bold text-lg mb-1">In Attesa</span>
              <span className="text-xs opacity-80">Richieste da gestire</span>
            </button>
            
            <button 
              onClick={() => setActiveTab("QUOTES_RECEIVED")}
              className={`w-full text-left px-4 py-4 rounded-xl border transition flex flex-col ${activeTab === "QUOTES_RECEIVED" ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
            >
              <span className="font-bold text-lg mb-1">Inviati</span>
              <span className="text-xs opacity-80">Caricati dal commerciale</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">
{(activeTab === "QUOTES_REQUESTS" || activeTab === "QUOTES_RECEIVED") ? (
  <QuotesClient externalTab={activeTab === "QUOTES_REQUESTS" ? "REQUESTS" : "RECEIVED"} />
) : (
  <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Filters */}
        <div className="p-4 border-b border-gray-800 flex flex-wrap gap-4 items-center bg-gray-900/50 shrink-0">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={selectedCommerciale} onChange={e => setSelectedCommerciale(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500 w-48">
              <option value="">Tutti i Commerciali</option>
              {commerciali.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1"></div>
          <button onClick={fetchData} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-md text-sm flex items-center transition">
            <RefreshCw className="w-4 h-4 mr-2 text-gray-400" /> Aggiorna
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
             <div className="flex justify-center items-center h-full">
               <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : displayedData.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-500">
               <FileText className="w-16 h-16 mb-4 opacity-50" />
               <p className="text-lg">Nessun appuntamento trovato in questa sezione.</p>
             </div>
          ) : (
             <div className="space-y-4 w-full">
               {displayedData.map((appt: any) => {
                 const outcome = appt.outcomes?.[0]; // Get the first outcome if it exists
                 const isOverdue = new Date(appt.date) < new Date() && appt.status !== "DONE";
                   const isDone = appt.status === "DONE";
                   const borderColor = isDone ? "border-emerald-500" : isOverdue ? "border-red-500" : "border-blue-500";
                   return (
                     <div key={appt.id} className={`bg-gray-800 border border-gray-700 border-l-4 ${borderColor} rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:border-gray-500 transition`}>
                     
                     <div className="px-5 py-3 border-b border-gray-700/50 flex flex-wrap justify-between items-center bg-gray-900/40 gap-3">
                        <div className="flex items-center space-x-3">
                           <span className={`text-sm font-medium ${new Date(appt.date) < today && activeTab === "DA_SVOLGERE" ? 'text-red-400' : 'text-gray-400'}`}>
                             <Calendar className="w-4 h-4 inline mr-1" />
                             {new Date(appt.date).toLocaleDateString()}
                           </span>
                           <span className="text-gray-600 text-sm">?</span>
                           <span className="text-gray-300 text-sm font-medium flex items-center">
                             <Phone className="w-3.5 h-3.5 mr-1" /> {appt.commerciale?.name || "Nessuno"}
                           </span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                             <button onClick={() => setEditModalAppt(appt)} className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-600 rounded-lg transition shadow-sm" title="Modifica Appuntamento">
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
                             <button onClick={() => setDetailModalContactId(appt.contactId)} className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-bold transition shadow-sm">Apri Scheda</button>
                             {outcome ? (
                              <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
                                outcome.outcomeFinal === "VENDUTO" ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700/50' : 
                                outcome.outcomeFinal === "KO" ? 'bg-red-900/50 text-red-400 border-red-700/50' :
                                outcome.skipReason ? 'bg-orange-900/50 text-orange-400 border-orange-700/50' :
                                'bg-blue-900/50 text-blue-400 border-blue-700/50'
                              }`}>
                                {outcome.skipReason ? (outcome.skipReason === "SALTATO_CLIENTE" ? "Saltato: Cliente" : "Saltato: Commerciale") : outcome.outcomeFinal?.replace("_", " ")}
                              </span>
                           ) : (
                              <select 
                                  value={appt.status} 
                                  onChange={(e) => updateAppointmentStatus(appt.id, e.target.value)}
                                  className="bg-gray-800 text-gray-300 border border-gray-600 hover:border-gray-500 cursor-pointer text-xs px-2 py-1 rounded font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                                >
                                  <option value="PENDING">IN ATTESA</option>
                                  <option value="CONFIRMED">CONFERMATO</option>
                                  <option value="DONE">SVOLTO</option>
                                  <option value="CANCELED">ANNULLATO</option>
                                </select>
                           )}
                        </div>
                     </div>

                     <div className="p-5">
                       <h3 className="text-lg font-bold text-white mb-2">{appt.contact.name}</h3>
                       <div className="flex items-center text-sm text-gray-400 mb-4">
                         <MapPin className="w-4 h-4 mr-1.5 shrink-0" />
                         <span>{appt.contact.address} ({appt.contact.cap})</span>
                       </div>

                       {outcome && (
                         <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
                           <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Note della Visita</h4>
                           <p className="text-sm text-gray-300 whitespace-pre-wrap">{outcome.notes}</p>
                         </div>
                       )}
                       {!outcome && appt.tlNotes && (
                         <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
                           <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Note Fissaggio (TL)</h4>
                           <p className="text-sm text-gray-300 whitespace-pre-wrap">{appt.tlNotes}</p>
                         </div>
                       )}

                       {/* Extra info for SVOLTI */}
                       {outcome && (
                         <div className="mt-4 flex flex-wrap gap-2">
                           {outcome.quoteAttached && (
                             <span className="bg-purple-900/30 text-purple-400 text-xs px-2 py-1 rounded border border-purple-800/50 flex items-center">
                               Preventivo Allegato
                             </span>
                           )}
                           {outcome.quoteRequested && (
                             <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded border border-blue-800/50 flex items-center">
                               Preventivo Richiesto
                             </span>
                           )}
                           {outcome.nextActionType && (
                             <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700 flex items-center">
                               {outcome.nextActionType === "RICHIAMO" 
                                 ? `Richiamo ${outcome.nextActionTarget === "OPERATORE" ? "Operatore" : "Commerciale"} il ${new Date(outcome.nextActionDate).toLocaleDateString()}` 
                                 : "Vuole fissare 2 App."}
                             </span>
                           )}
                         </div>
                       )}

                     </div>
                   </div>
                 );
               })}
             </div>
          )}
        </div>
      </div>
      )}
      </div>
    </div>

      {detailModalContactId && (
        <ContactDetailModal contactId={detailModalContactId} onClose={() => setDetailModalContactId(null)} />
      )}
      {deleteModalApptId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-red-500/30 rounded-xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center">
              <Trash2 className="w-6 h-6 mr-2" /> Elimina Appuntamento
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Come gestiamo il contatto associato a questo appuntamento?
            </p>
            
            <div className="space-y-3 mb-6">
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${deleteAction === 'RESTORE' ? 'bg-indigo-900/20 border-indigo-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}>
                <input type="radio" checked={deleteAction === 'RESTORE'} onChange={() => setDeleteAction('RESTORE')} className="mt-1" />
                <div>
                  <div className="font-bold text-white">Ripristina nel Calderone</div>
                  <div className="text-xs text-gray-400">Torna immediatamente disponibile per essere richiamato.</div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${deleteAction === 'BLOCK' ? 'bg-orange-900/20 border-orange-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}>
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

      {outcomeModalApptId && (
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
        <EditAppointmentModal appt={editModalAppt} onClose={() => setEditModalAppt(null)} onSaved={() => { setEditModalAppt(null); fetchData(); }} />
      )}

    </div>
  );
}
