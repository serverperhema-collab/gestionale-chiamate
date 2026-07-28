"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, Phone, User, FileText, CheckCircle, AlertTriangle, Printer, PhoneCall, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import OutcomeModal from "@/components/OutcomeModal";
import { exportAgendaToPDF } from "@/lib/exportUtils";

export default function CommercialeAgendaClient() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"AGENDA" | "DA_GESTIRE">("AGENDA");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/commerciale/appointments");
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments);
      } else {
        toast.error("Errore di caricamento");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const agendaAppts = appointments.filter(a => a.status !== "DA_GESTIRE_COMMERCIALE");
  const gestitiAppts = appointments.filter(a => a.status === "DA_GESTIRE_COMMERCIALE");

  const displayedAppts = activeTab === "AGENDA" ? agendaAppts : gestitiAppts;

  return (
    <div className="p-4 max-w-2xl mx-auto pb-12">
      
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Area Commerciale</h2>
            <p className="text-sm text-gray-400">Gestisci i tuoi appuntamenti e contatti.</p>
          </div>
          <button
            onClick={() => {
              if (agendaAppts.length > 0) {
                const name = agendaAppts[0]?.commerciale?.name || "Commerciale";
                exportAgendaToPDF(agendaAppts, name, new Date().toLocaleDateString());
              } else {
                toast.error("Nessun appuntamento da stampare nell'Agenda");
              }
            }}
            className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition text-sm"
          >
            <Printer className="w-4 h-4 mr-2 text-blue-400" /> Stampa PDF
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
          <button 
            onClick={() => setActiveTab("AGENDA")}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition ${activeTab === "AGENDA" ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            Agenda Visite ({agendaAppts.length})
          </button>
          <button 
            onClick={() => setActiveTab("DA_GESTIRE")}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition flex items-center justify-center ${activeTab === "DA_GESTIRE" ? 'bg-yellow-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            Da Gestire ({gestitiAppts.length})
            {gestitiAppts.length > 0 && <span className="ml-2 w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : displayedAppts.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center mt-8 shadow-lg">
          <CheckCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Nessun contatto</h3>
          <p className="text-sm text-gray-500">
            {activeTab === "AGENDA" ? "Non hai visite programmate al momento." : "Non hai contatti in gestione diretta."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedAppts.map((appt) => {
            const isUnconfirmed = appt.status === "NOT_CONFIRMED" || appt.status === "PENDING";
            const isDaGestire = appt.status === "DA_GESTIRE_COMMERCIALE";
            
            return (
              <div key={appt.id} className={`bg-gray-900 rounded-2xl border overflow-hidden shadow-lg ${isDaGestire ? 'border-yellow-900/50' : 'border-gray-800'}`}>
                
                {/* Header Card */}
                <div className={`px-4 py-3 border-b flex justify-between items-center ${isDaGestire ? 'bg-yellow-900/20 border-yellow-800/30' : isUnconfirmed ? 'bg-yellow-900/20 border-yellow-800/30' : 'bg-gray-800 border-gray-700'}`}>
                  <div className="flex flex-col">
                    <div className="flex items-center text-sm font-bold text-white">
                      <Clock className="w-4 h-4 mr-2 text-blue-400" />
                      {new Date(appt.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                    {appt.isPhoneAppt && (
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-wider bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-500/50 inline-flex w-max items-center">
                        <PhoneCall className="w-3 h-3 mr-1" /> App. Telefonico
                      </span>
                    )}
                    {appt.isSecondAppt && (
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-wider bg-teal-900/50 text-teal-300 px-2 py-0.5 rounded border border-teal-500/50 inline-flex w-max items-center">
                        <RefreshCw className="w-3 h-3 mr-1" /> 2° Appuntamento
                      </span>
                    )}
                  </div>

                  {isDaGestire ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded border border-yellow-700/50">
                      Gestione Libera
                    </span>
                  ) : isUnconfirmed ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded border border-yellow-700/50 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Da Confermare
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded border border-emerald-700/50">
                      Confermato
                    </span>
                  )}
                </div>

                {/* Body Card */}
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight mb-1">{appt.contact.name}</h3>
                    <div className="flex items-start text-sm text-gray-400">
                      <MapPin className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                      <span>{appt.contact.address} ({appt.contact.cap})</span>
                    </div>
                  </div>

                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 space-y-2">
                    <div className="flex items-center text-sm">
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-300">{appt.referentName} <span className="text-gray-500">({appt.referentRole})</span></span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <a href={`tel:${appt.phone}`} className="text-blue-400 font-medium">{appt.phone}</a>
                    </div>
                    {appt.email && (
                      <div className="flex items-center text-sm">
                        <FileText className="w-4 h-4 mr-2 text-gray-500" />
                        <a href={`mailto:${appt.email}`} className="text-blue-400 font-medium truncate">{appt.email}</a>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Esigenze Cliente</h4>
                    <p className="text-sm text-gray-300 italic bg-gray-900 p-3 rounded-lg border border-gray-800">
                      "{appt.clientNeeds}"
                    </p>
                  </div>

                  {appt.tlNotes && (
                    <div className="bg-blue-900/20 border border-blue-800/30 p-3 rounded-lg">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Note Team Leader</h4>
                      <p className="text-sm text-blue-200">{appt.tlNotes}</p>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => setSelectedApptId(appt.id)}
                    className={`w-full py-3 text-white font-bold rounded-xl transition shadow-lg flex justify-center items-center ${isDaGestire ? 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-900/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'}`}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {isDaGestire ? 'Esita Gestione' : 'Esita Visita'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {selectedApptId && (
        <OutcomeModal
          appointmentId={selectedApptId}
          onClose={() => setSelectedApptId(null)}
          onSuccess={() => {
            setSelectedApptId(null);
            fetchAppointments();
          }}
        />
      )}

    </div>
  );
}
