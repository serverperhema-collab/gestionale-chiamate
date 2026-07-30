"use client";

import { useState, useEffect } from "react";
import { Handshake, ArrowLeft, Clock, Phone, XCircle, Calendar, Send } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppointmentModal from "@/components/AppointmentModal";

export default function OperatorNegotiationsPage() {
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [delegationModalOpen, setDelegationModalOpen] = useState(false);
  const [colleagues, setColleagues] = useState<any[]>([]);
  const [selectedColleague, setSelectedColleague] = useState<string>("");
  const [negotiationToDelegate, setNegotiationToDelegate] = useState<string | null>(null);
  const [delegationDuration, setDelegationDuration] = useState<string>("1");

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentContactId, setAppointmentContactId] = useState("");
  const [appointmentContactCap, setAppointmentContactCap] = useState("");

  const fetchNegotiations = async () => {
    try {
      const res = await fetch("/api/operator/negotiations");
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data.currentUserId);
        // Nascondi le richieste della TL da questa schermata (verranno mostrate nella schermata apposita)
        setNegotiations(data.negotiations.filter((n: any) => !n.reason.startsWith("[TL_REQUEST]")));
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore di caricamento");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  const fetchColleagues = async () => {
    try {
      const res = await fetch("/api/operator/colleagues");
      const data = await res.json();
      if (res.ok) {
        setColleagues(data.colleagues);
        if (data.colleagues.length > 0) {
          setSelectedColleague(data.colleagues[0].id);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchNegotiations();
    fetchColleagues();
  }, []);

  const handleAbandon = async (id: string) => {
    if (!confirm("Sei sicuro di voler abbandonare questo richiamo? Il contatto tornerà nel calderone per tutti.")) return;
    
    try {
      const res = await fetch(`/api/operator/negotiations/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ABANDON" })
      });
      if (res.ok) {
        toast.success("Trattativa abbandonata");
        setNegotiations(negotiations.filter(n => n.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  const handleRevokeDelegation = async (id: string) => {
    if (!confirm("Sei sicuro di voler annullare questa delega e riprendere possesso della trattativa?")) return;
    try {
      const res = await fetch(`/api/operator/negotiations/${id}/revoke`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Delega annullata, trattativa recuperata.");
        fetchNegotiations();
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore durante l'annullamento della delega");
      }
    } catch (error) {
      toast.error("Errore di rete");
    }
  };

  const handleDelegateClick = (id: string) => {
    if (colleagues.length === 0) {
      toast.error("Nessun collega attivo trovato per la delega.");
      return;
    }
    setNegotiationToDelegate(id);
    setDelegationModalOpen(true);
  };

  const handleDelegateSubmit = async () => {
    if (!negotiationToDelegate || !selectedColleague) return;

    try {
      const res = await fetch(`/api/operator/negotiations/${negotiationToDelegate}/delegate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          targetOperatorId: selectedColleague,
          durationDays: delegationDuration
        })
      });
      if (res.ok) {
        toast.success("Richiamo delegato con successo!");
        setNegotiations(negotiations.filter(n => n.id !== negotiationToDelegate));
        setDelegationModalOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore durante la delega");
      }
    } catch (error) {
      toast.error("Errore di rete");
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-900 min-h-screen text-gray-100">
      {/* Delegation Modal */}
      {delegationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Send className="w-5 h-5 mr-2 text-indigo-400" /> Delega Richiamo
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Scegli un collega a cui delegare questo richiamo personale. Questa operazione trasferisce la proprietà del richiamo.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Seleziona Collega</label>
              <select
                value={selectedColleague}
                onChange={(e) => setSelectedColleague(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
              >
                {colleagues.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Durata della Delega (Giorni)</label>
              <select
                value={delegationDuration}
                onChange={(e) => setDelegationDuration(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1">1 Giorno</option>
                <option value="2">2 Giorni</option>
                <option value="3">3 Giorni</option>
                <option value="5">5 Giorni</option>
                <option value="7">7 Giorni (1 Settimana)</option>
                <option value="15">15 Giorni</option>
                <option value="30">30 Giorni (1 Mese)</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDelegationModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
              >
                Annulla
              </button>
              <button
                onClick={handleDelegateSubmit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-sm font-medium"
              >
                Conferma Delega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {appointmentModalOpen && (
        <AppointmentModal
          contactId={appointmentContactId}
          cap={appointmentContactCap}
          onClose={() => setAppointmentModalOpen(false)}
          onSuccess={() => {
            fetchNegotiations();
          }}
        />
      )}

      <div className="mb-6">
        <Link href="/operator-terminal" className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition shadow-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna al Terminale
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center">
          <Handshake className="w-6 h-6 mr-3 text-purple-400" />
          I Miei Richiami Personali
        </h2>
        <p className="text-gray-400 mt-1">
          Gestisci i contatti che hai messo in ricontatto personale. Fissa appuntamenti, chiama o delega ai colleghi.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : negotiations.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center shadow-lg">
          <Handshake className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nessun richiamo in corso</h3>
          <p className="text-gray-400">Non hai richiami personali attivi al momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {negotiations.map((neg) => {
            const isPending = !neg.isApproved;
            const isExpired = neg.expiresAt && new Date(neg.expiresAt) < new Date();
            
            // Logica Delega
            const isDelegatedByMe = neg.originalOperatorId === currentUserId && neg.operatorId !== currentUserId;
            const isDelegatedToMe = neg.originalOperatorId !== null && neg.operatorId === currentUserId;
            
            // Calcolo del timer se c'è una delega
            let delegationCountdown = "";
            if (neg.contact?.delegatedUntil) {
              const diffMs = new Date(neg.contact.delegatedUntil).getTime() - new Date().getTime();
              if (diffMs > 0) {
                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
                delegationCountdown = `${days}g ${hours}h rimanenti`;
              } else {
                delegationCountdown = "Scaduta";
              }
            }

            return (
              <div key={neg.id} className={`bg-gray-800 rounded-xl border p-6 shadow-lg relative flex flex-col ${isPending ? 'border-yellow-500/50' : isExpired ? 'border-red-500/50' : isDelegatedByMe ? 'border-indigo-500/50' : 'border-purple-500/50'}`}>
                {isPending && (
                  <div className="absolute top-0 right-0 p-1.5 px-3 bg-yellow-600 rounded-bl-lg rounded-tr-lg z-10">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">In Attesa TL</span>
                  </div>
                )}
                {isExpired && !isPending && (
                  <div className="absolute top-0 right-0 p-1.5 px-3 bg-red-600 rounded-bl-lg rounded-tr-lg z-10">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Scaduta</span>
                  </div>
                )}
                
                {/* Badge Delega al centro-alto */}
                {isDelegatedByMe && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-900 border border-indigo-500 px-3 py-1 rounded-full shadow-lg z-10 text-center whitespace-nowrap">
                    <span className="text-xs font-bold text-indigo-200">DELEGATO A: {neg.operator?.name}</span>
                  </div>
                )}
                {isDelegatedToMe && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-900 border border-purple-500 px-3 py-1 rounded-full shadow-lg z-10 text-center whitespace-nowrap">
                    <span className="text-xs font-bold text-purple-200">IN DELEGA DA: {neg.originalOperator?.name}</span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4 border-b border-gray-700 pb-4 mt-2">
                  <div>
                    <h3 className="font-bold text-lg text-white mb-1">{neg.contact.name}</h3>
                    <p className="text-sm text-gray-400 font-mono">{neg.contact.originalPhone || "Nessun numero"}</p>
                    <p className="text-xs text-gray-500 mt-1">{neg.contact.address} ({neg.contact.cap})</p>
                  </div>
                </div>
                
                <div className="mb-6 flex-1">
                  <div className="text-sm text-gray-300 italic bg-gray-900 border border-gray-700 p-3 rounded-lg mb-4">
                    "{neg.reason}"
                  </div>

                  <div className="flex items-center text-sm font-semibold mb-2 text-gray-300">
                    <Clock className="w-4 h-4 mr-1.5 text-blue-400" />
                    Richiamo: <span className="ml-2 font-normal text-white">{new Date(neg.recallDate).toLocaleString()}</span>
                  </div>

                  {neg.expiresAt && (
                    <div className={`flex items-center text-sm font-semibold mb-2 ${isExpired ? 'text-red-400' : 'text-gray-400'}`}>
                      <Clock className="w-4 h-4 mr-1.5" />
                      Scadenza TL: <span className="ml-2 font-normal">{new Date(neg.expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Timer Delega */}
                  {(isDelegatedByMe || isDelegatedToMe) && delegationCountdown && (
                    <div className="flex items-center text-sm font-semibold mt-3 text-indigo-300 bg-indigo-900/30 p-2 rounded-lg border border-indigo-800/50">
                      <Clock className="w-4 h-4 mr-2" />
                      Timer Delega: <span className="ml-2 text-white font-mono">{delegationCountdown}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                  {isDelegatedByMe ? (
                    // AZIONI PER CHI HA DELEGATO
                    <button
                      onClick={() => handleRevokeDelegation(neg.id)}
                      className="col-span-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition font-bold text-sm flex items-center justify-center shadow-lg"
                    >
                      <XCircle className="w-5 h-5 mr-2" /> Annulla Delega (Riprendi)
                    </button>
                  ) : (
                    // AZIONI NORMALI (per trattative proprie o in delega a me)
                    <>
                      <button
                        disabled={isPending}
                        onClick={() => router.push(`/operator-terminal?contactId=${neg.contact.id}`)}
                        className="col-span-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center disabled:opacity-50"
                      >
                        <Phone className="w-4 h-4 mr-2" /> Chiama Ora
                      </button>
                      <button
                        onClick={() => {
                          setAppointmentContactId(neg.contact.id);
                          setAppointmentContactCap(neg.contact.cap);
                          setAppointmentModalOpen(true);
                        }}
                        disabled={isPending}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center disabled:opacity-50"
                      >
                        <Calendar className="w-4 h-4 mr-2" /> Appuntamento
                      </button>
                      <button
                        onClick={() => handleDelegateClick(neg.id)}
                        disabled={isPending}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 mr-2" /> Delega
                      </button>
                      <button
                        onClick={() => handleAbandon(neg.id)}
                        className="col-span-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-red-400 rounded-lg transition font-medium text-sm flex items-center justify-center"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Abbandona Richiamo
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
