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
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 print:static print:inset-auto print:bg-white print:p-0">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:hidden">
        
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

      {/* PRINT LAYOUT */}
      {data && (
        <div className="hidden print:block w-full min-h-screen bg-white text-black p-8 font-sans">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b-2 border-amber-500 pb-4">
            <div className="flex items-center">
              <div className="text-6xl font-serif text-amber-500 mr-2 border-r-2 border-amber-500 pr-4 leading-none">H</div>
              <div className="text-4xl font-serif text-slate-800 tracking-widest leading-none">HEMA</div>
            </div>
            <div className="text-right">
              <div className="bg-slate-900 text-white font-bold tracking-widest px-8 py-2 text-xl inline-block" style={{ transform: "skewX(-15deg)" }}>
                <span className="block" style={{ transform: "skewX(15deg)" }}>SCHEDA APPUNTAMENTO</span>
              </div>
              <div className="text-amber-600 font-bold text-2xl mt-2">{data.name}</div>
            </div>
          </div>

          {/* Meta */}
          <div className="flex justify-between mb-8 px-4 text-slate-600">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-slate-400" />
              <div>
                <div className="text-xs font-bold tracking-wider uppercase">Data Stampa</div>
                <div className="font-medium text-slate-800">{new Date().toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center">
              <FileText className="w-6 h-6 mr-3 text-slate-400" />
              <div>
                <div className="text-xs font-bold tracking-wider uppercase">ID Appuntamento</div>
                <div className="font-medium text-slate-800 font-mono text-amber-600">{data.appointments?.[0]?.id?.slice(-8).toUpperCase() || "N/D"}</div>
              </div>
            </div>
          </div>

          {/* Dati Principali */}
          <div className="mb-6">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-xl rounded-br-xl mb-2 font-bold text-sm tracking-widest">
              <User className="w-4 h-4 mr-2" /> DATI PRINCIPALI
            </div>
            <div className="border border-slate-200 rounded-xl p-6 relative overflow-hidden">
              {/* Watermark */}
              <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                <div className="text-[150px] font-serif text-slate-900 leading-none">H</div>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Ragione Sociale</div>
                  <div className="w-3/4 font-bold text-amber-600 text-lg">{data.name}</div>
                </div>
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Indirizzo</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.address || "-"} ({data.cap || "-"})</div>
                </div>
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Telefono</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.originalPhone || "-"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Riepilogo Appuntamento */}
          <div className="mb-6">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-xl rounded-br-xl mb-2 font-bold text-sm tracking-widest">
              <Calendar className="w-4 h-4 mr-2" /> RIEPILOGO APPUNTAMENTO
            </div>
            <div className="border border-slate-200 rounded-xl p-6 relative overflow-hidden">
              {/* Watermark */}
              <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                <Calendar className="w-40 h-40 text-slate-900" />
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-start border-b border-slate-100 pb-3">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Data Appuntamento</div>
                  <div className="w-3/4 font-bold text-slate-800">{data.appointments?.[0] ? new Date(data.appointments[0].date).toLocaleString() : "N/D"}</div>
                </div>
                <div className="flex items-start border-b border-slate-100 pb-3">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Stato</div>
                  <div className="w-3/4 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block w-max">{data.appointments?.[0]?.status || "N/D"}</div>
                </div>
                <div className="flex items-start border-b border-slate-100 pb-3">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Comm. Referente</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.appointments?.[0]?.commerciale?.name || "N/D"}</div>
                </div>
                <div className="flex items-start border-b border-slate-100 pb-3">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Op. Team Leader</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.appointments?.[0]?.operator?.name || "N/D"}</div>
                </div>
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Esigenze / Note</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.appointments?.[0]?.clientNeeds || "Nessuna specifica"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dettagli e Note */}
          <div className="mb-6">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-xl rounded-br-xl mb-2 font-bold text-sm tracking-widest">
              <FileText className="w-4 h-4 mr-2" /> DETTAGLI E NOTE
            </div>
            <div className="border border-slate-200 rounded-xl p-6">
              <div className="mb-4">
                <div className="font-bold text-slate-700 mb-2 flex items-center text-sm"><FileText className="w-4 h-4 mr-2" /> NOTE TL</div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-800 text-sm italic">
                  {data.appointments?.[0]?.tlNotes || "Nessuna nota aggiuntiva dal Team Leader."}
                </div>
              </div>
              <div>
                <div className="font-bold text-slate-700 mb-2 flex items-center text-sm"><Clock className="w-4 h-4 mr-2" /> STORICO ATTIVITÀ</div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-800 text-sm">
                  {data.appointments?.[0]?.outcomes?.map((out: any, idx: number) => (
                     <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                       <div className="flex items-center"><div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div><span className="font-bold mr-2">{out.status}</span> <span>{out.notes}</span></div>
                     </div>
                  ))}
                  {(!data.appointments?.[0]?.outcomes || data.appointments[0].outcomes.length === 0) && "Nessun esito registrato."}
                </div>
              </div>
            </div>
          </div>

          {/* Prossimi Passi (Static as requested in design) */}
          <div className="mb-12">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-xl rounded-br-xl mb-2 font-bold text-sm tracking-widest">
              <CheckCircle className="w-4 h-4 mr-2" /> PROSSIMI PASSI CONSIGLIATI
            </div>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="flex items-start p-4 border border-slate-100 rounded-lg">
                <FileText className="w-8 h-8 text-slate-400 mr-3 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-slate-800">Preparare proposta</div>
                  <div className="text-xs text-slate-500">Analizzare le esigenze espresse</div>
                </div>
              </div>
              <div className="flex items-start p-4 border border-slate-100 rounded-lg">
                <Phone className="w-8 h-8 text-slate-400 mr-3 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-slate-800">Follow-up telefonico</div>
                  <div className="text-xs text-slate-500">Entro 2 giorni lavorativi</div>
                </div>
              </div>
              <div className="flex items-start p-4 border border-slate-100 rounded-lg">
                <CheckCircle className="w-8 h-8 text-slate-400 mr-3 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-slate-800">Inviare documentazione</div>
                  <div className="text-xs text-slate-500">Listino e presentazione servizi</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl text-xs">
            <div className="italic text-amber-500 font-serif text-sm px-4">"La cura del dettaglio fa la differenza"</div>
            <div className="text-slate-400 text-right">
              <div>Sistema di Gestione - {data.name}</div>
              <div>Documento generato automaticamente</div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
