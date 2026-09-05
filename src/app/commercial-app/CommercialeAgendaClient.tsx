"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, Phone, User, FileText, CheckCircle, AlertTriangle, Printer, PhoneCall, RefreshCw, Handshake, XCircle, PauseCircle, Bell, History } from "lucide-react";
import toast from "react-hot-toast";
import OutcomeModal from "@/components/OutcomeModal";
import AppointmentModal from "@/components/AppointmentModal";
import TrattativaTimeline from "@/components/TrattativaTimeline"; // TO DO

type TabType =
  | "DA_SVOLGERE"
  | "TRATTATIVE_CORSO"
  | "PREVENTIVI"
  | "SOSPESE"
  | "CHIUSE_VINTE"
  | "CHIUSE_PERSE"
  | "NOTIFICHE";

export default function CommercialeAgendaClient() {
  const [trattative, setTrattative] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedTrattativaId, setSelectedTrattativaId] = useState<string | null>(null);
  
  const [timelineTrattativaId, setTimelineTrattativaId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>("DA_SVOLGERE");

  const fetchData = async () => {
    try {
      setLoading(true);
      // FASE 4: Fetch dal nuovo sistema
      const res = await fetch("/api/trattative?commercialeId=me");
      if (res.ok) {
        const data = await res.json();
        setTrattative(data.trattative || []);
      } else {
        toast.error("Errore caricamento ST");
      }
    } catch {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getFilteredSTs = () => {
    switch (activeTab) {
      case "DA_SVOLGERE":
        return trattative.filter(st => st.status === "APPUNTAMENTO");
      case "TRATTATIVE_CORSO":
        return trattative.filter(st => st.status === "TRATTATIVA_IN_CORSO");
      case "PREVENTIVI":
        return trattative.filter(st => st.status === "PREVENTIVO");
      case "SOSPESE":
        return trattative.filter(st => st.status === "SOSPESA");
      case "CHIUSE_VINTE":
        return trattative.filter(st => st.status === "CHIUSA_VINTA");
      case "CHIUSE_PERSE":
        return trattative.filter(st => st.status === "CHIUSA_PERSA");
      default:
        return [];
    }
  };

  const displayedSTs = getFilteredSTs();

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden relative">
      <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-950 shrink-0">
        <h1 className="text-2xl font-black text-white uppercase tracking-wider">Agenda e Trattative</h1>
        <button onClick={fetchData} className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* TABS SIDEBAR */}
        <div className="w-64 border-r border-gray-800 bg-gray-950 p-4 space-y-2 shrink-0 overflow-y-auto">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Operativo</div>
          <TabButton id="DA_SVOLGERE" label="Appuntamenti" active={activeTab} setActive={setActiveTab} color="bg-blue-900/40 border-blue-500/50 text-blue-100" count={trattative.filter(st => st.status === "APPUNTAMENTO").length} />
          <TabButton id="TRATTATIVE_CORSO" label="In Corso" active={activeTab} setActive={setActiveTab} color="bg-indigo-900/40 border-indigo-500/50 text-indigo-100" count={trattative.filter(st => st.status === "TRATTATIVA_IN_CORSO").length} />
          <TabButton id="PREVENTIVI" label="Preventivi" active={activeTab} setActive={setActiveTab} color="bg-purple-900/40 border-purple-500/50 text-purple-100" count={trattative.filter(st => st.status === "PREVENTIVO").length} />
          <TabButton id="SOSPESE" label="Sospese" active={activeTab} setActive={setActiveTab} color="bg-orange-900/40 border-orange-500/50 text-orange-100" count={trattative.filter(st => st.status === "SOSPESA").length} />
          
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-6 mb-3">Storico</div>
          <TabButton id="CHIUSE_VINTE" label="Contratti" active={activeTab} setActive={setActiveTab} color="bg-emerald-900/40 border-emerald-500/50 text-emerald-100" count={trattative.filter(st => st.status === "CHIUSA_VINTA").length} />
          <TabButton id="CHIUSE_PERSE" label="KO" active={activeTab} setActive={setActiveTab} color="bg-red-900/40 border-red-500/50 text-red-100" count={trattative.filter(st => st.status === "CHIUSA_PERSA").length} />
        </div>

        {/* LISTA */}
        <div className="flex-1 p-6 overflow-y-auto relative bg-black custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : displayedSTs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <CheckCircle className="w-16 h-16 text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nessun elemento</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedSTs.map(st => {
                const currentAppt = st.appointments?.find((a: any) => a.id === st.currentAppointmentId);
                const contact = st.contact;

                return (
                  <div key={st.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-lg">
                    <div className="px-4 py-3 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm font-bold text-white">
                          <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                          {contact.name} - {contact.cap}
                        </div>
                        {currentAppt && (
                          <div className="flex items-center mt-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(currentAppt.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                            {currentAppt.isPhoneAppt && <span className="ml-2 bg-purple-900/50 text-purple-300 px-1 py-0.5 rounded border border-purple-500/50">Telefonico</span>}
                            {currentAppt.rescheduleCount > 0 && <span className="ml-2 bg-amber-900/50 text-amber-300 px-1 py-0.5 rounded border border-amber-500/50">Rifissato {currentAppt.rescheduleCount}</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded border border-blue-700/50">
                          {st.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col md:flex-row gap-4 justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 space-y-2">
                          <div className="flex items-center text-sm"><User className="w-4 h-4 text-gray-500 mr-2" /><span className="text-gray-300"><strong className="text-white">{st.referentName || "N/D"}</strong> - {st.referentRole || "N/D"}</span></div>
                          <div className="flex items-center text-sm"><Phone className="w-4 h-4 text-gray-500 mr-2" /><span className="text-blue-400 font-mono">{st.commercialPhone || contact.originalPhone}</span></div>
                          <div className="flex items-start text-sm"><FileText className="w-4 h-4 text-gray-500 mr-2 mt-0.5" /><span className="text-gray-300 italic">"{st.clientNeeds || "Nessuna nota"}"</span></div>
                          {st.outcomeFinal && (
                            <div className="mt-2 pt-2 border-t border-gray-800 text-sm flex items-start">
                              <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 mt-0.5" />
                              <span className="text-gray-300">Ultimo Esito: <strong className="text-white">{st.outcomeFinal}</strong> - {st.outcomeNotes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[150px] justify-center">
                        <button onClick={() => setTimelineTrattativaId(st.id)} className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition flex items-center justify-center border border-gray-700">
                          <History className="w-4 h-4 mr-2" /> Timeline
                        </button>
                        
                        {st.status === "APPUNTAMENTO" && currentAppt && (
                          <button onClick={() => { setSelectedAppointmentId(currentAppt.id); setSelectedTrattativaId(st.id); }} className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-blue-900/20">
                            Inserisci Esito
                          </button>
                        )}
                        {st.status === "TRATTATIVA_IN_CORSO" && (
                          <button onClick={() => { setSelectedTrattativaId(st.id); /* Open update status modal */ }} className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition shadow-lg">
                            Aggiorna Stato
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODALI */}
      {selectedAppointmentId && selectedTrattativaId && (
        <OutcomeModal
          appointmentId={selectedAppointmentId}
          trattativaId={selectedTrattativaId}
          onClose={() => { setSelectedAppointmentId(null); setSelectedTrattativaId(null); }}
          onSuccess={() => { setSelectedAppointmentId(null); setSelectedTrattativaId(null); fetchData(); }}
        />
      )}

      {timelineTrattativaId && (
        <TrattativaTimeline
          trattativaId={timelineTrattativaId}
          onClose={() => setTimelineTrattativaId(null)}
        />
      )}
    </div>
  );
}

function TabButton({ id, label, count, active, setActive, color }: { id: TabType; label: string; count: number; active: TabType; setActive: (t: TabType) => void; color: string }) {
  const isActive = active === id;
  return (
    <button
      onClick={() => setActive(id)}
      className={`w-full text-left px-3 py-2.5 rounded-lg border transition flex items-center justify-between ${isActive ? color : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750"}`}
    >
      <span className="font-semibold text-sm">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-black/20 text-white" : "bg-gray-700 text-gray-300"}`}>{count}</span>
    </button>
  );
}