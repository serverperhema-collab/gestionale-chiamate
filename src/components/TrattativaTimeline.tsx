"use client";

import { useState, useEffect, useRef } from "react";
import { X, Clock, FileText, User, RefreshCw, CheckCircle, AlertTriangle, PhoneCall, Edit2, Check, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import AppointmentModal from "./AppointmentModal";

interface TrattativaTimelineProps {
  trattativaId: string;
  onClose: () => void;
}

export default function TrattativaTimeline({ trattativaId, onClose }: TrattativaTimelineProps) {
  const [trattativa, setTrattativa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Call mode
  const [isCalling, setIsCalling] = useState(false);
  const [koModalOpen, setKoModalOpen] = useState(false);
  const [koNotes, setKoNotes] = useState("");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // Editable fields
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Call interface hooks
  const [callPhase, setCallPhase] = useState<'idle' | 'non-risponde' | 'ha-risposto'>('idle');
  const [subOption, setSubOption] = useState<'riprova' | 'ko-non-risponde' | 'posticipa' | 'commerciale' | 'ko-risposto' | null>(null);
  
  const [callForm, setCallForm] = useState({ date: '', time: '', note: '', commercialeId: '' });
  const [commerciali, setCommerciali] = useState<any[]>([]);

  useEffect(() => {
    if (isCalling) {
      fetch('/api/commerciali').then(res => res.json()).then(data => setCommerciali(data.commerciali || []));
      setCallPhase('idle');
      setSubOption(null);
      setCallForm({ date: '', time: '', note: '', commercialeId: trattativa?.currentCommercialeId || '' });
    }
  }, [isCalling, trattativa]);


  const fetchST = async () => {
      try {
        const res = await fetch(`/api/trattative/${trattativaId}`);
        if (res.ok) {
          const data = await res.json();
          setTrattativa(data);
          setEditValues({
            referentName: data.contact?.referentName || "",
            originalPhone: data.contact?.originalPhone || "",
            address: data.contact?.address || "",
            sector: data.contact?.sector || "",
            notes: data.contact?.notes || "",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchST();
  }, [trattativaId]);

  const handleSaveField = async (field: string) => {
    if (!trattativa?.contact?.id) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/contacts/${trattativa.contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: editValues[field] }),
      });
      if (res.ok) {
        toast.success("Campo aggiornato");
        setEditingField(null);
        setTrattativa({
          ...trattativa,
          contact: { ...trattativa.contact, [field]: editValues[field] }
        });
      } else {
        const err = await res.json();
        toast.error(err.error || "Errore aggiornamento");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin relative z-10" />
      </div>
    );
  }

  if (!trattativa) return null;

  const contact = trattativa.contact || {};

  // --- INTERFACCIA CHIAMATA ---

  const handleActionSubmit = async () => {
    if (subOption !== 'ko-non-risponde' && subOption !== 'ko-risposto') {
      if (!callForm.date || !callForm.time || !callForm.note) {
        toast.error("Compila data, ora e nota");
        return;
      }
    } else {
      if (!callForm.note) {
        toast.error("Scrivi una motivazione per il KO");
        return;
      }
    }

    setLoading(true);
    try {
      if (subOption === 'riprova') {
        const payload = {
          action: "missed-call",
          payload: { recallDate: `${callForm.date}T${callForm.time}:00Z`, notes: callForm.note }
        };
        const res = await fetch(`/api/trattative/${trattativaId}/actions`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Errore salvataggio riprova");
      } else if (subOption === 'posticipa') {
        const payload = {
          action: "postpone-recall",
          payload: { recallDate: `${callForm.date}T${callForm.time}:00Z`, notes: callForm.note }
        };
        const res = await fetch(`/api/trattative/${trattativaId}/actions`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Errore salvataggio posticipa");
      } else if (subOption === 'commerciale') {
        if (!callForm.commercialeId) {
          toast.error("Seleziona un commerciale");
          setLoading(false);
          return;
        }
        const payload = {
          action: "richiamo",
          payload: { recallDate: `${callForm.date}T${callForm.time}:00Z`, notes: callForm.note, commercialeId: callForm.commercialeId }
        };
        const res = await fetch(`/api/trattative/${trattativaId}/actions`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Errore assegnazione commerciale");
      } else if (subOption === 'ko-non-risponde' || subOption === 'ko-risposto') {
        const res = await fetch(`/api/trattative/${trattativaId}/ko`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: callForm.note })
        });
        if (!res.ok) throw new Error("Errore KO");
      }
      
      toast.success("Esito registrato!");
      setIsCalling(false);
      fetchST();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (isCalling) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col p-4 sm:p-8 items-center justify-center">
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
        
        <div className="relative w-full max-w-5xl flex flex-col h-full text-white">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black text-gray-400">CHIAMATA IN CORSO...</h1>
            <button onClick={() => setIsCalling(false)} className="p-3 bg-red-600/20 text-red-500 rounded-full hover:bg-red-600 hover:text-white transition">
              <X className="w-8 h-8" />
            </button>
          </div>

          <div className="flex-1 bg-gray-900 border border-gray-700 rounded-3xl p-8 flex flex-col items-center justify-start text-center shadow-2xl overflow-y-auto">
            {trattativa.missedCallCount > 0 && (
              <div className="bg-yellow-600/20 text-yellow-500 font-bold px-6 py-2 rounded-full border border-yellow-500/50 mb-6 flex items-center shadow-lg">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {trattativa.missedCallCount} {trattativa.missedCallCount === 1 ? 'chiamata precedente senza esito' : 'chiamate precedenti senza esito'}
              </div>
            )}
            
            <h2 className="text-4xl font-black mb-4 uppercase text-blue-400">{contact.name}</h2>
            <div className="text-3xl font-mono tracking-widest text-white mb-6 bg-gray-800 px-8 py-3 rounded-xl border border-gray-600 inline-block shadow-inner">
              {contact.originalPhone || "Nessun numero"}
            </div>
            
            {callPhase === 'idle' && (
              <div className="w-full max-w-3xl mt-8 grid grid-cols-2 gap-6">
                <button 
                  onClick={() => setCallPhase('non-risponde')}
                  className="bg-orange-600 hover:bg-orange-500 p-8 rounded-2xl shadow-xl transition border border-orange-400 flex flex-col items-center justify-center group"
                >
                  <XCircle className="w-12 h-12 mb-4 text-orange-200 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-black">NON RISPONDE</span>
                  <span className="text-sm font-medium opacity-80 mt-2 text-orange-100">Occupato, non raggiungibile o stacca</span>
                </button>
                
                <button 
                  onClick={() => setCallPhase('ha-risposto')}
                  className="bg-green-600 hover:bg-green-500 p-8 rounded-2xl shadow-xl transition border border-green-400 flex flex-col items-center justify-center group"
                >
                  <PhoneCall className="w-12 h-12 mb-4 text-green-200 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-black">HA RISPOSTO</span>
                  <span className="text-sm font-medium opacity-80 mt-2 text-green-100">Contatto avvenuto con successo</span>
                </button>
              </div>
            )}

            {callPhase !== 'idle' && (
              <div className="w-full max-w-4xl mt-6">
                <div className="flex justify-start mb-6">
                  <button onClick={() => { setCallPhase('idle'); setSubOption(null); }} className="text-gray-400 hover:text-white flex items-center font-bold uppercase text-sm bg-gray-800 px-4 py-2 rounded-lg">
                    ← Indietro
                  </button>
                </div>
                
                {callPhase === 'non-risponde' && (
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button onClick={() => setSubOption('riprova')} className={`p-4 rounded-xl border-2 font-bold text-lg transition ${subOption === 'riprova' ? 'border-orange-500 bg-orange-600/20 text-orange-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'}`}>
                      Riprova più tardi
                    </button>
                    <button onClick={() => setSubOption('ko-non-risponde')} className={`p-4 rounded-xl border-2 font-bold text-lg transition ${subOption === 'ko-non-risponde' ? 'border-red-500 bg-red-600/20 text-red-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'}`}>
                      Metti KO (Non reperibile)
                    </button>
                  </div>
                )}

                {callPhase === 'ha-risposto' && (
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <button onClick={() => setSubOption('posticipa')} className={`p-4 rounded-xl border-2 font-bold text-sm uppercase transition ${subOption === 'posticipa' ? 'border-blue-500 bg-blue-600/20 text-blue-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'}`}>
                      Posticipa richiamo
                    </button>
                    <button onClick={() => { setIsCalling(false); setShowAppointmentModal(true); }} className="p-4 rounded-xl border-2 font-bold text-sm uppercase transition border-gray-700 bg-gray-800 text-gray-400 hover:border-purple-500 hover:text-purple-400">
                      Fissa Appuntamento
                    </button>
                    <button onClick={() => {
                        setSubOption('commerciale');
                        const now = new Date();
                        const ds = now.toLocaleDateString('it-IT');
                        const ts = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                        setCallForm({ ...callForm, note: `Il giorno ${ds} alle ore ${ts} il cliente chiede di essere ricontattato dal commerciale per maggiori informazioni.`, commercialeId: trattativa?.currentCommercialeId || '' });
                      }} 
                      className={`p-4 rounded-xl border-2 font-bold text-sm uppercase transition ${subOption === 'commerciale' ? 'border-yellow-500 bg-yellow-600/20 text-yellow-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'}`}>
                      Passa al Commerciale
                    </button>
                    <button onClick={() => setSubOption('ko-risposto')} className={`p-4 rounded-xl border-2 font-bold text-sm uppercase transition ${subOption === 'ko-risposto' ? 'border-red-500 bg-red-600/20 text-red-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'}`}>
                      Metti KO (Rifiuta)
                    </button>
                  </div>
                )}

                {subOption && (
                  <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-left relative shadow-2xl">
                    <h3 className="text-xl font-black mb-6 text-white uppercase border-b border-gray-700 pb-4">
                      {subOption === 'riprova' && "Dettagli prossimo tentativo"}
                      {subOption === 'ko-non-risponde' && "Conferma KO per Irreperibilità"}
                      {subOption === 'posticipa' && "Dettagli Posticipo Richiamo"}
                      {subOption === 'commerciale' && "Assegna Ricontatto al Commerciale"}
                      {subOption === 'ko-risposto' && "Conferma KO (Rifiuto)"}
                    </h3>
                    
                    <div className="space-y-6">
                      {(subOption === 'riprova' || subOption === 'posticipa' || subOption === 'commerciale') && (
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Data ricontatto</label>
                            <input type="date" value={callForm.date} onChange={e => setCallForm({...callForm, date: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ora ricontatto</label>
                            <input type="time" value={callForm.time} onChange={e => setCallForm({...callForm, time: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>
                      )}

                      {subOption === 'commerciale' && (
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Commerciale Assegnato</label>
                           <select value={callForm.commercialeId} onChange={e => setCallForm({...callForm, commercialeId: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500">
                             <option value="">-- Seleziona un commerciale --</option>
                             {commerciali.map((c: any) => (
                               <option key={c.id} value={c.id}>{c.name}</option>
                             ))}
                           </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Note {subOption.startsWith('ko') ? '(Motivazione KO)' : ''}
                        </label>
                        <textarea rows={4} value={callForm.note} onChange={e => setCallForm({...callForm, note: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Inserisci tutti i dettagli necessari..." />
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button onClick={handleActionSubmit} disabled={loading} className={`px-8 py-4 font-black uppercase tracking-wider text-white rounded-xl shadow-lg transition disabled:opacity-50 ${subOption.startsWith('ko') ? 'bg-red-600 hover:bg-red-500 shadow-red-900/50' : subOption === 'commerciale' ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/50' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/50'}`}>
                          {loading ? 'Salvataggio...' : 'Conferma e Salva'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      );
    }

  // --- INTERFACCIA TIMELINE ---// --- INTERFACCIA TIMELINE ---
  const EditableField = ({ label, field, value, isTextarea = false }: { label: string, field: string, value: string, isTextarea?: boolean }) => {
    const isEditing = editingField === field;
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    
    // Auto-resize textarea
    useEffect(() => {
      if (isEditing && isTextarea && textAreaRef.current) {
        textAreaRef.current.style.height = "auto";
        textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px";
      }
    }, [isEditing, editValues[field], isTextarea]);

    return (
      <div className="flex flex-col bg-gray-800/50 p-3 rounded-lg border border-gray-700/50 h-full">
        <span className="text-[10px] uppercase font-bold text-gray-500 mb-2">{label}</span>
        {isEditing ? (
          <div className="flex items-start">
            {isTextarea ? (
               <textarea 
                 ref={textAreaRef}
                 value={editValues[field]} 
                 onChange={e => setEditValues({ ...editValues, [field]: e.target.value })}
                 className="flex-1 bg-gray-900 border border-blue-500 rounded px-2 py-2 text-white text-sm focus:outline-none resize-none min-h-[60px]"
                 autoFocus
               />
            ) : (
               <input 
                 type="text" 
                 value={editValues[field]} 
                 onChange={e => setEditValues({ ...editValues, [field]: e.target.value })}
                 className="flex-1 bg-gray-900 border border-blue-500 rounded px-2 py-1 text-white text-sm focus:outline-none"
                 autoFocus
               />
            )}
            
            <div className="flex flex-col ml-2 space-y-1">
              <button onClick={() => handleSaveField(field)} disabled={savingEdit} className="p-1.5 bg-green-600 hover:bg-green-500 rounded text-white transition flex items-center justify-center">
                {savingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setEditingField(null)} className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white transition flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between group cursor-pointer flex-1" onClick={() => setEditingField(field)}>
            <span className="text-sm font-semibold text-gray-200 whitespace-pre-wrap break-words pr-2">
              {value || <span className="text-gray-600 italic">Clicca per aggiungere...</span>}
            </span>
            <Edit2 className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition shrink-0 mt-1" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full h-full max-w-6xl bg-gray-900 border border-gray-700 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
        
        {/* HEADER TOP */}
        <div className="flex items-center justify-between p-4 bg-gray-950 border-b border-gray-800 shrink-0">
          <div className="flex-1 flex justify-start">
            {trattativa.currentCommerciale && (
              <div className="bg-orange-600/20 border border-orange-500/30 px-3 py-1.5 rounded-lg flex items-center">
                <User className="w-3.5 h-3.5 text-orange-400 mr-2" />
                <span className="text-xs font-bold text-orange-300">Commerciale: {trattativa.currentCommerciale.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 flex justify-center">
             <h2 className="text-sm font-black text-gray-500 tracking-widest uppercase">Scheda Trattativa</h2>
          </div>

          <div className="flex-1 flex justify-end items-center gap-4">
             {trattativa.currentOperator && (
              <div className="bg-purple-600/20 border border-purple-500/30 px-3 py-1.5 rounded-lg flex items-center">
                <User className="w-3.5 h-3.5 text-purple-400 mr-2" />
                <span className="text-xs font-bold text-purple-300">Operatore: {trattativa.currentOperator.name}</span>
              </div>
             )}
             <button onClick={onClose} className="p-2 bg-gray-800 hover:bg-red-600 rounded-full text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* NOME ATTIVITA E CAMPI MODIFICABILI */}
        <div className="bg-gray-800 p-6 border-b border-gray-700 shrink-0 overflow-y-auto max-h-[50vh]">
          <h1 className="text-3xl md:text-4xl font-black text-white text-center uppercase tracking-tight mb-8">
            {contact.name}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            <EditableField label="Referente" field="referentName" value={trattativa.contact?.referentName} />
            <EditableField label="Telefono" field="originalPhone" value={trattativa.contact?.originalPhone} />
            <EditableField label="Indirizzo" field="address" value={trattativa.contact?.address} isTextarea={true} />
            <EditableField label="Settore" field="sector" value={trattativa.contact?.sector} isTextarea={true} />
            <div className="col-span-1 md:col-span-2 mt-2">
               <EditableField label="Informazioni Aggiuntive" field="notes" value={trattativa.contact?.notes} isTextarea={true} />
            </div>
          </div>
        </div>

        {/* TIMELINE EVENTI */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-900/50">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-8 border-b border-gray-800 pb-2">
              Eventi e Attività
            </h3>
            
            <div className="space-y-6">
              {trattativa.events && trattativa.events.length > 0 ? (
                [...trattativa.events].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((h: any, idx: number, arr: any[]) => {
                  const isLast = idx === arr.length - 1;
                  
                  // Nascondi il log grezzo "CREATA" se subito dopo c'è "Richiamo impostato"
                  if (h.eventType === "CREATA" && arr.length > 1 && arr[idx + 1]?.description === "Richiamo impostato") {
                    return null;
                  }

                  let actionTitle = h.eventType ? h.eventType.replace(/_/g, " ") : "EVENTO";
                  let actionDescription = h.metadata?.note || h.description || "Nessuna nota aggiuntiva.";
                  const creatorName = h.user?.name || "Sistema";
                  
                  if (actionTitle === "NOTA AGGIUNTA" && h.description === "Richiamo impostato") {
                     actionTitle = "TRATTATIVA CREATA";
                     const matchDate = actionDescription.match(/Data richiamo:\s*([^.]+)\./);
                     const matchNote = actionDescription.match(/Note:\s*(.*)/);
                     
                     const d = matchDate ? matchDate[1] : "";
                     const n = matchNote ? matchNote[1] : "";
                     
                     actionDescription = `Creata Trattativa da: ${creatorName} con richiamo il ${d} con nota: ${n}`;
                  }

                  return (
                    <div key={h.id} className="relative flex items-start">
                      {!isLast && <div className="absolute top-8 bottom-0 left-6 w-px bg-gray-700 -ml-px"></div>}
                      
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 border-2 border-blue-500 shrink-0 z-10">
                        <CheckCircle className="w-5 h-5 text-blue-400" />
                      </div>
                      
                      <div className="ml-6 flex-1 bg-gray-800/80 border border-gray-700 rounded-xl p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-white text-lg uppercase">{actionTitle}</h4>
                          <span className="text-xs font-mono text-gray-400 bg-gray-900 px-2 py-1 rounded">
                            {new Date(h.createdAt).toLocaleString("it-IT", { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 italic whitespace-pre-wrap leading-relaxed">
                          {actionDescription}
                        </p>
                        <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-end">
                          <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                            Operatore: {creatorName}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-10">
                  Nessun evento registrato
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TASTO CHIAMA IN BASSO */}
        <div className="p-6 bg-gray-950 border-t border-gray-800 shrink-0 flex justify-center">
          {trattativa.status === 'SOSPESA' ? (
            <div className="w-full max-w-md py-4 bg-gray-800 text-gray-500 rounded-2xl shadow-inner border border-gray-700 font-bold text-center flex items-center justify-center">
              BLOCCATA IN ATTESA DI REVISIONE
            </div>
          ) : (trattativa.currentCommercialeId && trattativa.nextActionType !== 'RICHIAMO') ? (
            <div className="w-full max-w-md py-4 bg-gray-800 text-gray-500 rounded-2xl shadow-inner border border-gray-700 font-bold text-center flex items-center justify-center">
              IN ATTESA DEL COMMERCIALE
            </div>
          ) : (
            <button 
              onClick={() => setIsCalling(true)}
              className="w-full max-w-md py-4 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white rounded-2xl shadow-lg shadow-green-900/50 transition font-black text-xl tracking-widest flex items-center justify-center"
            >
              <PhoneCall className="w-6 h-6 mr-3" /> CHIAMA
            </button>
          )}
        </div>

      </div>
    </div>
  );
}





