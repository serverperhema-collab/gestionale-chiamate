"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Phone, Clock, FileText, Send, Handshake, CheckCircle, AlertTriangle, Calendar, XCircle, ArrowRight, LogOut, PhoneCall } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { signOut } from "next-auth/react";
import AppointmentModal from "@/components/AppointmentModal";
import TrattativaTimeline from "@/components/TrattativaTimeline";

export default function OperatorNegotiations() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [trattative, setTrattative] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [timelineId, setTimelineId] = useState<string | null>(null);
  
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentContactId, setAppointmentContactId] = useState("");
  const [appointmentContactCap, setAppointmentContactCap] = useState("");

  const fetchTrattative = async () => {
    try {
      const res = await fetch("/api/trattative?status=RICHIAMO_PERSONALE&operatorId=me");
      if (res.ok) {
        const data = await res.json();
        setTrattative(data.trattative || []);
      }
    } catch (err) {
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrattative();
  }, []);

  const handleAbandon = async (id: string) => {
    if (!confirm("Sei sicuro di voler chiudere questo richiamo personale?")) return;
    try {
      const res = await fetch(`/api/trattative/${id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chiudi-persa", payload: { outcomeNotes: "Abbandonato volontariamente" } })
      });
      if (res.ok) {
        toast.success("Richiamo abbandonato");
        fetchTrattative();
      } else {
        toast.error("Errore durante l'abbandono");
      }
    } catch (err) {
      toast.error("Errore di connessione");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col text-sm">
      {/* Header (copiato da Operator Terminal) */}
      <header className="bg-gray-800 border-b border-gray-700 h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center space-x-3">
          <PhoneCall className="w-5 h-5 text-blue-400" />
          <h1 className="font-bold text-gray-100 tracking-wide">Pannello Operativo</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/operator-dashboard/tl-requests" className="px-3 py-1.5 bg-red-900/40 border border-red-800/50 hover:bg-red-800/60 text-sm text-red-200 rounded transition font-medium">
            Richieste TL
          </Link>
          <Link href="/operator-terminal" className="px-3 py-1.5 bg-blue-900/40 border border-blue-800/50 hover:bg-blue-800/60 text-sm text-blue-200 rounded transition font-medium">
            Torna alle chiamate
          </Link>
          <button onClick={() => signOut()} className="p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-gray-700">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <div className="p-6 max-w-7xl mx-auto flex-1 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center">
            I Miei Richiami Personali <span className="ml-3 bg-purple-600 text-white text-sm py-1 px-3 rounded-full font-bold">{trattative.length}</span>
          </h1>
          <p className="text-gray-400 mt-2">Gestisci le trattative in corso e i ricontatti programmati.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : trattative.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center shadow-lg">
          <Handshake className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nessun richiamo in corso</h3>
          <p className="text-gray-400">Non hai richiami personali attivi al momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trattative.map((st) => {
            const isPending = st.derogaStatus === "PENDING";
            const contact = st.contact;

            return (
              <div key={st.id} className={`bg-gray-800 rounded-xl border p-6 shadow-lg relative flex flex-col ${isPending ? 'border-yellow-500/50' : 'border-purple-500/50'}`}>
                {isPending && (
                  <div className="absolute top-0 right-0 p-1.5 px-3 bg-yellow-600 rounded-bl-lg rounded-tr-lg z-10">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">In Attesa Deroga</span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4 border-b border-gray-700 pb-4 mt-2">
                  <div>
                    <h3 className="font-bold text-lg text-white mb-1">{contact.name}</h3>
                    <p className="text-sm text-gray-400 font-mono">{st.commercialPhone || contact.originalPhone || "Nessun numero"}</p>
                    <p className="text-xs text-gray-500 mt-1">{contact.address} ({contact.cap})</p>
                  </div>
                </div>
                
                <div className="mb-6 flex-1">
                  <div className="text-sm text-gray-300 italic bg-gray-900 border border-gray-700 p-3 rounded-lg mb-4">
                    "{st.clientNeeds || "Nessuna nota impostata"}"
                  </div>

                  {st.nextActionDate && (
                    <div className="flex items-center text-sm font-semibold mb-2 text-gray-300">
                      <Clock className="w-4 h-4 mr-1.5 text-blue-400" />
                      Data Azione: <span className="ml-2 font-normal text-white">{new Date(st.nextActionDate).toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm font-semibold mb-2 text-gray-400">
                    <ArrowRight className="w-4 h-4 mr-1.5 text-purple-400" />
                    Prossima Azione: <span className="ml-2 font-normal text-white">{st.nextActionType}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button
                    disabled={isPending}
                    onClick={() => router.push(`/operator-terminal?contactId=${contact.id}`)}
                    className="col-span-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center disabled:opacity-50"
                  >
                    <Phone className="w-4 h-4 mr-2" /> Chiama Ora
                  </button>
                  <button
                    onClick={() => {
                      setAppointmentContactId(contact.id);
                      setAppointmentContactCap(contact.cap);
                      setAppointmentModalOpen(true);
                    }}
                    disabled={isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center disabled:opacity-50"
                  >
                    <Calendar className="w-4 h-4 mr-2" /> Appuntamento
                  </button>
                  <button
                    onClick={() => setTimelineId(st.id)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4 mr-2" /> Timeline
                  </button>
                  <button
                    onClick={() => handleAbandon(st.id)}
                    className="col-span-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-red-400 rounded-lg transition font-medium text-sm flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Abbandona Richiamo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {appointmentModalOpen && appointmentContactId && (
        <AppointmentModal
          contactId={appointmentContactId}
          cap={appointmentContactCap}
          onClose={() => setAppointmentModalOpen(false)}
          onSuccess={() => fetchTrattative()}
        />
      )}
      
      {timelineId && (
        <TrattativaTimeline
          trattativaId={timelineId}
          onClose={() => setTimelineId(null)}
        />
      )}
    </div>
      </div>
    );
  }