"use client";

import { useState, useEffect, useRef } from "react";
import { X, Clock, FileText, User, RefreshCw, CheckCircle, AlertTriangle, PhoneCall, Edit2, Check, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface TrattativaTimelineProps {
  trattativaId: string;
  onClose: () => void;
}

export default function TrattativaTimeline({ trattativaId, onClose }: TrattativaTimelineProps) {
  const [trattativa, setTrattativa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Call mode
  const [isCalling, setIsCalling] = useState(false);

  // Editable fields
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    async function fetchST() {
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
    }
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
  if (isCalling) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col p-4 sm:p-8 items-center justify-center">
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
        
        <div className="relative w-full max-w-5xl flex flex-col h-full text-white">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-gray-400">CHIAMATA IN CORSO...</h1>
            <button onClick={() => setIsCalling(false)} className="p-3 bg-red-600/20 text-red-500 rounded-full hover:bg-red-600 hover:text-white transition">
              <X className="w-8 h-8" />
            </button>
          </div>

          <div className="flex-1 bg-gray-900 border border-gray-700 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-2xl">
            <h2 className="text-5xl font-black mb-6 uppercase text-blue-400">{contact.name}</h2>
            <div className="text-3xl font-mono tracking-widest text-white mb-8 bg-gray-800 px-8 py-4 rounded-xl border border-gray-600">
              {contact.originalPhone || "Nessun numero"}
            </div>
            
            <div className="flex items-center space-x-6 text-gray-400 text-lg">
              <span><strong>Referente:</strong> {contact.referentName || "N/D"}</span>
              <span>&bull;</span>
              <span><strong>Settore:</strong> {contact.sector || "N/D"}</span>
            </div>
            
            <div className="mt-16 text-gray-500 text-xl font-bold uppercase animate-pulse">
              -- Tasti Operatore (IN ARRIVO) --
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- INTERFACCIA TIMELINE ---
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
              {trattativa.history && trattativa.history.length > 0 ? (
                [...trattativa.history].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((h: any, idx: number, arr: any[]) => {
                  const isLast = idx === arr.length - 1;
                  
                  // Custom rendering for the first event "RICHIAMO IMPOSTATO"
                  let actionTitle = h.actionType.replace(/_/g, " ");
                  if (actionTitle === "NOTA AGGIUNTA" && h.notes === "Richiamo impostato") {
                     actionTitle = "TRATTATIVA CREATA";
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
                          {h.details?.note || h.notes || "Nessuna nota aggiuntiva."}
                        </p>
                        <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-end">
                          <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                            Operatore: {h.operator?.name || h.commerciale?.name || "Sistema"}
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
          <button 
            onClick={() => setIsCalling(true)}
            className="w-full max-w-md py-4 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white rounded-2xl shadow-lg shadow-green-900/50 transition font-black text-xl tracking-widest flex items-center justify-center"
          >
            <PhoneCall className="w-6 h-6 mr-3" /> CHIAMA
          </button>
        </div>

      </div>
    </div>
  );
}
