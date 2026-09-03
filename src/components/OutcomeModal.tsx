"use client";

import { useState } from "react";
import { X, XCircle, AlertTriangle, RefreshCw, Handshake } from "lucide-react";
import toast from "react-hot-toast";

interface OutcomeModalProps {
  appointmentId: string;
  onClose: () => void;
  onSuccess: (triggerFixAppt?: boolean) => void;
}

export default function OutcomeModal({ appointmentId, onClose, onSuccess }: OutcomeModalProps) {
  const [isSvolto, setIsSvolto] = useState<boolean | null>(null);

  const [skipReason, setSkipReason] = useState<"SALTATO_CLIENTE" | "SALTATO_COMMERCIALE" | "">("");
  const [saltatoAction, setSaltatoAction] = useState<"DA_RIFISSARE" | "KO_RICHIESTO" | "">("");

  const [outcomeFinal, setOutcomeFinal] = useState<"VENDUTO" | "TRATTATIVA_IN_CORSO" | "STANDBY" | "KO" | "">("");

  const [quoteOption, setQuoteOption] = useState<"NONE" | "ATTACH" | "REQUEST_TL">("NONE");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const [nextActionType, setNextActionType] = useState<"RICHIAMO" | "FISSA_NUOVO_APP" | "">("");
  const [nextActionTarget, setNextActionTarget] = useState<"COMMERCIALE" | "OPERATORE" | "TEAM_LEADER" | "">("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [nextActionTime, setNextActionTime] = useState("");
  const [wantsToFixAppt, setWantsToFixAppt] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const uploadFiles = async (): Promise<string | null> => {
    if (files.length === 0) return null;
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const f of files) {
        const formData = new FormData();
        formData.append("file", f);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) urls.push(data.url);
        else toast.error("Errore upload: " + f.name);
      }
      return urls.join(",");
    } catch { toast.error("Errore di rete upload"); return null; }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSvolto === null) { toast.error("Seleziona se svolto."); return; }
    if (!notes.trim() && outcomeFinal !== "VENDUTO") { toast.error("Le note sono obbligatorie."); return; }

    const payload: Record<string, unknown> = { notes };

    if (!isSvolto) {
      if (!skipReason) { toast.error("Seleziona il motivo."); return; }
      if (!saltatoAction) { toast.error("Seleziona azione successiva."); return; }
      payload.skipReason = skipReason;
      payload.koRequested = saltatoAction === "KO_RICHIESTO";
      if (saltatoAction === "DA_RIFISSARE") {
        if (!nextActionDate) { toast.error("Inserisci data richiamo."); return; }
        payload.nextActionDate = new Date(nextActionDate).toISOString();
      }
    } else {
      if (!outcomeFinal) { toast.error("Seleziona esito finale."); return; }
      payload.outcomeFinal = outcomeFinal;

      if (outcomeFinal !== "VENDUTO") {
        if (quoteOption === "REQUEST_TL") {
          if (!quoteNotes.trim()) { toast.error("Inserisci dettagli preventivo."); return; }
          payload.quoteRequested = true;
          payload.quoteNotes = quoteNotes;
        } else if (quoteOption === "ATTACH" && files.length === 0) {
          toast.error("Allega il file preventivo."); return;
        }
        if (nextActionType === "RICHIAMO") {
          if (!nextActionTarget) { toast.error("Seleziona a chi assegnare."); return; }
          if (!nextActionDate) { toast.error("Seleziona data richiamo."); return; }
          if (nextActionTarget === "OPERATORE" && !nextActionTime) { toast.error("Inserisci orario."); return; }
          payload.nextActionType = nextActionType;
          payload.nextActionTarget = nextActionTarget;
          const d = new Date(nextActionDate);
          if (nextActionTime) { const [h,m] = nextActionTime.split(":"); d.setHours(+h,+m); }
          payload.nextActionDate = d.toISOString();
        } else if (nextActionType === "FISSA_NUOVO_APP") {
          payload.nextActionType = nextActionType;
          payload.wantsToFixAppt = wantsToFixAppt;
        }
      }
    }

    setSubmitting(true);
    try {
      if (files.length > 0 && (outcomeFinal === "VENDUTO" || quoteOption === "ATTACH")) {
        const quoteUrl = await uploadFiles();
        if (!quoteUrl) { setSubmitting(false); return; }
        payload.quoteUrl = quoteUrl;
        payload.quoteAttached = true;
      }
      const res = await fetch(`/api/commerciale/appointments/${appointmentId}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success("Esito salvato!");
        if (payload.nextActionType === "FISSA_NUOVO_APP" && wantsToFixAppt) onSuccess(true);
        else onSuccess();
      } else {
        const d = await res.json();
        toast.error(d.error || "Errore salvataggio");
      }
    } catch { toast.error("Errore di rete"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700 flex flex-col my-8 max-h-[90vh]">
        <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-gray-700 bg-gray-900/50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">Esito Appuntamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 space-y-8 overflow-y-auto custom-scrollbar flex-1 min-h-0">

            {/* Scelta Principale */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">L&apos;appuntamento e&apos; stato svolto?</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => { setIsSvolto(true); setSkipReason(""); setSaltatoAction(""); }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${isSvolto === true ? "bg-emerald-900/30 border-emerald-500 text-emerald-400" : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                  <Handshake className="w-8 h-8 mb-2" /><span className="font-bold">SI, VISITA SVOLTA</span>
                </button>
                <button type="button" onClick={() => { setIsSvolto(false); setOutcomeFinal(""); setQuoteOption("NONE"); setNextActionType(""); setFiles([]); }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${isSvolto === false ? "bg-red-900/30 border-red-500 text-red-400" : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                  <XCircle className="w-8 h-8 mb-2" /><span className="font-bold">NO, SALTATO</span>
                </button>
              </div>
            </div>

            {/* SALTATO */}
            {isSvolto === false && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Motivo *</label>
                  <select value={skipReason} onChange={e => setSkipReason(e.target.value as "SALTATO_CLIENTE" | "SALTATO_COMMERCIALE" | "")} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-3 text-white">
                    <option value="">-- Seleziona --</option>
                    <option value="SALTATO_CLIENTE">Colpa del Cliente</option>
                    <option value="SALTATO_COMMERCIALE">Colpa del Commerciale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Azione Successiva *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setSaltatoAction("DA_RIFISSARE")} className={`p-3 rounded-lg border flex items-center justify-center ${saltatoAction === "DA_RIFISSARE" ? "bg-blue-900/40 border-blue-500 text-blue-400" : "bg-gray-900 border-gray-700 text-gray-400"}`}><RefreshCw className="w-4 h-4 mr-2" /> Da Rifissare</button>
                    <button type="button" onClick={() => setSaltatoAction("KO_RICHIESTO")} className={`p-3 rounded-lg border flex items-center justify-center ${saltatoAction === "KO_RICHIESTO" ? "bg-red-900/40 border-red-500 text-red-400" : "bg-gray-900 border-gray-700 text-gray-400"}`}><AlertTriangle className="w-4 h-4 mr-2" /> Richiedi KO</button>
                  </div>
                </div>
                {saltatoAction === "DA_RIFISSARE" && (
                  <div><label className="block text-sm font-medium text-gray-300 mb-2">Data richiamo *</label>
                  <input type="date" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white" /></div>
                )}
                {saltatoAction === "KO_RICHIESTO" && <div className="bg-red-900/20 border border-red-800/30 p-3 rounded-lg text-sm text-red-300">Il KO dovra essere approvato dalla TL.</div>}
              </div>
            )}

            {/* SVOLTO */}
            {isSvolto === true && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Esito */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Esito Finale *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { val: "TRATTATIVA_IN_CORSO", label: "TRATTATIVA IN CORSO", a: "bg-blue-900/50 border-blue-500 text-blue-400" },
                      { val: "KO", label: "KO", a: "bg-red-900/50 border-red-500 text-red-400" },
                      { val: "STANDBY", label: "STANDBY", a: "bg-orange-900/50 border-orange-500 text-orange-400" },
                      { val: "VENDUTO", label: "CONTRATTO FIRMATO", a: "bg-emerald-900/50 border-emerald-500 text-emerald-400" },
                    ].map(o => (
                      <button key={o.val} type="button"
                        onClick={() => { setOutcomeFinal(o.val as "VENDUTO" | "TRATTATIVA_IN_CORSO" | "STANDBY" | "KO"); setQuoteOption("NONE"); setNextActionType(""); setFiles([]); }}
                        className={`p-2 rounded border text-sm font-bold transition-all ${outcomeFinal === o.val ? o.a : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CONTRATTO FIRMATO: COMPLIMENTI */}
                {outcomeFinal === "VENDUTO" && (
                  <div className="bg-emerald-900/20 border-2 border-emerald-500/60 rounded-xl p-5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center mb-3">
                      <Handshake className="w-7 h-7 text-emerald-400 mr-3" />
                      <h4 className="text-emerald-400 font-extrabold text-2xl">COMPLIMENTI! 🎉</h4>
                    </div>
                    <p className="text-sm text-gray-300 mb-5">Ottimo lavoro! Allega il contratto firmato e tutti i documenti necessari. Puoi caricare piu file.</p>
                    <label className="block text-sm font-semibold text-emerald-300 mb-2">Allega Contratto e Documenti</label>
                    <input type="file" accept=".pdf,image/*" multiple onChange={handleFileChange}
                      className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-900/40 file:text-emerald-400 hover:file:bg-emerald-900/60 cursor-pointer" />
                    {files.length > 0 && <p className="mt-3 text-sm text-emerald-400 font-semibold">✓ {files.length} {files.length === 1 ? "file selezionato" : "file selezionati"}</p>}
                  </div>
                )}

                {/* ALTRI ESITI */}
                {outcomeFinal !== "" && outcomeFinal !== "VENDUTO" && (
                  <>
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 space-y-4">
                      <label className="block text-sm font-medium text-gray-300">Preventivo</label>
                      <div className="flex space-x-2">
                        <button type="button" onClick={() => setQuoteOption("NONE")} className={`flex-1 py-2 rounded border text-sm ${quoteOption === "NONE" ? "bg-gray-700 border-gray-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400"}`}>Nessuno</button>
                        <button type="button" onClick={() => setQuoteOption("ATTACH")} className={`flex-1 py-2 rounded border text-sm ${quoteOption === "ATTACH" ? "bg-purple-900/50 border-purple-500 text-purple-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>Allega File</button>
                        <button type="button" onClick={() => setQuoteOption("REQUEST_TL")} className={`flex-1 py-2 rounded border text-sm ${quoteOption === "REQUEST_TL" ? "bg-blue-900/50 border-blue-500 text-blue-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>Richiedi a TL</button>
                      </div>
                      {quoteOption === "ATTACH" && <input type="file" accept=".pdf,image/*" multiple onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-900/30 file:text-purple-400" />}
                      {quoteOption === "REQUEST_TL" && <textarea required value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} className="w-full h-20 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm resize-none" placeholder="Dettagli preventivo per TL..." />}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Azione Successiva</label>
                      <div className="flex space-x-2 mb-4">
                        <button type="button" onClick={() => { setNextActionType("RICHIAMO"); setNextActionTarget("COMMERCIALE"); }} className={`flex-1 py-2 rounded border text-xs font-bold ${nextActionType === "RICHIAMO" && nextActionTarget === "COMMERCIALE" ? "bg-blue-900/50 border-blue-500 text-blue-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>MIO RICHIAMO</button>
                        <button type="button" onClick={() => { setNextActionType("RICHIAMO"); setNextActionTarget("OPERATORE"); }} className={`flex-1 py-2 rounded border text-xs font-bold ${nextActionType === "RICHIAMO" && nextActionTarget === "OPERATORE" ? "bg-orange-900/50 border-orange-500 text-orange-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>RIMBALZO OPERAT.</button>
                        <button type="button" onClick={() => { setNextActionType("FISSA_NUOVO_APP"); setNextActionTarget(""); }} className={`flex-1 py-2 rounded border text-xs font-bold ${nextActionType === "FISSA_NUOVO_APP" ? "bg-teal-900/50 border-teal-500 text-teal-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>FISSA 2° APP.</button>
                      </div>
                      {nextActionType === "RICHIAMO" && (
                        <div className="grid grid-cols-2 gap-4 bg-gray-900/30 p-4 rounded-xl border border-gray-700">
                          <div><label className="block text-xs text-gray-400 mb-1">Data *</label><input type="date" required value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></div>
                          {nextActionTarget === "OPERATORE" && <div><label className="block text-xs text-gray-400 mb-1">Ora *</label><input type="time" required value={nextActionTime} onChange={e => setNextActionTime(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></div>}
                          <div className="col-span-2 text-xs text-gray-500">{nextActionTarget === "COMMERCIALE" ? "Questo richiamo lo vedrai tu nella tua agenda." : "Questo richiamo verra notificato all operatore."}</div>
                        </div>
                      )}
                      {nextActionType === "FISSA_NUOVO_APP" && (
                        <div className="bg-teal-900/20 border border-teal-800/30 p-4 rounded-xl flex items-center justify-between">
                          <span className="text-sm text-teal-300">Vuoi fissare subito il 2 appuntamento?</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={wantsToFixAppt} onChange={e => setWantsToFixAppt(e.target.checked)} />
                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                          </label>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {isSvolto !== null && (
              <div className="border-t border-gray-700 pt-6">
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  {outcomeFinal === "VENDUTO" ? "Note (opzionali)" : "Resoconto / Note (obbligatorie) *"}
                </label>
                <textarea required={outcomeFinal !== "VENDUTO"} value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full h-28 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={isSvolto ? "Riassumi cosa vi siete detti..." : "Dettaglia il motivo per cui e saltato..."} />
              </div>
            )}
          </div>

          <div className="flex-shrink-0 p-5 border-t border-gray-700 bg-gray-900/50 flex space-x-3 rounded-b-2xl">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-medium">Annulla</button>
            <button type="submit" disabled={submitting || uploading || isSvolto === null} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50 flex justify-center items-center">
              {(submitting || uploading) ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Salva Esito"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}