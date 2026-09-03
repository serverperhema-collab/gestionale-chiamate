"use client";

import { useState } from "react";
import { X, CheckCircle, XCircle, FileUp, AlertTriangle, Calendar, PhoneCall, RefreshCw, Handshake } from "lucide-react";
import toast from "react-hot-toast";

interface OutcomeModalProps {
  appointmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OutcomeModal({ appointmentId, onClose, onSuccess }: OutcomeModalProps) {
  // Main Category
  const [isSvolto, setIsSvolto] = useState<boolean | null>(null);

  // If Saltato
  const [skipReason, setSkipReason] = useState<"SALTATO_CLIENTE" | "SALTATO_COMMERCIALE" | "">("");
  const [saltatoAction, setSaltatoAction] = useState<"DA_RIFISSARE" | "KO_RICHIESTO" | "">("");
  
  // If Svolto
  const [outcomeFinal, setOutcomeFinal] = useState<"VENDUTO" | "NON_VENDUTO" | "RIPENSARCI" | "STANDBY" | "FOLLOWUP" | "TRATTATIVA_IN_CORSO" | "KO" | "">("");
  
  // Preventivo (Svolto)
  const [quoteOption, setQuoteOption] = useState<"NONE" | "ATTACH" | "REQUEST_TL">("NONE");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Azione Successiva (Svolto)
  const [nextActionType, setNextActionType] = useState<"RICHIAMO" | "FISSA_NUOVO_APP" | "">("");
  const [nextActionTarget, setNextActionTarget] = useState<"COMMERCIALE" | "OPERATORE" | "TEAM_LEADER" | "">("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [nextActionTime, setNextActionTime] = useState("");
  
  // Common
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // UI State for "Fissa Nuovo App"
  // Here we would typically open the CreateAppointmentModalTL or similar,
  // but for now we just submit the intent and the backend or frontend will handle it.
  const [wantsToFixAppt, setWantsToFixAppt] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        return data.url;
      } else {
        toast.error("Errore upload file");
        return null;
      }
    } catch (e) {
      toast.error("Errore di rete durante upload");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSvolto === null) {
      toast.error("Seleziona se l'appuntamento è stato svolto o meno.");
      return;
    }

    if (!notes.trim()) {
      toast.error("Le note/resoconto sono obbligatorie.");
      return;
    }

    const payload: any = { notes };

    if (!isSvolto) {
      if (!skipReason) {
        toast.error("Seleziona il motivo per cui è saltato.");
        return;
      }
      if (!saltatoAction) {
        toast.error("Seleziona l'azione successiva (Rifissare o KO).");
        return;
      }
      payload.skipReason = skipReason;
      payload.koRequested = saltatoAction === "KO_RICHIESTO";
      if (saltatoAction === "DA_RIFISSARE") {
         if (!nextActionDate) {
            toast.error("Seleziona la data per il richiamo.");
            return;
         }
         payload.nextActionDate = new Date(nextActionDate).toISOString();
      }
    } else {
      if (!outcomeFinal) {
        toast.error("Seleziona l'esito finale della visita.");
        return;
      }
      payload.outcomeFinal = outcomeFinal;

      // Quote logic
      if (quoteOption === "REQUEST_TL") {
        if (!quoteNotes.trim()) {
          toast.error("Inserisci i dettagli per la richiesta del preventivo.");
          return;
        }
        payload.quoteRequested = true;
        payload.quoteNotes = quoteNotes;
      } else if (quoteOption === "ATTACH") {
        if (!file) {
          toast.error("Allega il file del preventivo.");
          return;
        }
      }

      // Next Action logic
      if (nextActionType === "RICHIAMO") {
        if (!nextActionTarget) {
          toast.error("Seleziona a chi assegnare il richiamo.");
          return;
        }
        if (!nextActionDate) {
          toast.error("Seleziona la data del richiamo.");
          return;
        }
        if (nextActionTarget === "OPERATORE" && !nextActionTime) {
          toast.error("Seleziona l'orario per il richiamo dell'operatore.");
          return;
        }
        payload.nextActionType = nextActionType;
        payload.nextActionTarget = nextActionTarget;
        
        let dateObj = new Date(nextActionDate);
        if (nextActionTime) {
           const [h, m] = nextActionTime.split(":");
           dateObj.setHours(parseInt(h), parseInt(m));
        }
        payload.nextActionDate = dateObj.toISOString();
      } else if (nextActionType === "FISSA_NUOVO_APP") {
        payload.nextActionType = nextActionType;
        payload.wantsToFixAppt = wantsToFixAppt;
      }
    }

