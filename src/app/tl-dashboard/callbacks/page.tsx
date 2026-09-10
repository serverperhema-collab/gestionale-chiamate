"use client";

import { useState, useEffect } from "react";
import { PhoneCall, MapPin, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import TrattativaTimeline from "@/components/TrattativaTimeline";

export default function TLCallbacksPage() {
  const [trattative, setTrattative] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineId, setTimelineId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/trattative?status=RICHIAMO_PERSONALE&operatorId=null");
      if (res.ok) {
        const data = await res.json();
        setTrattative(data.trattative || []);
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
    fetchData();
  }, []);

  const handleFreeContact = async (st: any) => {
    try {
      // Chiudi la trattativa e rimetti il contatto in calderone
      const res = await fetch(`/api/trattative/${st.id}/actions`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ action: "chiudi-persa", payload: { outcomeNotes: "Rimbalzo gestito dal TL (Trattativa Chiusa)" } })
      });
      if (res.ok) {
        toast.success("Contatto sbloccato e rimesso nel calderone");
        fetchData();
      } else {
        toast.error("Errore durante lo sblocco");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center">
            Rimbalzi Operatori <span className="ml-3 bg-red-600 text-white text-sm py-1 px-3 rounded-full font-bold">{trattative.length}</span>
          </h1>
          <p className="text-gray-400 mt-2">Trattative di richiamo senza operatore assegnato (orfanelli).</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      ) : trattative.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center shadow-lg">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nessun rimbalzo!</h3>
          <p className="text-gray-400">Tutti i richiami sono assegnati a un operatore.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trattative.map((st) => (
            <div key={st.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4 border-b border-gray-700 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-white mb-1">{st.contact.name}</h3>
                  <p className="text-sm text-gray-400 font-mono">{st.contact.originalPhone || "Nessun numero"}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center"><MapPin className="w-3 h-3 mr-1" />{st.contact.address} ({st.contact.cap})</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-gray-400 mb-1">Motivo Richiamo (Note):</p>
                  <p className="text-sm text-white italic">"{st.clientNeeds || "Nessuna nota"}"</p>
                </div>
                {st.nextActionDate && (
                  <div className="mt-3 flex items-center text-sm font-semibold text-gray-400">
                    <Clock className="w-4 h-4 mr-2 text-blue-400" />
                    Data: <span className="ml-2 text-white">{new Date(st.nextActionDate).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setTimelineId(st.id)}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center"
                >
                  <PhoneCall className="w-4 h-4 mr-2" /> Dettagli ST
                </button>
                <button
                  onClick={() => handleFreeContact(st)}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Libera nel Calderone
                </button>
              </div>
            </div>
          ))}
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
