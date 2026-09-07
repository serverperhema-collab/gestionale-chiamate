"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Phone, Clock, FileText, Send, Calendar, CheckCircle, AlertTriangle, MapPin, Search } from "lucide-react";
import toast from "react-hot-toast";
import TrattativaTimeline from "@/components/TrattativaTimeline";

export default function OperatorAppointments() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [trattative, setTrattative] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [timelineId, setTimelineId] = useState<string | null>(null);

  const fetchTrattative = async () => {
    try {
      const res = await fetch("/api/trattative?status=APPUNTAMENTO&operatorId=me");
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center">
            Appuntamenti Presi <span className="ml-3 bg-emerald-600 text-white text-sm py-1 px-3 rounded-full font-bold">{trattative.length}</span>
          </h1>
          <p className="text-gray-400 mt-2">Gli appuntamenti che hai fissato per i commerciali.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : trattative.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center shadow-lg">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nessun Appuntamento</h3>
          <p className="text-gray-400">Non hai fissato appuntamenti al momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trattative.map((st) => {
            const isPending = st.derogaStatus === "PENDING";
            const contact = st.contact;
            const currentAppt = st.appointments?.find((a: any) => a.id === st.currentAppointmentId);

            return (
              <div key={st.id} className={`bg-gray-800 rounded-xl border p-6 shadow-lg relative flex flex-col ${isPending ? 'border-yellow-500/50' : 'border-emerald-500/50'}`}>
                {isPending && (
                  <div className="absolute top-0 right-0 p-1.5 px-3 bg-yellow-600 rounded-bl-lg rounded-tr-lg z-10">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Deroga in Attesa TL</span>
                  </div>
                )}
                {!isPending && currentAppt?.status === "FISSATO" && (
                  <div className="absolute top-0 right-0 p-1.5 px-3 bg-emerald-600 rounded-bl-lg rounded-tr-lg z-10">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Confermato</span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4 border-b border-gray-700 pb-4 mt-2">
                  <div>
                    <h3 className="font-bold text-lg text-white mb-1">{contact.name}</h3>
                    <p className="text-sm text-gray-400 font-mono flex items-center"><Phone className="w-3 h-3 mr-1" /> {st.commercialPhone || contact.originalPhone || "Nessun numero"}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center"><MapPin className="w-3 h-3 mr-1" /> {contact.address} ({contact.cap})</p>
                  </div>
                </div>
                
                <div className="mb-6 flex-1">
                  <div className="text-sm text-gray-300 italic bg-gray-900 border border-gray-700 p-3 rounded-lg mb-4">
                    "{st.clientNeeds || "Nessuna nota"}"
                  </div>

                  {currentAppt && (
                    <>
                      <div className="flex items-center text-sm font-semibold mb-2 text-gray-300">
                        <Clock className="w-4 h-4 mr-1.5 text-blue-400" />
                        Data App.: <span className="ml-2 font-normal text-white">{new Date(currentAppt.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <div className="flex items-center text-sm font-semibold mb-2 text-gray-300">
                        <Send className="w-4 h-4 mr-1.5 text-emerald-400" />
                        Comm.: <span className="ml-2 font-normal text-white">{currentAppt.commercialeId || st.currentCommercialeId || "N/D"}</span>
                      </div>
                      {currentAppt.isPhoneAppt && (
                        <div className="mt-3 flex items-center text-xs font-bold text-purple-300 bg-purple-900/30 p-2 rounded border border-purple-800/50">
                          <Phone className="w-3 h-3 mr-2" /> Appuntamento Telefonico
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 mt-auto">
                  <button
                    onClick={() => setTimelineId(st.id)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4 mr-2" /> Dettagli & Timeline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {timelineId && (
        <TrattativaTimeline
          trattativaId={timelineId}
          onClose={() => setTimelineId(null)}
        />
      )}
    </div>
  );
}