    setSubmitting(true);
    try {
      if (quoteOption === "ATTACH" && file) {
        const quoteUrl = await uploadFile();
        if (!quoteUrl) {
          setSubmitting(false);
          return; // Upload failed
        }
        payload.quoteUrl = quoteUrl;
        payload.quoteAttached = true;
      }

      const res = await fetch(`/api/commerciale/appointments/${appointmentId}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Esito salvato con successo");
        
        if (payload.nextActionType === "FISSA_NUOVO_APP" && wantsToFixAppt) {
          // Instruct parent to open fix appt modal, passing data
          // For now, we will just rely on onSuccess and let the UI know if needed.
          // Ideally, we'd trigger a callback `onFissaNuovo(appointmentId)`
        }
        
        onSuccess();
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore durante il salvataggio");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700 flex flex-col my-8 max-h-[90vh]">
        
        <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-gray-700 bg-gray-900/50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">Esito Appuntamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 space-y-8 overflow-y-auto custom-scrollbar flex-1 min-h-0">
            
            {/* Scelta Principale */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">L'appuntamento è stato svolto?</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setIsSvolto(true); setSkipReason(""); setSaltatoAction(""); }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    isSvolto === true
                      ? "bg-emerald-900/30 border-emerald-500 text-emerald-400" 
                      : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  <Handshake className="w-8 h-8 mb-2" />
                  <span className="font-bold">SI, VISITA SVOLTA</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSvolto(false); setOutcomeFinal(""); setQuoteOption("NONE"); setNextActionType(""); }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    isSvolto === false
                      ? "bg-red-900/30 border-red-500 text-red-400" 
                      : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  <XCircle className="w-8 h-8 mb-2" />
                  <span className="font-bold">NO, SALTATO</span>
                </button>
              </div>
            </div>

            {/* FLUSSO: NO, SALTATO */}
            {isSvolto === false && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Motivo *</label>
                  <select required value={skipReason} onChange={e => setSkipReason(e.target.value as any)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-3 text-white">
                    <option value="">-- Seleziona --</option>
                    <option value="SALTATO_CLIENTE">Colpa del Cliente (Assente, Ha disdetto, ecc.)</option>
                    <option value="SALTATO_COMMERCIALE">Colpa del Commerciale (Imprevisto, Ritardo, ecc.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Azione Successiva *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setSaltatoAction("DA_RIFISSARE")} className={`p-3 rounded-lg border flex items-center justify-center ${saltatoAction === "DA_RIFISSARE" ? 'bg-blue-900/40 border-blue-500 text-blue-400' : 'bg-gray-900 border-gray-700 text-gray-400'}`}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Da Rifissare
                    </button>
                    <button type="button" onClick={() => setSaltatoAction("KO_RICHIESTO")} className={`p-3 rounded-lg border flex items-center justify-center ${saltatoAction === "KO_RICHIESTO" ? 'bg-red-900/40 border-red-500 text-red-400' : 'bg-gray-900 border-gray-700 text-gray-400'}`}>
                      <AlertTriangle className="w-4 h-4 mr-2" /> Richiedi KO
                    </button>
                  </div>
                </div>

                {saltatoAction === "DA_RIFISSARE" && (
                  <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Data per il richiamo *</label>
                     <input type="date" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white" />
                  </div>
                )}
                
                {saltatoAction === "KO_RICHIESTO" && (
                   <div className="bg-red-900/20 border border-red-800/30 p-3 rounded-lg text-sm text-red-300">
                     Il KO dovrà essere approvato dalla Team Leader. Il contatto finirà nell'area "App KO da Decidere".
                   </div>
                )}
              </div>
            )}

            {/* FLUSSO: SI, SVOLTO */}
            {isSvolto === true && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Esito Finale Visita *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                        { val: "TRATTATIVA_IN_CORSO", label: "TRATTATIVA IN CORSO" },
                        { val: "KO", label: "KO" },
                        { val: "STANDBY", label: "STANDBY" },
                        { val: "VENDUTO", label: "CONTRATTO FIRMATO" }
                      ].map(out => (
                        <button
                          key={out.val}
                          type="button"
                          onClick={() => setOutcomeFinal(out.val as any)}
                          className={`p-2 rounded border text-sm font-bold transition-all ${
                            outcomeFinal === out.val 
                              ? (out.val === "VENDUTO" ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' : out.val === "KO" ? 'bg-red-900/50 border-red-500 text-red-400' : 'bg-blue-900/50 border-blue-500 text-blue-400')
                              : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {out.label}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 space-y-4">
                  <label className="block text-sm font-medium text-gray-300">Preventivo</label>
                  <div className="flex space-x-2">
                    <button type="button" onClick={() => setQuoteOption("NONE")} className={`flex-1 py-2 rounded border text-sm ${quoteOption === "NONE" ? 'bg-gray-700 border-gray-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>Nessuno</button>
                    <button type="button" onClick={() => setQuoteOption("ATTACH")} className={`flex-1 py-2 rounded border text-sm ${quoteOption === "ATTACH" ? 'bg-purple-900/50 border-purple-500 text-purple-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>Allega File</button>
                    <button type="button" onClick={() => setQuoteOption("REQUEST_TL")} className={`flex-1 py-2 rounded border text-sm ${quoteOption === "REQUEST_TL" ? 'bg-blue-900/50 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>Richiedi a TL</button>
                  </div>

                  {quoteOption === "ATTACH" && (
                    <input 
                      type="file" 
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                      required
                      className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-900/30 file:text-purple-400"
                    />
                  )}

                  {quoteOption === "REQUEST_TL" && (
                    <textarea
                      required
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      className="w-full h-20 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Dettagli del preventivo per la TL (budget, prodotti interessati...)"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Azione Successiva</label>
                  <div className="flex space-x-2 mb-4">
                    <button type="button" onClick={() => { setNextActionType("RICHIAMO"); setNextActionTarget("COMMERCIALE"); }} className={`flex-1 py-2 rounded border text-xs font-bold ${nextActionType === "RICHIAMO" && nextActionTarget === "COMMERCIALE" ? 'bg-blue-900/50 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                      MIO RICHIAMO
                    </button>
                    <button type="button" onClick={() => { setNextActionType("RICHIAMO"); setNextActionTarget("OPERATORE"); }} className={`flex-1 py-2 rounded border text-xs font-bold ${nextActionType === "RICHIAMO" && nextActionTarget === "OPERATORE" ? 'bg-orange-900/50 border-orange-500 text-orange-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                      RIMBALZO OPERAT.
                    </button>
                    <button type="button" onClick={() => { setNextActionType("FISSA_NUOVO_APP"); setNextActionTarget(""); }} className={`flex-1 py-2 rounded border text-xs font-bold ${nextActionType === "FISSA_NUOVO_APP" ? 'bg-teal-900/50 border-teal-500 text-teal-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                      FISSA 2° APP.
                    </button>
                  </div>

                  {nextActionType === "RICHIAMO" && (
                    <div className="grid grid-cols-2 gap-4 bg-gray-900/30 p-4 rounded-xl border border-gray-700">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Data *</label>
                        <input type="date" required value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
                      </div>
                      {nextActionTarget === "OPERATORE" && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Ora *</label>
                          <input type="time" required value={nextActionTime} onChange={e => setNextActionTime(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
                        </div>
                      )}
                      <div className="col-span-2 text-xs text-gray-500">
                        {nextActionTarget === "COMMERCIALE" ? "Questo richiamo lo vedrai tu nella tua agenda personale." : "Questo richiamo verrà notificato all'operatore originale."}
                      </div>
                    </div>
                  )}

                  {nextActionType === "FISSA_NUOVO_APP" && (
                    <div className="bg-teal-900/20 border border-teal-800/30 p-4 rounded-xl flex items-center justify-between">
                       <span className="text-sm text-teal-300">Vuoi fissare subito il 2° appuntamento?</span>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={wantsToFixAppt} onChange={(e) => setWantsToFixAppt(e.target.checked)} />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Note generali - Sempre presenti ma alla fine */}
            {isSvolto !== null && (
              <div className="border-t border-gray-700 pt-6">
                <label className="block text-sm font-bold text-gray-300 mb-2">Resoconto / Note (obbligatorie) *</label>
                <textarea
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-28 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder={isSvolto ? "Riassumi cosa vi siete detti..." : "Dettaglia il motivo per cui è saltato..."}
                />
              </div>
            )}

          </div>

          <div className="flex-shrink-0 pt-4 p-5 border-t border-gray-700 bg-gray-900/50 flex space-x-3 rounded-b-2xl">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition font-medium text-center"
            >
              Annulla
            </button>
            <button 
              type="submit" 
              disabled={submitting || uploading || isSvolto === null} 
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition disabled:opacity-50 flex justify-center items-center"
            >
              {(submitting || uploading) ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : "Salva Esito"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
