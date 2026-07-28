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
            Approvazione Trattative
          </h2>
          <p className="text-gray-400 mt-1">
            Valuta le richieste di "Trattativa In Corso" inviate dagli operatori per evitare abusi. Imposta una scadenza.
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
          <h3 className="text-xl font-bold text-white mb-2">Nessuna trattativa da approvare</h3>
          <p className="text-gray-400">Tutti i ricontatti sono stati gestiti.</p>
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
                  Motivazione Operatore:
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 italic mb-4">
                  "{neg.reason}"
                </div>
                <div className="text-sm mb-2 text-gray-300">
                  <span className="text-gray-500">Data Ricontatto Proposta:</span><br/>
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
                      Motivazione del Rifiuto *
                    </label>
                    <textarea 
                      className="w-full bg-gray-900 border border-red-500/50 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none h-20"
                      placeholder="Perché stai rifiutando questa trattativa?"
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
                        Conferma Rifiuto
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <label className="text-sm text-gray-400 flex items-center">
                        <Clock className="w-4 h-4 mr-1.5" />
                        Scadenza (Giorni):
                      </label>
                      <input 
                        type="number" 
                        min="1" 
                        max="30"
                        value={daysToExpire[neg.id] || 7}
                        onChange={(e) => setDaysToExpire({...daysToExpire, [neg.id]: parseInt(e.target.value) || 7})}
                        className="w-20 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-center focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setRejectingId(neg.id);
                          setRejectNote("");
                        }}
                        disabled={processingId === neg.id}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-red-400 hover:text-red-300 rounded-lg transition font-medium text-sm flex items-center justify-center disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Rifiuta
                      </button>
                      <button
                        onClick={() => handleAction(neg.id, "APPROVE")}
                        disabled={processingId === neg.id}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Approva
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
