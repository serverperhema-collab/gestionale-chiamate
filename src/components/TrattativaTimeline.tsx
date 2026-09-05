"use client";

import { useState, useEffect } from "react";
import { X, Clock, FileText, User, RefreshCw, CheckCircle, AlertTriangle, PhoneCall, XCircle } from "lucide-react";

interface TrattativaTimelineProps {
  trattativaId: string;
  onClose: () => void;
}

export default function TrattativaTimeline({ trattativaId, onClose }: TrattativaTimelineProps) {
  const [trattativa, setTrattativa] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchST() {
      try {
        const res = await fetch(`/api/trattative/${trattativaId}`);
        if (res.ok) {
          const data = await res.json();
          setTrattativa(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchST();
  }, [trattativaId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-end">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md h-full bg-gray-900 border-l border-gray-700 shadow-2xl flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!trattativa) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md h-full bg-gray-950 border-l border-gray-700 shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Timeline Trattativa</h2>
            <p className="text-sm text-gray-400 mt-1">{trattativa.contact.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          <div className="mb-8 bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-lg">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Stato Attuale</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase bg-blue-900/50 text-blue-400 px-2 py-1 rounded border border-blue-700/50">
                {trattativa.status.replace(/_/g, ' ')}
              </span>
              {trattativa.derogaStatus !== "NONE" && (
                <span className="text-xs font-bold uppercase bg-amber-900/50 text-amber-400 px-2 py-1 rounded border border-amber-700/50">
                  Deroga: {trattativa.derogaStatus}
                </span>
              )}
            </div>
            
            <div className="space-y-2 mt-4 text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Operatore:</span>
                <span className="font-semibold text-white">{trattativa.currentOperatorId || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Commerciale:</span>
                <span className="font-semibold text-white">{trattativa.currentCommercialeId || "N/A"}</span>
              </div>
              {trattativa.nextActionType !== "NONE" && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <span className="text-blue-400 font-semibold">Prossima Azione:</span>
                  <span className="font-bold text-white">{trattativa.nextActionType}</span>
                </div>
              )}
            </div>
          </div>

          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Cronologia Eventi</h3>
          
          <div className="relative border-l-2 border-gray-800 ml-3 space-y-6">
            {trattativa.events?.map((evt: any) => (
              <div key={evt.id} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-gray-900 border-2 border-blue-500 rounded-full" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-mono mb-1">{new Date(evt.createdAt).toLocaleString()}</span>
                  <span className="text-sm font-bold text-white mb-1">{evt.eventType.replace(/_/g, ' ')}</span>
                  <span className="text-sm text-gray-400">{evt.description}</span>
                  {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                    <div className="mt-2 bg-gray-900 p-2 rounded text-xs text-gray-400 border border-gray-800 font-mono">
                      {JSON.stringify(evt.metadata, null, 2)}
                    </div>
                  )}
                  <span className="text-[10px] text-gray-600 mt-2 font-semibold">Utente: {evt.userId} ({evt.userRole})</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}