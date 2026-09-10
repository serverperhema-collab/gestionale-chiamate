"use client";

import { useState, useEffect, useRef } from "react";
import { X, Calendar, Clock, Handshake, User, Briefcase, FileText, Save, CheckCircle, PhoneCall, ThumbsDown } from "lucide-react";
import toast from "react-hot-toast";
import AppointmentModal from "./AppointmentModal";

interface WizardCreaTrattativaProps {
  contact?: any;
  contactId: string;
  contactName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WizardCreaTrattativa({ contactId, contactName, onClose, onSuccess }: WizardCreaTrattativaProps) {
  const [step, setStep] = useState(0); // 0 = Scelta Flusso, 1 = Dati Base, 2 = Pianificazione (se In Corso)
  const [saving, setSaving] = useState(false);
  
  const [operators, setOperators] = useState<any[]>([]);
  const [commerciali, setCommerciali] = useState<any[]>([]);
  
  const [flow, setFlow] = useState<"IN_CORSO" | "FIRMATO" | "KO" | null>(null);

  // Form State
  const [operatorId, setOperatorId] = useState("");
  const [commercialeId, setCommercialeId] = useState("");
  const [notes, setNotes] = useState("");
  const [appuntamentoSvolto, setAppuntamentoSvolto] = useState(false);
  
  // File State
  const [preventivoFile, setPreventivoFile] = useState<{name: string, type: string, data: string} | null>(null);
  const [contrattoFile, setContrattoFile] = useState<{name: string, type: string, data: string} | null>(null);

  // Planning State (Only IN_CORSO)
  const [nextActionTo, setNextActionTo] = useState<"OPERATORE" | "COMMERCIALE">("OPERATORE");
  const [nextActionDate, setNextActionDate] = useState("");
  const [nextActionTime, setNextActionTime] = useState("");
  
  const [inCorsoAction, setInCorsoAction] = useState<"RICHIAMO" | "APPUNTAMENTO">("RICHIAMO");
  const [createdTrattativaId, setCreatedTrattativaId] = useState<string | null>(null);
  const [showApptModal, setShowApptModal] = useState(false);

  useEffect(() => {
    // Per caricamento file
    Promise.all([
      fetch("/api/users?role=OPERATORE").then(res => res.json()),
      fetch("/api/users?role=COMMERCIALE").then(res => res.json())
    ]).then(([ops, comms]) => {
      if (ops.users) setOperators(ops.users);
      if (comms.users) setCommerciali(comms.users);
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check size limit (e.g., 4MB to avoid Vercel edge/body limits)
    if (file.size > 4 * 1024 * 1024) {
      toast.error("File troppo grande. Massimo 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setter({
        name: file.name,
        type: file.type,
        data: base64String
      });
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (!operatorId) return toast.error("Seleziona un operatore.");
    if (flow === "IN_CORSO") {
      setStep(2);
    } else {
      submit(); // KO or FIRMATO finish directly at step 1
    }
  };

  const submit = async () => {
    if (!operatorId) return toast.error("Seleziona un operatore.");
    if (flow === "FIRMATO" && !contrattoFile) {
        // Avviso ma non bloccante, o bloccante? L'utente dice "ALLEGARE SIA PREVENTIVO CHE CONTRATTO",
        // Ma facciamolo facoltativo nel backend, e bloccante lato frontend per forzarlo, 
        return toast.error("Devi allegare il file del Contratto Firmato.");
    }
    if (flow === "IN_CORSO") {
      if (inCorsoAction === "RICHIAMO") {
        if (!nextActionDate || !nextActionTime) return toast.error("Inserisci Data e Ora di richiamo.");
        if (nextActionTo === "COMMERCIALE" && !commercialeId) return toast.error("Seleziona un Commerciale per assegnargli il richiamo.");
      }
    }

    try {
      setSaving(true);
      
      const actionMode = (flow === "IN_CORSO" && inCorsoAction === "APPUNTAMENTO") ? "APPUNTAMENTO_PENDING" : "RICHIAMO";

      const res = await fetch("/api/tl/wizard-trattativa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact?.id || contactId,
          flow,
          operatorId,
          commercialeId,
          notes,
          appuntamentoSvolto,
          nextActionTo,
          nextActionDate: nextActionDate,
          nextActionTime: nextActionTime,
          nextActionIso: (nextActionDate && nextActionTime) ? new Date(nextActionDate + 'T' + nextActionTime + ':00').toISOString() : null,
          preventivoFile,
          contrattoFile,
          actionMode
        })
      });

      const data = await res.json();
      if (data.success) {
        if (actionMode === "APPUNTAMENTO_PENDING") {
           setCreatedTrattativaId(data.trattativa.id);
           setShowApptModal(true);
        } else {
           toast.success("Trattativa creata con successo!");
           onSuccess();
        }
      } else {
        toast.error(data.error || "Errore sconosciuto");
      }
    } catch (err: any) {
      toast.error("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  if (showApptModal) {
    return (
      <AppointmentModal
        contactId={contact?.id || contactId}
        cap={contact?.cap || ""}
        initialReferentName=""
        initialPhone={contact?.originalPhone || ""}
        initialEmail={contact?.email || ""}
        onClose={() => {
          setShowApptModal(false);
          onSuccess(); // Chiusura senza fissare appuntamento, ma Trattativa creata. Aggiorna.
        }}
        onSuccess={() => {
          toast.success("Appuntamento fissato!");
          setShowApptModal(false);
          onSuccess();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-xl flex flex-col">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/30 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              Wizard Trattativa
            </h2>
            <p className="text-sm text-gray-400">Cliente: <span className="font-semibold text-emerald-400">{contactName}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 bg-gray-800 rounded hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* STEP 0: SCELTA FLUSSO */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">Che tipo di trattativa stai inserendo?</h3>
              
              <button onClick={() => { setFlow("IN_CORSO"); setStep(1); }} className="w-full flex items-center p-4 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-blue-500 transition-all text-left group">
                <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Handshake className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Trattativa in Corso</h4>
                  <p className="text-sm text-gray-400">Pianifica un richiamo o un appuntamento futuro.</p>
                </div>
              </button>
              
              <button onClick={() => { setFlow("FIRMATO"); setStep(1); }} className="w-full flex items-center p-4 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-emerald-500 transition-all text-left group">
                <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Contratto Firmato (Storico)</h4>
                  <p className="text-sm text-gray-400">Archivia un contratto già vinto e blocca il contatto.</p>
                </div>
              </button>

              <button onClick={() => { setFlow("KO"); setStep(1); }} className="w-full flex items-center p-4 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-red-500 transition-all text-left group">
                <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <ThumbsDown className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Contatto KO (Storico)</h4>
                  <p className="text-sm text-gray-400">Archivia un esito negativo e cestina il contatto.</p>
                </div>
              </button>
            </div>
          )}

          {/* STEP 1: DATI BASE */}
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-4">
              <div className="flex items-center space-x-2 text-blue-400 mb-2">
                {flow === "IN_CORSO" && <Handshake className="w-5 h-5" />}
                {flow === "FIRMATO" && <FileText className="w-5 h-5 text-emerald-400" />}
                {flow === "KO" && <ThumbsDown className="w-5 h-5 text-red-400" />}
                <h3 className="font-bold text-white">
                  {flow === "IN_CORSO" ? "Dati Trattativa in Corso" : flow === "FIRMATO" ? "Inserimento Contratto Firmato" : "Inserimento Esito KO"}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-400 flex items-center"><User className="w-4 h-4 mr-1"/> Operatore *</label>
                  <select value={operatorId} onChange={e => setOperatorId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500">
                    <option value="">Seleziona...</option>
                    {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-400 flex items-center"><Briefcase className="w-4 h-4 mr-1"/> Commerciale (Opz.)</label>
                  <select value={commercialeId} onChange={e => setCommercialeId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500">
                    <option value="">Nessuno...</option>
                    {commerciali.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 flex items-center"><FileText className="w-4 h-4 mr-1"/> Nota TL (Contesto)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Scrivi qui eventuali dettagli..." className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 resize-none h-20" />
              </div>

              {(flow === "IN_CORSO" || flow === "KO") && (
                <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                  <span className="text-sm font-semibold text-gray-300">È stato svolto un appuntamento?</span>
                  <div className="flex items-center space-x-3">
                    <button onClick={() => setAppuntamentoSvolto(true)} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${appuntamentoSvolto ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400'}`}>SÌ</button>
                    <button onClick={() => setAppuntamentoSvolto(false)} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${!appuntamentoSvolto ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'}`}>NO</button>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <h4 className="text-xs uppercase font-bold text-gray-500">File e Documenti</h4>
                
                {/* PREVENTIVO */}
                <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-white">Preventivo (Opzionale)</p>
                      <p className="text-xs text-gray-500">{preventivoFile ? preventivoFile.name : 'Nessun file selezionato'}</p>
                    </div>
                  </div>
                  <label className="cursor-pointer px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded transition">
                    Carica
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, setPreventivoFile)} />
                  </label>
                </div>

                {/* CONTRATTO (Solo se FIRMATO) */}
                {flow === "FIRMATO" && (
                  <div className="flex items-center justify-between bg-emerald-900/10 p-3 rounded-lg border border-emerald-900/30">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-emerald-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-white">Contratto Firmato *</p>
                        <p className="text-xs text-emerald-500/70">{contrattoFile ? contrattoFile.name : 'Richiesto'}</p>
                      </div>
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded transition">
                      Carica
                      <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, setContrattoFile)} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PIANIFICAZIONE (Solo IN_CORSO) */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="font-bold text-white text-lg flex items-center border-b border-gray-800 pb-2">
                <Calendar className="w-5 h-5 mr-2 text-blue-400" /> Pianifica Prossima Azione
              </h3>

              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-gray-800">
                <button onClick={() => setInCorsoAction("RICHIAMO")} className={`py-4 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center justify-center ${inCorsoAction === "RICHIAMO" ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'}`}>
                  <PhoneCall className="w-6 h-6 mb-2" />
                  PIANIFICA RICHIAMO
                </button>
                <button onClick={() => setInCorsoAction("APPUNTAMENTO")} className={`py-4 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center justify-center ${inCorsoAction === "APPUNTAMENTO" ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'}`}>
                  <Calendar className="w-6 h-6 mb-2" />
                  FISSA APPUNTAMENTO
                </button>
              </div>

              {inCorsoAction === "RICHIAMO" && (
                <>
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-400">A chi tocca il prossimo passo?</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setNextActionTo("OPERATORE")} className={`py-3 rounded-lg border-2 text-sm font-bold transition-all ${nextActionTo === "OPERATORE" ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'}`}>
                        OPERATORE
                      </button>
                      <button onClick={() => setNextActionTo("COMMERCIALE")} className={`py-3 rounded-lg border-2 text-sm font-bold transition-all ${nextActionTo === "COMMERCIALE" ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'}`}>
                        COMMERCIALE
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-400 flex items-center"><Calendar className="w-4 h-4 mr-1"/> Data Richiamo</label>
                      <input type="date" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 [color-scheme:dark]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-400 flex items-center"><Clock className="w-4 h-4 mr-1"/> Ora Richiamo</label>
                      <input type="time" value={nextActionTime} onChange={e => setNextActionTime(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 [color-scheme:dark]" />
                    </div>
                  </div>
                </>
              )}

              {inCorsoAction === "APPUNTAMENTO" && (
                <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg flex items-start text-purple-300 text-sm">
                  <Calendar className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                  <p>Salva per aprire l'Agenda e selezionare uno slot. La trattativa verr&agrave; assegnata all'operatore e al commerciale selezionati al passo precedente.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM NAV */}
        <div className="p-4 border-t border-gray-800 flex justify-between bg-gray-800/30 rounded-b-xl">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} disabled={saving} className="px-4 py-2 bg-gray-800 text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700">
              Indietro
            </button>
          ) : <div></div>}
          
          {step === 1 && flow === "IN_CORSO" ? (
            <button onClick={handleNext} className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors">
              Avanti <Handshake className="w-4 h-4 ml-2" />
            </button>
          ) : step > 0 ? (
            <button onClick={submit} disabled={saving} className="flex items-center px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
              {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Save className="w-4 h-4 mr-2" />}
              {flow === "IN_CORSO" ? (inCorsoAction === "APPUNTAMENTO" ? "Procedi all'Agenda" : "Salva e Crea Trattativa") : "Salva e Archivia"}
            </button>
          ) : <div></div>}
        </div>
      </div>
    </div>
  );
}
