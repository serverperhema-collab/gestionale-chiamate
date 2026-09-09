"use client";

import { useState, useEffect } from "react";
import { X, Calendar, PhoneCall, Upload, ArrowRight, Save, User } from "lucide-react";
import { toast } from "react-hot-toast";

interface WizardProps {
  contactId: string;
  contactName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WizardCreaTrattativa({ contactId, contactName, onClose, onSuccess }: WizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Lists
  const [operators, setOperators] = useState<any[]>([]);
  const [commerciali, setCommerciali] = useState<any[]>([]);

  // Step 1: Assignment
  const [operatorId, setOperatorId] = useState("");
  const [commercialeId, setCommercialeId] = useState("");

  // Step 2: Event Type
  const [eventType, setEventType] = useState<"TELEFONO" | "APPUNTAMENTO" | "">("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventNotes, setEventNotes] = useState("");

  // Step 3: Preventivo
  const [hasPreventivo, setHasPreventivo] = useState<"SI" | "NO" | "">("");
  const [preventivoBy, setPreventivoBy] = useState("");
  const [preventivoDate, setPreventivoDate] = useState("");
  const [preventivoNotes, setPreventivoNotes] = useState("");
  // Mock file upload since we don't have S3 set up in the prompt, just a placeholder
  const [preventivoFile, setPreventivoFile] = useState<File | null>(null);

  // Step 4: Outcome (only if event is in the past)
  const [outcome, setOutcome] = useState<"RICHIAMO_OPERATORE" | "RICHIAMO_COMMERCIALE" | "CONTRATTO_FIRMATO" | "KO_DEFINITIVO" | "">("");
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [contrattoFile, setContrattoFile] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/users?role=OPERATORE").then(res => res.json()),
      fetch("/api/users?role=COMMERCIALE").then(res => res.json())
    ]).then(([ops, comms]) => {
      if (ops.users) setOperators(ops.users);
      if (comms.users) setCommerciali(comms.users);
    });
  }, []);

  const isEventPast = () => {
    if (!eventDate || !eventTime) return false;
    const dt = new Date(\`\${eventDate}T\${eventTime}\`);
    return dt < new Date();
  };

  const handleNext = () => {
    if (step === 1) {
      if (!operatorId) return toast.error("Seleziona un operatore");
      setStep(2);
    } else if (step === 2) {
      if (!eventType || !eventDate || !eventTime || !eventNotes.trim()) return toast.error("Compila tutti i campi dell'evento");
      setStep(3);
    } else if (step === 3) {
      if (hasPreventivo === "") return toast.error("Specifica se c'è un preventivo");
      if (hasPreventivo === "SI" && (!preventivoBy || !preventivoDate)) return toast.error("Compila i campi del preventivo");
      
      if (isEventPast()) {
        setStep(4);
      } else {
        submitWizard();
      }
    } else if (step === 4) {
      if (!outcome) return toast.error("Seleziona l'esito o il prossimo passo");
      if ((outcome === "RICHIAMO_OPERATORE" || outcome === "RICHIAMO_COMMERCIALE") && (!nextDate || !nextTime)) return toast.error("Inserisci data e ora del ricontatto");
      if (outcome === "KO_DEFINITIVO" && !outcomeNotes.trim()) return toast.error("Inserisci la motivazione del KO");
      if (outcome === "CONTRATTO_FIRMATO" && !outcomeNotes.trim()) return toast.error("Inserisci le note di chiusura");
      submitWizard();
    }
  };

  const submitWizard = async () => {
    setLoading(true);
    try {
      const payload = {
        contactId,
        operatorId,
        commercialeId,
        eventType,
        eventDate,
        eventTime,
        eventNotes,
        preventivo: hasPreventivo === "SI" ? { by: preventivoBy, date: preventivoDate, notes: preventivoNotes } : null,
        isPast: isEventPast(),
        outcome: isEventPast() ? outcome : null,
        nextDate,
        nextTime,
        outcomeNotes
      };

      const res = await fetch("/api/tl/wizard-trattativa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Trattativa creata con successo!");
        onSuccess();
      } else {
        toast.error(data.error || "Errore nella creazione");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-blue-500/50 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-black text-white">Crea Trattativa Guidata</h2>
            <p className="text-sm text-gray-400">Cliente: <strong className="text-blue-400">{contactName}</strong></p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 hover:bg-red-600 rounded-full text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP PROGRESS */}
          <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2, 3, 4].map(num => (
              <div key={num} className="flex flex-col items-center">
                <div className={\`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm \${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}\`}>
                  {num}
                </div>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-bold text-white mb-4">Step 1: Assegnazione</h3>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Operatore (Obbligatorio)</label>
                <select value={operatorId} onChange={e => setOperatorId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white">
                  <option value="">Seleziona...</option>
                  {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Commerciale (Facoltativo)</label>
                <select value={commercialeId} onChange={e => setCommercialeId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white">
                  <option value="">Nessuno</option>
                  {commerciali.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-bold text-white mb-4">Step 2: Evento Scatenante</h3>
              <div className="flex space-x-4 mb-4">
                <button onClick={() => setEventType("TELEFONO")} className={\`flex-1 p-4 rounded-xl border-2 transition font-bold flex flex-col items-center \${eventType === "TELEFONO" ? "border-blue-500 bg-blue-600/20 text-blue-400" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"}\`}>
                  <PhoneCall className="w-6 h-6 mb-2" /> Trattativa Telefonica
                </button>
                <button onClick={() => setEventType("APPUNTAMENTO")} className={\`flex-1 p-4 rounded-xl border-2 transition font-bold flex flex-col items-center \${eventType === "APPUNTAMENTO" ? "border-purple-500 bg-purple-600/20 text-purple-400" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"}\`}>
                  <Calendar className="w-6 h-6 mb-2" /> Con Appuntamento
                </button>
              </div>

              {eventType && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Data</label>
                    <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Ora</label>
                    <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-400 mb-1">Note / Dettagli</label>
                    <textarea value={eventNotes} onChange={e => setEventNotes(e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white resize-none" placeholder="Inserisci i dettagli di questa interazione..." />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-bold text-white mb-4">Step 3: Preventivo</h3>
              <div className="flex space-x-4 mb-6">
                <button onClick={() => setHasPreventivo("SI")} className={\`flex-1 py-3 rounded-lg border-2 font-bold transition \${hasPreventivo === "SI" ? "border-green-500 bg-green-500/20 text-green-400" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"}\`}>
                  Sì, allegato
                </button>
                <button onClick={() => setHasPreventivo("NO")} className={\`flex-1 py-3 rounded-lg border-2 font-bold transition \${hasPreventivo === "NO" ? "border-gray-500 bg-gray-700 text-white" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"}\`}>
                  No preventivo
                </button>
              </div>

              {hasPreventivo === "SI" && (
                <div className="space-y-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-1">Inviato da</label>
                      <input type="text" value={preventivoBy} onChange={e => setPreventivoBy(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" placeholder="Es. Mario Rossi" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-1">Data Invio</label>
                      <input type="date" value={preventivoDate} onChange={e => setPreventivoDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Note Preventivo</label>
                    <input type="text" value={preventivoNotes} onChange={e => setPreventivoNotes(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-xl mb-4">
                <p className="text-orange-400 text-sm">Hai indicato una data nel <strong>PASSATO</strong>. Scegli qual è lo stato attuale di questa trattativa o il prossimo passo da compiere.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => setOutcome("RICHIAMO_OPERATORE")} className={\`p-3 rounded-lg border-2 font-bold text-sm \${outcome === "RICHIAMO_OPERATORE" ? "border-blue-500 bg-blue-600/20 text-blue-400" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"}\`}>
                  Richiamo Operatore
                </button>
                <button onClick={() => setOutcome("RICHIAMO_COMMERCIALE")} className={\`p-3 rounded-lg border-2 font-bold text-sm \${outcome === "RICHIAMO_COMMERCIALE" ? "border-yellow-500 bg-yellow-600/20 text-yellow-400" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"}\`}>
                  Richiamo Commerciale
                </button>
                <button onClick={() => setOutcome("CONTRATTO_FIRMATO")} className={\`p-3 rounded-lg border-2 font-bold text-sm \${outcome === "CONTRATTO_FIRMATO" ? "border-green-500 bg-green-600/20 text-green-400" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"}\`}>
                  Contratto Firmato
                </button>
                <button onClick={() => setOutcome("KO_DEFINITIVO")} className={\`p-3 rounded-lg border-2 font-bold text-sm \${outcome === "KO_DEFINITIVO" ? "border-red-500 bg-red-600/20 text-red-400" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"}\`}>
                  KO Definitivo
                </button>
              </div>

              {(outcome === "RICHIAMO_OPERATORE" || outcome === "RICHIAMO_COMMERCIALE") && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Data Ricontatto</label>
                    <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Ora Ricontatto</label>
                    <input type="time" value={nextTime} onChange={e => setNextTime(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-bold text-gray-400 mb-1">
                  {outcome === "KO_DEFINITIVO" ? "Motivazione KO" : "Note Aggiuntive"}
                </label>
                <textarea value={outcomeNotes} onChange={e => setOutcomeNotes(e.target.value)} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white resize-none" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-950 border-t border-gray-800 flex justify-between rounded-b-2xl">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : onClose()} 
            className="px-6 py-2 text-gray-400 hover:text-white font-bold"
          >
            {step === 1 ? "Annulla" : "Indietro"}
          </button>
          
          <button 
            onClick={handleNext} 
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition flex items-center shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {loading ? "Salvataggio..." : (step === 3 && !isEventPast()) || step === 4 ? (
              <><Save className="w-4 h-4 mr-2" /> Salva e Crea</>
            ) : (
              <>Avanti <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
