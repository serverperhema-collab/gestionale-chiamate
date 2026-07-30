"use client";

import { useState, useEffect } from "react";
import { Handshake, ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NegotiationsPage() {
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [daysToExpire, setDaysToExpire] = useState<{ [key: string]: number }>({});

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const fetchNegotiations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tl/negotiations");
      const data = await res.json();
      if (res.ok) {
        setNegotiations(data.negotiations);
        const initialDays: any = {};
        data.negotiations.forEach((n: any) => {
          initialDays[n.id] = 7; // Default 7 giorni
        });
        setDaysToExpire(initialDays);
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
    fetchNegotiations();
  }, []);

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !rejectNote.trim()) {
      toast.error("Devi inserire una nota per il rifiuto");
      return;
    }

    setProcessingId(id);
    try {
      const payload = { 
        id, 
        action, 
        daysToExpire: daysToExpire[id] || 7,
        rejectNote: action === "REJECT" ? rejectNote : undefined
      };
      const res = await fetch("/api/tl/negotiations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(action === "APPROVE" ? "Trattativa approvata!" : "Trattativa rifiutata!");
        setNegotiations(negotiations.filter(n => n.id !== id));
        if (action === "REJECT") {
          setRejectingId(null);
          setRejectNote("");
        }
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
    <div className="flex-1 p-8 bg-gray-900 min-h-screen text-gray-100">
      <div className="mb-6">
        <Link href="/tl-dashboard" className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition shadow-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Dashboard
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center">
            <Handshake className="w-6 h-6 mr-3 text-purple-400" />
            Richiami Personali Operatori
          </h2>
          <p className="text-gray-400 mt-1">
            Visualizza e gestisci tutti i richiami personali attivi degli operatori. Puoi forzare il rilascio di un ricontatto per rimetterlo nel calderone.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : negotiations.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center shadow-lg">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nessun richiamo personale attivo</h3>
          <p className="text-gray-400">Al momento non ci sono richiami personali registrati nel sistema.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {negotiations.map((neg) => (
            <div key={neg.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg relative flex flex-col">
              <div className="flex items-start justify-between mb-4 border-b border-gray-700 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-white mb-1">{neg.contact.name}</h3>
                  <p className="text-sm text-gray-400 font-mono">{neg.contact.originalPhone || "Nessun numero"} ({neg.contact.cap})</p>
                </div>
              </div>
              
              <div className="mb-6 flex-1">
                <div className="flex items-center text-sm text-purple-400 font-semibold mb-2">
                  <Handshake className="w-4 h-4 mr-1.5" />
                  Nota Operatore:
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 italic mb-4">
                  "{neg.reason}"
                </div>
                <div className="text-sm mb-2 text-gray-300">
                  <span className="text-gray-500">Data Ricontatto Programmata:</span><br/>
                  <span className="font-semibold">{new Date(neg.recallDate).toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-500 mt-4 text-right">
                  Operatore: <span className="font-semibold text-gray-300">{neg.operator.name}</span>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 mt-auto">
                {rejectingId === neg.id ? (
                  <div className="mb-4">
                    <label className="block text-sm text-red-400 mb-1 flex items-center">
                      <XCircle className="w-4 h-4 mr-1" />
                      Motivazione del Rilascio *
                    </label>
                    <textarea 
                      className="w-full bg-gray-900 border border-red-500/50 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none h-20"
                      placeholder="Perché stai forzando il rilascio di questo contatto?"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                    ></textarea>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectNote("");
                        }}
                        className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition text-xs"
                      >
                        Annulla
                      </button>
                      <button
                        onClick={() => handleAction(neg.id, "REJECT")}
                        disabled={processingId === neg.id || !rejectNote.trim()}
                        className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded transition text-xs font-medium disabled:opacity-50"
                      >
                        Forza Rilascio
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setRejectingId(neg.id);
                        setRejectNote("");
                      }}
                      disabled={processingId === neg.id}
                      className="w-full px-4 py-2 bg-red-900/20 border border-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition font-medium text-sm flex items-center justify-center disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Forza Rilascio (Calderone)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
