"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tl/reviews");
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews);
      } else {
        toast.error(data.error || "Errore di caricamento");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleAction = async (id: string, action: "RESTORE" | "BLACKLIST") => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/tl/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        if (action === "RESTORE") {
          toast.success("Contatto ripristinato nel calderone!");
        } else {
          toast.success("Contatto bloccato e spostato in Blacklist!");
        }
        setReviews(reviews.filter(r => r.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
        <div>
          <h3 className="text-lg font-bold text-white">Notifiche da Gestire</h3>
          <p className="text-sm text-gray-400">
            Richieste di sblocco ed eliminazione in sospeso (ignorate o non ancora gestite).
          </p>
        </div>
        <button 
          onClick={fetchReviews} 
          className="p-2 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
          title="Aggiorna lista"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nessuna richiesta di revisione</h3>
          <p className="text-gray-400 text-sm">Tutti i contatti sono in ordine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-gray-900/50 rounded-xl border border-gray-700 p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-white text-lg">{rev.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{rev.address || "Indirizzo non disponibile"} (CAP {rev.cap})</p>
                  </div>
                  <span className="bg-indigo-900/30 text-indigo-400 text-xs px-2 py-1 rounded border border-indigo-500/20 font-semibold">
                    Da Revisionare
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {rev.originalPhone && rev.originalPhone !== "N/D" && (
                    <div className="text-sm text-gray-300 font-mono">
                      <span className="text-gray-500">Tel:</span> {rev.originalPhone}
                    </div>
                  )}
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-sm">
                    <div className="flex items-center text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                      Segnalazione Operatore:
                    </div>
                    <p className="text-gray-300 italic">"{rev.reviewNote || "Nessuna nota fornita"}"</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">
                <button
                  onClick={() => handleAction(rev.id, "RESTORE")}
                  disabled={processingId === rev.id}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded border border-gray-700 transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Ripristina nel Calderone
                </button>
                <button
                  onClick={() => handleAction(rev.id, "BLACKLIST")}
                  disabled={processingId === rev.id}
                  className="flex-1 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-500/20 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> Sposta in Cestino Permanente
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
