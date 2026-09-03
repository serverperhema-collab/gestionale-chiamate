"use client";

import { useState, useEffect } from "react";
import HistoricalApptModal from "@/components/HistoricalApptModal";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Trash2, Calendar, Crown, Info } from "lucide-react";
import toast from "react-hot-toast";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showHistModal, setShowHistModal] = useState(false);
  const [histContact, setHistContact] = useState<{id: string, name: string} | null>(null);

  const [rescheduleData, setRescheduleData] = useState<{id: string, date: string, time: string} | null>(null);
  const [rejectReasonData, setRejectReasonData] = useState<{id: string, reason: string} | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tl/reviews");
      const data = await res.json();
      if (res.ok) setReviews(data.reviews);
      else toast.error(data.error || "Errore di caricamento");
    } catch { toast.error("Errore di rete"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleGestioneSeparataAction = async (id: string, action: "APPROVE" | "REJECT") => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/tl/gestione-separata", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        toast.success(action === "APPROVE" ? "Approvato: Contatto spostato nelle Pulizie!" : "Scartato: Contatto ripristinato!");
        setReviews(reviews.filter(r => r.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore");
      }
    } catch { toast.error("Errore di rete"); }
    finally { setProcessingId(null); }
  };

  const handleDerogaAction = async (id: string, action: "DEROGA_ACCEPT" | "DEROGA_REJECT" | "DEROGA_RESCHEDULE", newDate?: string, rejectReason?: string) => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/tl/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, newDate, rejectReason })
      });
      if (res.ok) {
        toast.success(action === "DEROGA_ACCEPT" ? "Approvato!" : action === "DEROGA_REJECT" ? "Rifiutato!" : "Spostato e approvato!");
        setReviews(reviews.filter(r => r.id !== id));
        if (action === "DEROGA_RESCHEDULE") setRescheduleData(null);
        if (action === "DEROGA_REJECT") setRejectReasonData(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Errore");
      }
    } catch { toast.error("Errore di rete"); }
    finally { setProcessingId(null); }
  };

  const handleAction = async (id: string, action: "RESTORE" | "BLACKLIST") => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/tl/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        toast.success(action === "RESTORE" ? "Contatto ripristinato!" : "Contatto bloccato!");
        setReviews(reviews.filter(r => r.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore");
      }
    } catch { toast.error("Errore di rete"); }
    finally { setProcessingId(null); }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
        <div>
          <h3 className="text-lg font-bold text-white">Notifiche da Gestire</h3>
          <p className="text-sm text-gray-400">Richieste in sospeso (Revisioni, Gestione Separata, e Appuntamenti in Deroga).</p>
        </div>
        <button onClick={fetchReviews} className="p-2 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white" title="Aggiorna lista">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nessuna notifica</h3>
          <p className="text-gray-400 text-sm">Tutto in ordine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {reviews.map((rev) => (
            <div key={rev.id} className={`rounded-xl border p-6 flex flex-col justify-between ${rev.type === 'DEROGA' ? 'bg-amber-900/10 border-amber-500/50 shadow-lg shadow-amber-900/20' : 'bg-gray-900/50 border-gray-700'}`}>
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-white text-lg">{rev.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{rev.address || "Indirizzo N/D"} (CAP {rev.cap})</p>
                  </div>
                  {rev.type === 'GESTIONE_SEPARATA' ? (
                    <span className="bg-teal-900/30 text-teal-400 text-xs px-2 py-1 rounded border border-teal-500/20 font-semibold">Gestione Separata</span>
                  ) : rev.type === 'DEROGA' ? (
                    <span className="bg-amber-500 text-black text-xs px-2 py-1 rounded border border-amber-400 font-bold flex items-center shadow-md shadow-amber-900/50">
                      <Crown className="w-3.5 h-3.5 mr-1" /> RICHIESTA SECONDO APPUNTAMENTO
                    </span>
                  ) : (
                    <span className="bg-indigo-900/30 text-indigo-400 text-xs px-2 py-1 rounded border border-indigo-500/20 font-semibold">Da Revisionare</span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {rev.originalPhone && rev.originalPhone !== "N/D" && (
                    <div className="text-sm text-gray-300 font-mono"><span className="text-gray-500">Tel:</span> {rev.originalPhone}</div>
                  )}

                  {rev.type === 'DEROGA' ? (
                    <div className="bg-gray-950/80 border border-amber-900/50 rounded-lg p-4 text-sm mt-2 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                      <div className="flex items-center text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
                        <AlertTriangle className="w-4 h-4 mr-1.5" /> Dettagli Deroga Commerciale:
                      </div>
                      <p className="text-gray-300">
                        {rev.reviewNote}
                      </p>
                      {rev.derogaDate && (
                         <div className="mt-3 inline-flex items-center bg-gray-900 border border-gray-800 text-gray-200 px-3 py-1.5 rounded-lg font-medium shadow-inner">
                           <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                           Data Richiesta: {new Date(rev.derogaDate).toLocaleString('it-IT')}
                         </div>
                      )}
                    </div>
                  ) : (
                    <div className={`bg-gray-900 border ${rev.type === 'GESTIONE_SEPARATA' ? 'border-teal-900/30' : 'border-gray-800'} rounded-lg p-3 text-sm mt-2`}>
                      <div className={`flex items-center ${rev.type === 'GESTIONE_SEPARATA' ? 'text-teal-400' : 'text-indigo-400'} font-bold text-xs uppercase tracking-wider mb-1`}>
                        <Info className="w-3.5 h-3.5 mr-1.5" /> Segnalazione:
                      </div>
                      <p className="text-gray-300 italic">"{rev.reviewNote || "Nessuna nota fornita"}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              {rev.type === 'DEROGA' ? (
                <div className="pt-4 border-t border-amber-900/30 mt-4">
                  
                  {/* Inline Reschedule Form */}
                  {rescheduleData?.id === rev.id && (
                    <div className="bg-gray-900 border border-blue-500/50 p-4 rounded-lg mb-4 animate-in fade-in">
                      <h5 className="text-sm font-bold text-blue-400 mb-2">Seleziona la nuova data per l'appuntamento (Sposta):</h5>
                      <div className="flex gap-2">
                        <input type="date" value={rescheduleData?.date || ""} onChange={e => setRescheduleData(prev => prev ? {...prev, date: e.target.value} : null)} className="flex-1 bg-gray-800 border border-gray-700 text-white p-2 rounded" />
                        <input type="time" value={rescheduleData?.time || ""} onChange={e => setRescheduleData(prev => prev ? {...prev, time: e.target.value} : null)} className="flex-1 bg-gray-800 border border-gray-700 text-white p-2 rounded" />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setRescheduleData(null)} className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition">Annulla</button>
                        <button onClick={() => {
                          if (!rescheduleData?.date || !rescheduleData?.time) return toast.error("Inserisci data e ora");
                          const d = new Date(rescheduleData.date);
                          const [h,m] = rescheduleData.time.split(":");
                          d.setHours(+h,+m);
                          handleDerogaAction(rev.id, "DEROGA_RESCHEDULE", d.toISOString());
                        }} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold transition shadow-lg shadow-blue-900/50">Conferma Spostamento</button>
                      </div>
                    </div>
                  )}

                  {/* Inline Reject Form */}
                  {rejectReasonData?.id === rev.id && (
                    <div className="bg-gray-900 border border-red-500/50 p-4 rounded-lg mb-4 animate-in fade-in">
                      <h5 className="text-sm font-bold text-red-400 mb-2">Motivazione del rifiuto (Obbligatoria):</h5>
                      <textarea
                        value={rejectReasonData?.reason || ""}
                        onChange={e => setRejectReasonData(prev => prev ? {...prev, reason: e.target.value} : null)}
                        className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded resize-none h-16"
                        placeholder="Es: Fuori zona, fuori orario..."
                      ></textarea>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setRejectReasonData(null)} className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition">Annulla</button>
                        <button onClick={() => {
                          if (!rejectReasonData?.reason.trim()) return toast.error("Inserisci la motivazione");
                          handleDerogaAction(rev.id, "DEROGA_REJECT", undefined, rejectReasonData.reason);
                        }} className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-bold transition shadow-lg shadow-red-900/50">Invia Rifiuto</button>
                      </div>
                    </div>
                  )}

                  {!rescheduleData && !rejectReasonData && (
                    <div className="flex gap-2">
                      <button onClick={() => setRejectReasonData({id: rev.id, reason: ""})} disabled={processingId === rev.id} className="flex-1 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 rounded text-sm font-bold transition disabled:opacity-50">
                        RIFIUTA
                      </button>
                      <button onClick={() => setRescheduleData({id: rev.id, date: "", time: ""})} disabled={processingId === rev.id} className="flex-1 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-500/30 rounded text-sm font-bold transition disabled:opacity-50">
                        CAMBIA DATA
                      </button>
                      <button onClick={() => handleDerogaAction(rev.id, "DEROGA_ACCEPT")} disabled={processingId === rev.id} className="flex-[1.5] py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-bold transition shadow-lg shadow-emerald-900/50 disabled:opacity-50">
                        CONFERMA APP.
                      </button>
                    </div>
                  )}
                </div>
              ) : rev.type === 'GESTIONE_SEPARATA' ? (
                <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">
                  <button onClick={() => handleGestioneSeparataAction(rev.id, "REJECT")} disabled={processingId === rev.id} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"><XCircle className="w-4 h-4" /> Scarta</button>
                  <button onClick={() => handleGestioneSeparataAction(rev.id, "APPROVE")} disabled={processingId === rev.id} className="flex-1 py-2 bg-teal-900/30 hover:bg-teal-900/50 text-teal-400 border border-teal-500/30 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"><CheckCircle className="w-4 h-4" /> Approva</button>
                </div>
              ) : (
                <div className="flex gap-2 pt-4 border-t border-gray-800 mt-4">
                  <button onClick={() => handleAction(rev.id, "RESTORE")} disabled={processingId === rev.id} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition text-sm font-semibold flex items-center justify-center gap-1.5"><XCircle className="w-4 h-4" /> Ripristina</button>
                  <button onClick={() => handleAction(rev.id, "BLACKLIST")} disabled={processingId === rev.id} className="flex-1 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/20 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5"><Trash2 className="w-4 h-4" /> Cestino</button>
                  <button onClick={() => { setHistContact({id: rev.contactId || rev.id, name: rev.name}); setShowHistModal(true); }} disabled={processingId === rev.id} className="flex-[0.5] py-2 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 border border-blue-500/20 rounded transition text-sm font-semibold flex items-center justify-center"><RefreshCw className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {showHistModal && histContact && (
        <HistoricalApptModal
          contactId={histContact.id}
          contactName={histContact.name}
          onClose={() => { setShowHistModal(false); setHistContact(null); }}
          onSuccess={() => { setShowHistModal(false); setHistContact(null); fetchReviews(); }}
        />
      )}
    </div>
  );
}