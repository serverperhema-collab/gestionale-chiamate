import React, { useEffect, useState } from 'react';
import { X, User, MapPin, Phone, Calendar, CheckCircle, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactDetailModal({ contactId, onClose }: { contactId: string, onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/contacts/${contactId}/details`)
      .then(r => r.json())
      .then(d => {
        if (d.contact) setData(d.contact);
        else toast.error("Errore caricamento dettagli");
      })
      .catch(() => toast.error("Errore di rete"))
      .finally(() => setLoading(false));
  }, [contactId]);


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

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 print:bg-white print:p-0">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:bg-white print:border-none print:shadow-none print:max-w-full print:h-auto print:max-h-full print:overflow-visible text-white print:text-black">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-900/80">
          <h2 className="text-xl font-bold text-white flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-400" />
            Scheda Dettaglio: {data ? data.name : "Caricamento..."}
          </h2>
          <div className="flex items-center space-x-2">
            <button onClick={() => window.print()} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-600 text-sm font-medium transition print:hidden flex items-center">
              <FileText className="w-4 h-4 mr-2" /> Stampa
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition print:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {loading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !data ? (
            <div className="flex-1 text-center text-gray-400">Nessun dato trovato.</div>
          ) : (
            <>
              {/* Left Column: Contact Info & Appts */}
              <div className="flex-1 space-y-6">
                
                {/* Contact Info */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" /> Dati Principali
                  </h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="text-gray-400 block mb-1">Ragione Sociale:</span> <span className="font-medium text-white">{data.name}</span></p>
                    <p><span className="text-gray-400 block mb-1">Indirizzo:</span> <span className="text-gray-300">{data.address || "-"} ({data.cap || "-"})</span></p>
                    <p><span className="text-gray-400 block mb-1">Telefono:</span> <span className="text-gray-300">{data.originalPhone || "-"}</span></p>
                    {data.phones?.length > 0 && (
                      <p><span className="text-gray-400 block mb-1">Altri Recapiti:</span> {data.phones.map((p: any) => p.number).join(', ')}</p>
                    )}
                  </div>
                </div>

                {/* Appointments */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-purple-400" /> Storico Appuntamenti
                  </h3>
                  <div className="space-y-4">
                    {data.appointments?.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Nessun appuntamento registrato.</p>
                    ) : data.appointments?.map((appt: any) => (
                      <div key={appt.id} className="bg-gray-900 border border-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-blue-400">{new Date(appt.date).toLocaleDateString()}</span>
                          <span className={`text-xs px-2 py-1 rounded font-bold ${appt.status === "DONE" ? "bg-emerald-600/20 text-emerald-400" : "bg-orange-600/20 text-orange-400"}`}>
                            {appt.status}
                          </span>
                        </div>
                        <div className="text-sm space-y-1 mb-2">
                          <p><span className="text-gray-400">Comm:</span> <span className="text-gray-200">{appt.commerciale?.name || "-"}</span></p>
                          <p><span className="text-gray-400">Op:</span> <span className="text-gray-200">{appt.operator?.name || "-"}</span></p>
                        </div>
                        {appt.clientNeeds && (
                          <div className="mt-2 p-2 bg-gray-800/50 rounded text-sm text-gray-300">
                            <span className="text-gray-500 text-xs block uppercase">Esigenze (Op):</span>
                            {appt.clientNeeds}
                          </div>
                        )}
                        {appt.tlNotes && (
                          <div className="mt-2 p-2 bg-orange-900/20 rounded border border-orange-500/20 text-sm text-orange-200">
                            <span className="text-orange-500/70 text-xs block uppercase">Note TL:</span>
                            {appt.tlNotes}
                          </div>
                        )}
                        {appt.outcomes?.length > 0 && (
                          <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700 text-sm">
                            <p className="font-medium text-emerald-400 mb-1">Esito Comm: {appt.outcomes[0].status}</p>
                            <p className="text-gray-300 italic">"{appt.outcomes[0].notes || "Nessuna nota"}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Logs */}
              <div className="w-full md:w-1/2 flex flex-col h-[500px] md:h-auto print:hidden">
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md flex flex-col h-full">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center shrink-0">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" /> Registro Attività (Log)
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {data.activityLogs?.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Nessun log recente.</p>
                    ) : data.activityLogs?.map((log: any) => (
                      <div key={log.id} className="p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                          <span className="font-medium text-gray-400">{log.user?.name}</span>
                        </div>
                        <p className="font-bold text-white mb-1">{translateAction(log.action)}</p>
                        {log.details && <p className="text-gray-400 text-xs italic">{log.details}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
