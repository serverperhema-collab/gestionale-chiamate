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
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
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
                          <span className="font-bold text-blue-400">{new Date(appt.date).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })}</span>
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
                          <span>{new Date(log.createdAt).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}</span>
                          <span className="font-medium text-gray-400">{log.user?.name}</span>
                        </div>
                        <p className="font-bold text-white mb-1">{translateAction(log.action)}</p>
                        {log.details && (
                          <p className="text-gray-400 text-xs italic">
                            {log.details
                              .replace(/sull'appuntamento\s+c[a-z0-9]+\b/i, "sull'appuntamento")
                              .replace(/all'appuntamento\s+c[a-z0-9]+\b/i, "all'appuntamento")
                              .replace(/ID:\s*c[a-z0-9]+\b/g, "")
                              .replace(/\s+c[a-z0-9]{20,}\b/g, "")}
                          </p>
                        )}
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
        <div id="print-layout" className="hidden print:flex flex-col w-[210mm] h-[292mm] bg-white text-black p-8 font-sans box-border overflow-hidden">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #print-layout, #print-layout * {
                visibility: visible;
              }
              #print-layout {
                position: absolute;
                left: 0;
                top: 0;
                margin: 0;
                padding: 10mm;
              }
              @page {
                size: A4 portrait;
                margin: 0;
              }
            }
          `}</style>
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6 border-b border-amber-500 pb-4 shrink-0">
            <div className="flex items-center">
              <div className="text-5xl font-serif text-amber-500 mr-2 border-r border-amber-500 pr-3 leading-none">H</div>
              <div className="text-3xl font-serif text-slate-800 tracking-widest leading-none">HEMA</div>
            </div>
            <div className="text-right">
              <div className="bg-slate-900 text-white font-bold tracking-widest px-6 py-1.5 text-lg inline-block" style={{ transform: "skewX(-15deg)" }}>
                <span className="block" style={{ transform: "skewX(15deg)" }}>SCHEDA APPUNTAMENTO</span>
              </div>
              <div className="text-amber-600 font-bold text-xl mt-1 truncate max-w-[100mm]">{data.name}</div>
            </div>
          </div>

          {/* Meta */}
          <div className="flex justify-between mb-6 px-4 text-slate-600 shrink-0">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-slate-400" />
              <div>
                <div className="text-[10px] font-bold tracking-wider uppercase">Data Stampa</div>
                <div className="font-medium text-slate-800 text-sm">{new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}</div>
              </div>
            </div>
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-slate-400" />
              <div>
                <div className="text-[10px] font-bold tracking-wider uppercase">ID Appuntamento</div>
                <div className="font-medium text-slate-800 font-mono text-amber-600 text-sm">{data.appointments?.[0]?.id?.slice(-8).toUpperCase() || "N/D"}</div>
              </div>
            </div>
          </div>

          {/* Dati Principali */}
          <div className="mb-4 shrink-0">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-lg rounded-br-lg mb-2 font-bold text-xs tracking-widest">
              <User className="w-3.5 h-3.5 mr-2" /> DATI PRINCIPALI
            </div>
            <div className="border border-slate-200 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                <div className="text-[120px] font-serif text-slate-900 leading-none">H</div>
              </div>
              
              <div className="space-y-3 relative z-10 text-sm">
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Ragione Sociale</div>
                  <div className="w-3/4 font-bold text-amber-600 text-base">{data.name}</div>
                </div>
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Indirizzo</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.address || "-"} ({data.cap || "-"})</div>
                </div>
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Telefono</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.originalPhone || "-"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Riepilogo Appuntamento */}
          <div className="mb-4 shrink-0">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-lg rounded-br-lg mb-2 font-bold text-xs tracking-widest">
              <Calendar className="w-3.5 h-3.5 mr-2" /> RIEPILOGO APPUNTAMENTO
            </div>
            <div className="border border-slate-200 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                <Calendar className="w-24 h-24 text-slate-900" />
              </div>

              <div className="space-y-3 relative z-10 text-sm">
                <div className="flex items-start border-b border-slate-100 pb-2">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Data Appuntamento</div>
                  <div className="w-3/4 font-bold text-slate-800">{data.appointments?.[0] ? new Date(data.appointments[0].date).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : "N/D"}</div>
                </div>
                <div className="flex items-start border-b border-slate-100 pb-2">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Stato</div>
                  <div className="w-3/4 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block w-max text-xs">{data.appointments?.[0]?.status || "N/D"}</div>
                </div>
                <div className="flex items-start border-b border-slate-100 pb-2">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Comm. Referente</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.appointments?.[0]?.commerciale?.name || "N/D"}</div>
                </div>
                <div className="flex items-start border-b border-slate-100 pb-2">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Op. Team Leader</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.appointments?.[0]?.operator?.name || "N/D"}</div>
                </div>
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Esigenze / Note</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.appointments?.[0]?.clientNeeds || "Nessuna specifica"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dettagli e Note */}
          <div className="mb-4 shrink-0">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-lg rounded-br-lg mb-2 font-bold text-xs tracking-widest">
              <FileText className="w-3.5 h-3.5 mr-2" /> DETTAGLI E NOTE
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="mb-3">
                <div className="font-bold text-slate-700 mb-1 flex items-center text-xs"><FileText className="w-3.5 h-3.5 mr-1" /> NOTE TL</div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-800 text-xs italic">
                  {data.appointments?.[0]?.tlNotes || "Nessuna nota aggiuntiva dal Team Leader."}
                </div>
              </div>
              <div>
                <div className="font-bold text-slate-700 mb-1 flex items-center text-xs"><Clock className="w-3.5 h-3.5 mr-1" /> STORICO ATTIVITÀ</div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-800 text-xs">
                  {data.appointments?.[0]?.outcomes?.map((out: any, idx: number) => (
                     <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-200 last:border-0">
                       <div className="flex items-center"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2"></div><span className="font-bold mr-1">{out.status}</span> <span>{out.notes}</span></div>
                     </div>
                  ))}
                  {(!data.appointments?.[0]?.outcomes || data.appointments[0].outcomes.length === 0) && "Nessun esito registrato."}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1"></div> {/* Spacer to push footer down */}

          {/* Prossimi Passi (Static as requested in design) */}
          <div className="mb-4 shrink-0">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-lg rounded-br-lg mb-2 font-bold text-xs tracking-widest">
              <CheckCircle className="w-3.5 h-3.5 mr-2" /> PROSSIMI PASSI CONSIGLIATI
            </div>
            <div className="grid grid-cols-3 gap-3 mt-1">
              <div className="flex items-start p-3 border border-slate-100 rounded-lg">
                <FileText className="w-6 h-6 text-slate-400 mr-2 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-800">Preparare proposta</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Analizzare le esigenze espresse</div>
                </div>
              </div>
              <div className="flex items-start p-3 border border-slate-100 rounded-lg">
                <Phone className="w-6 h-6 text-slate-400 mr-2 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-800">Follow-up telefonico</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Entro 2 giorni lavorativi</div>
                </div>
              </div>
              <div className="flex items-start p-3 border border-slate-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-slate-400 mr-2 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-800">Inviare documenti</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Listino e presentazione servizi</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-lg text-xs shrink-0">
            <div className="italic text-amber-500 font-serif text-sm px-2">"La cura del dettaglio fa la differenza"</div>
            <div className="text-slate-400 text-right text-[10px]">
              <div>Sistema di Gestione - {data.name}</div>
              <div>Documento generato automaticamente</div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
