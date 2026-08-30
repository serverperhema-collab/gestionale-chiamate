"use client";

import { useState, useEffect } from "react";
import { Calendar, User, Clock, AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import AppointmentModal from "@/components/AppointmentModal";

export default function OperatorAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentContactId, setAppointmentContactId] = useState("");
  const [appointmentContactCap, setAppointmentContactCap] = useState("");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/operator/appointments");
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

  const getStatusBadge = (appt: any) => {
    if (appt.status === "CANCELLED") {
      return <span className="bg-red-900/50 text-red-400 border border-red-700/50 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">Rimbalzato TL</span>;
    }
    if (appt.isDeroga && !appt.isApproved) {
      return <span className="bg-yellow-900/50 text-yellow-400 border border-yellow-700/50 text-xs px-2 py-1 rounded">Deroga in Attesa</span>;
    }
    if (appt.status === "PENDING") {
      return <span className="bg-blue-900/50 text-blue-400 border border-blue-700/50 text-xs px-2 py-1 rounded">In Attesa TL</span>;
    }
    if (appt.status === "CONFIRMED") {
      return <span className="bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 text-xs px-2 py-1 rounded">Confermato</span>;
    }
    if (appt.status === "DONE" || appt.status === "NOT_CONFIRMED") {
      return <span className="bg-gray-800 text-gray-400 border border-gray-600 text-xs px-2 py-1 rounded">Passato</span>;
    }
    return <span className="bg-gray-800 text-gray-400 border border-gray-600 text-xs px-2 py-1 rounded">{appt.status}</span>;
  };

  return (
    <div className="flex-1 p-8 bg-gray-900 min-h-screen text-gray-100">
      <div className="mb-6">
        <Link href="/operator-terminal" className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition shadow-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna al Terminale
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center">
          <Calendar className="w-6 h-6 mr-3 text-emerald-400" />
          I Miei Appuntamenti
        </h2>
        <p className="text-gray-400 mt-1">
          Monitora lo stato degli appuntamenti che hai fissato e rifissa quelli rimbalzati.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center shadow-lg">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nessun appuntamento</h3>
          <p className="text-gray-400">Non hai ancora fissato nessun appuntamento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {appointments.map((appt) => {
            const isBounced = appt.status === "CANCELLED";
            
            return (
              <div key={appt.id} className={`bg-gray-800 rounded-xl border p-6 shadow-lg relative flex flex-col ${isBounced ? 'border-red-500/50 shadow-red-900/20' : 'border-gray-700'}`}>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-white mb-1">{appt.contact.name}</h3>
                    <p className="text-xs text-gray-500">{appt.contact.address} ({appt.contact.cap})</p>
                    {isBounced && (
                      <p className="text-sm font-mono text-gray-400 mt-1">{appt.contact.originalPhone}</p>
                    )}
                  </div>
                  <div>{getStatusBadge(appt)}</div>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 mb-4">
                  <div className={`flex items-center text-sm font-medium ${isBounced ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                    <Clock className="w-4 h-4 mr-2 text-blue-400" />
                    {new Date(appt.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                  {!isBounced && (
                    <div className="flex items-center text-sm text-gray-300 mt-2">
                      <User className="w-4 h-4 mr-2 text-purple-400" />
                      Comm: {appt.commerciale?.name || "Da Assegnare"}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  {appt.tlNotes && (
                    <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg text-sm text-blue-300">
                      <span className="font-bold block mb-1">Nota TL:</span>
                      {appt.tlNotes}
                    </div>
                  )}

                  {appt.status === "DONE" && appt.outcomes && appt.outcomes.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-950 border border-gray-700 rounded-lg text-sm text-gray-300 shadow-inner">
                      <div className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-2 flex justify-between items-center">
                        Esito Commerciale
                        {appt.outcomes[0].quoteRequested && (
                           <span className="text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded border border-purple-800">Preventivo Richiesto</span>
                        )}
                      </div>
                      <div className={`font-bold text-lg mb-2 ${
                        appt.outcomes[0].outcomeFinal === 'VENDUTO' ? 'text-emerald-400' :
                        appt.outcomes[0].outcomeFinal === 'KO' ? 'text-red-400' :
                        'text-blue-400'
                      }`}>
                        {appt.outcomes[0].outcomeFinal.replace("_", " ")}
                      </div>
                      <div className="italic bg-gray-900 p-2 rounded border border-gray-800 text-gray-400">
                        "{appt.outcomes[0].notes}"
                      </div>
                    </div>
                  )}
                  
                  {isBounced && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-sm text-red-300">
                      <div className="flex items-center font-bold mb-1">
                        <AlertTriangle className="w-4 h-4 mr-1.5" /> 
                        ATTENZIONE
                      </div>
                      Questo appuntamento è stato annullato o rifiutato. Il contatto è tornato in tuo carico. Devi chiamare il cliente e rifissarlo.
                    </div>
                  )}
                </div>

                {isBounced && (
                  <div className="mt-auto pt-4">
                    <button
                      onClick={() => {
                        setAppointmentContactId(appt.contactId);
                        setAppointmentContactCap(appt.contact.cap);
                        setAppointmentModalOpen(true);
                      }}
                      className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" /> Rifissa Appuntamento
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Modal for re-booking */}
      {appointmentModalOpen && (
        <AppointmentModal
          contactId={appointmentContactId}
          cap={appointmentContactCap}
          onClose={() => setAppointmentModalOpen(false)}
          onSuccess={() => {
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
}
