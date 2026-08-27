"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { ShieldOff, Clock, UserCheck, PlayCircle, LogIn, PhoneOff, PhoneForwarded, Target, FilePlus2, StopCircle, Pencil } from "lucide-react";

interface OperatorStats {
  skip: number;
  noAnswer: number;
  notAvailable: number;
  nonInteressato: number;
  noInfo: number;
  trashRequest: number;
  reviewRequest: number;
  negotiation: number;
  appt: number;
  enrichment: number;
  logins: number;
  minutesOn: number;
}

interface LiveOperator {
  id: string;
  name: string;
  idleMinutes: number;
  maxIdleTimeMins: number;
  isIdle: boolean;
  isDisconnected: boolean;
  skipCount: number;
  currentContact: {
    id: string;
    name: string;
    cap: string;
    assignedToId: string;
  } | null;
  stats: OperatorStats;
}

export default function LiveMonitorClient() {
  const [operators, setOperators] = useState<LiveOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/tl/live-monitor");
      const data = await res.json();
      if (res.ok) {
        // Sort: Idle first, then by minutesOn descending
        const sorted = (data.operators || []).sort((a: LiveOperator, b: LiveOperator) => {
          if (a.isIdle && !b.isIdle) return -1;
          if (!a.isIdle && b.isIdle) return 1;
          return b.stats.minutesOn - a.stats.minutesOn;
        });
        setOperators(sorted);
      }
    } catch (e) {
      console.error("Failed to fetch live status", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleUnassign = async (contactId: string, operatorName: string) => {
    if (!confirm(`Sei sicura di voler scollegare il contatto da ${operatorName}? Il contatto tornerà nel calderone per gli altri.`)) {
      return;
    }
    
    setUnassigningId(contactId);
    try {
      const res = await fetch(`/api/contacts/${contactId}/force-unassign`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Contatto liberato con successo!");
        fetchStatus();
      } else {
        toast.error(data.error || "Errore durante lo sblocco");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setUnassigningId(null);
    }
  };

  const handleForceLogout = async (operatorId: string, operatorName: string) => {
    if (!confirm(`Sei sicura di voler disconnettere forzatamente l'operatore ${operatorName}? Verrà cacciato dal gestionale.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/users/${operatorId}/force-logout`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success(`Operatore ${operatorName} disconnesso con successo.`);
      } else {
        toast.error("Errore durante la disconnessione");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  const handleTimeAdjust = async (operatorId: string, operatorName: string) => {
    const val = prompt(`Modifica il tempo di log di ${operatorName} oggi.\nInserisci i minuti da AGGIUNGERE (es. 30) o SOTTRARRE (es. -15):`);
    if (!val) return;
    
    const minutes = parseInt(val, 10);
    if (isNaN(minutes)) {
      toast.error("Inserisci un numero valido di minuti");
      return;
    }

    try {
      const res = await fetch(`/api/users/${operatorId}/time-adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes })
      });
      if (res.ok) {
        toast.success(`Tempo modificato di ${minutes} minuti per ${operatorName}`);
        fetchStatus();
      } else {
        toast.error("Errore durante la modifica del tempo");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  if (loading && operators.length === 0) {
    return <div className="text-gray-400">Caricamento tabellone operativo...</div>;
  }

  // Calculate totals
  const totals = operators.reduce((acc, op) => {
    acc.skip += op.stats.skip;
    acc.noAnswer += op.stats.noAnswer;
    acc.notAvailable += op.stats.notAvailable;
    acc.nonInteressato += op.stats.nonInteressato;
    acc.noInfo += op.stats.noInfo;
    acc.trashRequest += op.stats.trashRequest;
    acc.reviewRequest += op.stats.reviewRequest;
    acc.negotiation += op.stats.negotiation;
    acc.appt += op.stats.appt;
    acc.enrichment += op.stats.enrichment;
    acc.logins += op.stats.logins;
    acc.minutesOn += op.stats.minutesOn;
    return acc;
  }, { skip: 0, noAnswer: 0, notAvailable: 0, nonInteressato: 0, noInfo: 0, trashRequest: 0, reviewRequest: 0, negotiation: 0, appt: 0, enrichment: 0, logins: 0, minutesOn: 0 });

  return (
    <div className="space-y-6">
      
      {/* Riepilogo di Sala */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">Ore Tot. Sala</div>
          <div className="text-2xl font-bold text-white">{Math.floor(totals.minutesOn / 60)}h {totals.minutesOn % 60}m</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">Logins Oggi</div>
          <div className="text-2xl font-bold text-blue-400">{totals.logins}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">Skip</div>
          <div className="text-2xl font-bold text-gray-300">{totals.skip}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">Non Risp. / Non Rep.</div>
          <div className="text-2xl font-bold text-red-400">{totals.noAnswer + totals.notAvailable}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">Trattative</div>
          <div className="text-2xl font-bold text-yellow-400">{totals.negotiation}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">Appuntamenti</div>
          <div className="text-2xl font-bold text-green-400">{totals.appt}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">Integrazioni</div>
          <div className="text-2xl font-bold text-purple-400">{totals.enrichment}</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400 font-semibold whitespace-nowrap">
                <th className="p-4">Operatore</th>
                <th className="p-4 text-center">Stato</th>
                <th className="p-4 text-center" title="Tempo online oggi (primo log -> ora)">Minuti On</th>
                <th className="p-4 text-center" title="Volte che ha fatto login">Logins</th>
                <th className="p-4 text-center text-blue-400" title="Totale contatti passati davanti all'operatore">Tot. Contatti</th>
                <th className="p-4 text-center text-emerald-400" title="Rapporto tra minuti online e contatti totali">Ritmo</th>
                <th className="p-4 text-center text-gray-500">Skip</th>
                <th className="p-4 text-center text-orange-400">Non Rep.</th>
                <th className="p-4 text-center text-red-400">No Risp.</th>
                <th className="p-4 text-center text-gray-400">No Info</th>
                <th className="p-4 text-center text-red-600">Non Int.</th>
                <th className="p-4 text-center text-rose-500">Cestino</th>
                <th className="p-4 text-center text-amber-500">Sblocco</th>
                <th className="p-4 text-center text-yellow-400">Trattative</th>
                <th className="p-4 text-center text-green-400">Appunt.</th>
                <th className="p-4 text-center text-purple-400">Integrazioni</th>
                <th className="p-4 text-center">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {operators.map((op) => {
                const ore = Math.floor(op.stats.minutesOn / 60);
                const min = op.stats.minutesOn % 60;
                const timeString = ore > 0 ? `${ore}h ${min}m` : `${min}m`;

                const totContacts = op.stats.skip + op.stats.noAnswer + op.stats.notAvailable + op.stats.nonInteressato + op.stats.noInfo + op.stats.trashRequest + op.stats.reviewRequest + op.stats.negotiation + op.stats.appt;
                const ritmo = totContacts > 0 ? Math.floor(op.stats.minutesOn / totContacts) : 0;
                const ritmoText = totContacts > 0 ? `1 / ${ritmo}m` : "-";

                return (
                  <tr key={op.id} className={`transition ${op.isDisconnected ? 'bg-gray-800/50 hover:bg-gray-800/80 opacity-50' : op.isIdle ? 'bg-red-950/20 hover:bg-red-950/40' : 'hover:bg-gray-800'}`}>
                    <td className="p-4 w-48">
                      <div className="font-semibold text-white">{op.name}</div>
                      {op.isIdle && op.currentContact && (
                        <div 
                          className="text-xs text-red-400 mt-1 flex items-start max-w-full"
                          title={`Bloccato su: ${op.currentContact.name} (${op.currentContact.cap})`}
                        >
                          <StopCircle className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            Bloccato su: {op.currentContact.name} ({op.currentContact.cap})
                          </span>
                        </div>
                      )}
                    </td>
                      <td className="p-4 text-center">
                        {op.isDisconnected ? (
                          <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-900/50 text-gray-500 text-xs font-bold border border-gray-700">
                            <PhoneOff className="w-3 h-3 mr-1" />
                            Disconnesso
                          </div>
                        ) : op.isIdle ? (
                          <div className="inline-flex items-center px-2 py-1 rounded-full bg-red-900/50 text-red-400 text-xs font-bold animate-pulse border border-red-700">
                            <Clock className="w-3 h-3 mr-1" />
                            Fermo da {op.idleMinutes} min
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-900/30 text-green-400 text-xs font-bold">
                            <PlayCircle className="w-3 h-3 mr-1" />
                            Attivo
                          </div>
                        )}
                      </td>
                    <td className="p-4 text-center font-mono text-gray-300 font-medium group">
                      <div className="flex items-center justify-center gap-1">
                        <span>{timeString}</span>
                        <button 
                          onClick={() => handleTimeAdjust(op.id, op.name)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition"
                          title="Modifica tempo di log"
                        >
                          <Pencil className="w-3 h-3 text-gray-400 hover:text-white" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-center text-blue-400 font-bold">
                      {op.stats.logins}
                    </td>
                    <td className="p-4 text-center text-blue-400 font-bold">
                      {totContacts}
                    </td>
                    <td className="p-4 text-center text-emerald-400 font-semibold font-mono">
                      {ritmoText}
                    </td>
                    <td className="p-4 text-center text-gray-400 font-semibold">
                      {op.stats.skip}
                      {op.skipCount > 0 && (
                        <span className="text-xs text-amber-500 font-bold block mt-0.5" title="Skip consecutivi (blocco a 5)">
                          ({op.skipCount}/5)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center text-orange-400 font-semibold">
                      {op.stats.notAvailable}
                    </td>
                    <td className="p-4 text-center text-red-400 font-semibold">
                      {op.stats.noAnswer}
                    </td>
                    <td className="p-4 text-center text-gray-400 font-semibold">
                      {op.stats.noInfo}
                    </td>
                    <td className="p-4 text-center text-red-600 font-semibold">
                      {op.stats.nonInteressato}
                    </td>
                    <td className="p-4 text-center text-rose-500 font-semibold">
                      {op.stats.trashRequest}
                    </td>
                    <td className="p-4 text-center text-amber-500 font-semibold">
                      {op.stats.reviewRequest}
                    </td>
                    <td className="p-4 text-center text-yellow-400 font-semibold">
                      {op.stats.negotiation}
                    </td>
                    <td className="p-4 text-center text-green-400 font-semibold">
                      {op.stats.appt}
                    </td>
                    <td className="p-4 text-center text-purple-400 font-semibold">
                      {op.stats.enrichment}
                    </td>
                    <td className="p-4 flex flex-col gap-2 items-center justify-center">
                      {op.isIdle && op.currentContact && (
                        <button
                          onClick={() => handleUnassign(op.currentContact!.id, op.name)}
                          disabled={unassigningId === op.currentContact.id}
                          className="w-full px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded shadow transition disabled:opacity-50 flex items-center justify-center"
                          title="Scollega contatto e rimettilo nel calderone"
                        >
                          <ShieldOff className="w-3 h-3 mr-1" />
                          Scollega
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleForceLogout(op.id, op.name)}
                        className="w-full px-3 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white text-xs font-medium rounded shadow transition flex items-center justify-center"
                        title="Forza la disconnessione (logout) dell'operatore"
                      >
                        <PhoneOff className="w-3 h-3 mr-1" />
                        Disconnetti
                      </button>
                    </td>
                  </tr>
                );
              })}

              {operators.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">
                    Nessun operatore attivo al momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
