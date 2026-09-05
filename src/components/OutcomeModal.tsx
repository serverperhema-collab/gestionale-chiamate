"use client";

import { useState } from "react";
import { X, XCircle, AlertTriangle, RefreshCw, Handshake } from "lucide-react";
import toast from "react-hot-toast";

interface OutcomeModalProps {
  appointmentId: string;
  trattativaId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OutcomeModal({ appointmentId, trattativaId, onClose, onSuccess }: OutcomeModalProps) {
  const [isSvolto, setIsSvolto] = useState<boolean | null>(null);

  const [skipReason, setSkipReason] = useState<"SALTATO_CLIENTE" | "SALTATO_COMMERCIALE" | "">("");
  const [saltatoAction, setSaltatoAction] = useState<"DA_RIFISSARE" | "KO_RICHIESTO" | "">("");

  const [outcomeFinal, setOutcomeFinal] = useState<"VENDUTO" | "TRATTATIVA_IN_CORSO" | "STANDBY" | "KO" | "">("");
  const [outcomeNotes, setOutcomeNotes] = useState("");

  const [nextActionType, setNextActionType] = useState<"RICHIAMO" | "APPUNTAMENTO" | "PREVENTIVO" | "">("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (isSvolto === null) return toast.error("Seleziona se l'appuntamento si è svolto o no.");
    if (isSvolto && !outcomeFinal) return toast.error("Seleziona l'esito della visita.");
    if (!isSvolto && !skipReason) return toast.error("Seleziona il motivo per cui è saltato.");
    if (isSvolto && !outcomeNotes) return toast.error("Inserisci delle note.");

    try {
      setUploading(true);

      const payload: any = { appointmentId };

      if (!isSvolto) {
        // Appuntamento saltato: inviamo esito speciale o annulliamo
        // Nel nuovo sistema: 
        payload.outcomeFinal = "KO"; // TODO: o gestirlo come action annulla-appuntamento se non svolto
        payload.outcomeNotes = `Saltato: ${skipReason === "SALTATO_CLIENTE" ? "Cliente" : "Commerciale"} - ${saltatoAction}`;
        payload.skipReason = skipReason;
      } else {
        payload.outcomeFinal = outcomeFinal;
        payload.outcomeNotes = outcomeNotes;
        if (nextActionType) {
          payload.nextActionType = nextActionType;
          if (nextActionDate) {
            payload.nextActionDate = new Date(nextActionDate).toISOString();
          }
        }
      }

      // Se KO, chiama chiudi-persa o esito KO? 
      // Il service esito imposta outcomeFinal=KO e TRATTATIVA_IN_CORSO. 
      // Se si vuole chiudere subito la trattativa per KO, l'action è 'chiudi-persa' o lo fa il server? 
      // Il service "esito" permette di impostare outcomeFinal.

      let res;
      if (trattativaId) {
        res = await fetch(`/api/trattative/${trattativaId}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "esito", payload })
        });
      } else {
        // Fallback al sistema legacy
        res = await fetch(`/api/commerciale/appointments/${appointmentId}/outcome`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Errore durante il salvataggio");
      }

      toast.success("Esito inserito con successo!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Inserisci Esito Appuntamento</h2>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-3">L'appuntamento si è svolto?</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsSvolto(true)}
                className={`p-3 rounded-xl border font-bold flex items-center justify-center transition ${isSvolto === true ? "bg-emerald-900/50 border-emerald-500 text-emerald-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}
              >
                Sì, si è svolto
              </button>
              <button 
                onClick={() => setIsSvolto(false)}
                className={`p-3 rounded-xl border font-bold flex items-center justify-center transition ${isSvolto === false ? "bg-red-900/50 border-red-500 text-red-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}
              >
                No, è saltato
              </button>
            </div>
          </div>

          {isSvolto === true && (
            <>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-400">Esito dell'incontro</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button onClick={() => setOutcomeFinal("VENDUTO")} className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 ${outcomeFinal === "VENDUTO" ? "bg-emerald-900/50 border-emerald-500 text-emerald-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                    <Handshake className="w-5 h-5" /> Contratto
                  </button>
                  <button onClick={() => setOutcomeFinal("TRATTATIVA_IN_CORSO")} className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 ${outcomeFinal === "TRATTATIVA_IN_CORSO" ? "bg-blue-900/50 border-blue-500 text-blue-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                    <RefreshCw className="w-5 h-5" /> In Corso
                  </button>
                  <button onClick={() => setOutcomeFinal("STANDBY")} className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 ${outcomeFinal === "STANDBY" ? "bg-orange-900/50 border-orange-500 text-orange-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                    <AlertTriangle className="w-5 h-5" /> Standby
                  </button>
                  <button onClick={() => setOutcomeFinal("KO")} className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 ${outcomeFinal === "KO" ? "bg-red-900/50 border-red-500 text-red-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                    <XCircle className="w-5 h-5" /> KO
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-400">Note Esito</label>
                <textarea 
                  value={outcomeNotes} 
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="Dettagli incontro..."
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
                />
              </div>

              {outcomeFinal === "TRATTATIVA_IN_CORSO" && (
                <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-xl space-y-4">
                  <label className="block text-sm font-semibold text-blue-400">Prossima Azione (Opzionale)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setNextActionType("RICHIAMO")} className={`p-2 rounded border text-sm ${nextActionType === "RICHIAMO" ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400"}`}>Richiamo</button>
                    <button onClick={() => setNextActionType("APPUNTAMENTO")} className={`p-2 rounded border text-sm ${nextActionType === "APPUNTAMENTO" ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400"}`}>Appuntamento</button>
                    <button onClick={() => setNextActionType("PREVENTIVO")} className={`p-2 rounded border text-sm ${nextActionType === "PREVENTIVO" ? "bg-purple-600 border-purple-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400"}`}>Preventivo</button>
                  </div>
                  {nextActionType && (
                    <input type="datetime-local" value={nextActionDate} onChange={(e) => setNextActionDate(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white" />
                  )}
                </div>
              )}
            </>
          )}

          {isSvolto === false && (
            <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl space-y-4">
              <label className="block text-sm font-semibold text-red-400">Motivo</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setSkipReason("SALTATO_CLIENTE")} className={`p-3 rounded-xl border text-sm font-bold ${skipReason === "SALTATO_CLIENTE" ? "bg-red-600 border-red-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400"}`}>Per colpa del Cliente</button>
                <button onClick={() => setSkipReason("SALTATO_COMMERCIALE")} className={`p-3 rounded-xl border text-sm font-bold ${skipReason === "SALTATO_COMMERCIALE" ? "bg-red-600 border-red-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400"}`}>Per colpa del Commerciale</button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-800 flex justify-end gap-3 bg-gray-900 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 font-bold hover:text-white">Annulla</button>
          <button onClick={handleSubmit} disabled={uploading} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 disabled:opacity-50">
            {uploading ? "Salvataggio..." : "Salva Esito"}
          </button>
        </div>
      </div>
    </div>
  );
}