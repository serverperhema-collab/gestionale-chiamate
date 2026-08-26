"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Calendar, Handshake, User, ArrowRight, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function TLReviewAlertModal({ alert, onClose }: { alert: any, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<string>("LEAVE_WITH_NOTE");
  const [note, setNote] = useState("");
  
  const [operators, setOperators] = useState<any[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [delayMins, setDelayMins] = useState("60");

  useEffect(() => {
    if (alert.lockType === "NEGOTIATION") {
      fetch("/api/users?role=OPERATORE")
        .then(r => r.json())
        .then(data => {
          if (data.users) setOperators(data.users.filter((u: any) => u.isActive));
        });
    }
  }, [alert.lockType]);

  const handleSubmit = async () => {
    setLoading(true);
    const payload: any = { actionType };

    if (actionType === "LEAVE_WITH_NOTE") {
      if (!note.trim()) { toast.error("Inserisci una nota"); setLoading(false); return; }
      payload.note = note;
    } else if (actionType === "REASSIGN_NEGOTIATION") {
      if (!selectedOperatorId) { toast.error("Seleziona operatore"); setLoading(false); return; }
      payload.newOperatorId = selectedOperatorId;
      payload.note = note;
    } else if (actionType === "RESCHEDULE_APP") {
      if (!newDate || !newTime) { toast.error("Seleziona data e ora"); setLoading(false); return; }
      payload.newDate = `${newDate}T${newTime}:00`;
      payload.note = note;
    } else if (actionType === "CANCEL_AND_CALDERONE") {
      if (!delayMins) { toast.error("Inserisci i minuti"); setLoading(false); return; }
      payload.delayMins = parseInt(delayMins, 10);
      payload.note = note;
    } else if (actionType === "DOWNGRADE_TO_RECALL") {
      payload.note = note;
    }

    try {
      const res = await fetch(`/api/contacts/${alert.contactId}/review-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success("Azione completata");
        onClose();
      } else {
        const d = await res.json();
        toast.error(d.error || "Errore");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  const isTrashRequest = alert.reviewNote?.includes("RICHIESTA ELIMINAZIONE");

  // Se è una richiesta di eliminazione, l'azione predefinita è BLACKLIST
  useEffect(() => {
    if (isTrashRequest) {
      setActionType("BLACKLIST");
    }
  }, [isTrashRequest]);

  const isApp = alert.lockType === "APPOINTMENT";
  const isNeg = alert.lockType === "NEGOTIATION";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className={`bg-gray-900 border ${isTrashRequest ? 'border-red-500/50' : 'border-purple-500/50'} rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]`}>
        <div className={`${isTrashRequest ? 'bg-red-950/40 border-red-900/50 text-red-400' : 'bg-purple-950/40 border-purple-900/50 text-purple-400'} border-b px-6 py-4 flex justify-between items-center shrink-0`}>
          <div className="flex items-center font-bold text-lg">
            <AlertTriangle className={`w-6 h-6 mr-3 ${isTrashRequest ? 'text-red-500' : 'text-purple-500'}`} />
            {isTrashRequest ? "RICHIESTA ELIMINAZIONE CONTATTO" : "RICHIESTA SBLOCCO CONTATTO"}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">{alert.contactName}</h3>
            <p className="text-gray-400 mt-1">
              {isTrashRequest 
                ? <>L'operatore <strong>{alert.requesterName}</strong> ha richiesto di cestinare questo contatto.</>
                : <>L'operatore <strong>{alert.requesterName}</strong> sta cercando di prenderlo, ma c'è un blocco:</>
              }
            </p>
            {!isTrashRequest && (
              <div className={`mt-3 p-3 rounded-lg border ${isApp ? 'bg-blue-900/20 border-blue-800' : 'bg-indigo-900/20 border-indigo-800'}`}>
                <div className="flex items-center font-semibold text-gray-200">
                  {isApp ? <Calendar className="w-5 h-5 mr-2 text-blue-400"/> : <Handshake className="w-5 h-5 mr-2 text-indigo-400"/>}
                  {alert.lockContext}
                </div>
              </div>
            )}
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
            <p className="text-sm font-semibold text-gray-400 uppercase mb-2">Nota operatore ({alert.requesterName}):</p>
            <p className="text-gray-200 italic">"{alert.reviewNote}"</p>
          </div>
          <h4 className="text-sm font-bold text-gray-300 uppercase mb-3">Scegli Azione:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {isTrashRequest ? (
              <>
                <label className={`cursor-pointer rounded-lg border p-3 flex items-center transition ${actionType === 'BLACKLIST' ? 'bg-red-600/20 border-red-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  <input type="radio" name="actionType" className="hidden" checked={actionType === 'BLACKLIST'} onChange={() => setActionType('BLACKLIST')} />
                  <div className="w-4 h-4 rounded-full border border-current mr-3 flex-shrink-0 flex items-center justify-center">
                    {actionType === 'BLACKLIST' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                  </div>
                  <span className="text-sm font-medium">Conferma Cestino (Blacklist)</span>
                </label>
                <label className={`cursor-pointer rounded-lg border p-3 flex items-center transition ${actionType === 'RESTORE' ? 'bg-emerald-600/20 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  <input type="radio" name="actionType" className="hidden" checked={actionType === 'RESTORE'} onChange={() => setActionType('RESTORE')} />
                  <div className="w-4 h-4 rounded-full border border-current mr-3 flex-shrink-0 flex items-center justify-center">
                    {actionType === 'RESTORE' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </div>
                  <span className="text-sm font-medium">Ignora e Ripristina nel Calderone</span>
                </label>
              </>
            ) : (
              <>
                <label className={`cursor-pointer rounded-lg border p-3 flex items-center transition ${actionType === 'LEAVE_WITH_NOTE' ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  <input type="radio" name="actionType" className="hidden" checked={actionType === 'LEAVE_WITH_NOTE'} onChange={() => setActionType('LEAVE_WITH_NOTE')} />
                  <div className="w-4 h-4 rounded-full border border-current mr-3 flex-shrink-0 flex items-center justify-center">
                    {actionType === 'LEAVE_WITH_NOTE' && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                  </div>
                  <span className="text-sm font-medium">Lascia al proprietario (Nota)</span>
                </label>
                {isApp && (
                  <>
                    <label className={`cursor-pointer rounded-lg border p-3 flex items-center transition ${actionType === 'RESCHEDULE_APP' ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                      <input type="radio" name="actionType" className="hidden" checked={actionType === 'RESCHEDULE_APP'} onChange={() => setActionType('RESCHEDULE_APP')} />
                      <div className="w-4 h-4 rounded-full border border-current mr-3 flex-shrink-0 flex items-center justify-center">
                        {actionType === 'RESCHEDULE_APP' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                      <span className="text-sm font-medium">Sposta Appuntamento</span>
                    </label>
                    <label className={`cursor-pointer rounded-lg border p-3 flex items-center transition ${actionType === 'DOWNGRADE_TO_RECALL' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                      <input type="radio" name="actionType" className="hidden" checked={actionType === 'DOWNGRADE_TO_RECALL'} onChange={() => setActionType('DOWNGRADE_TO_RECALL')} />
                      <div className="w-4 h-4 rounded-full border border-current mr-3 flex-shrink-0 flex items-center justify-center">
                        {actionType === 'DOWNGRADE_TO_RECALL' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                      </div>
                      <span className="text-sm font-medium">Annulla App &rarr; Manda in Richiamo</span>
                    </label>
                  </>
                )}
                {isNeg && (
                  <label className={`cursor-pointer rounded-lg border p-3 flex items-center transition ${actionType === 'REASSIGN_NEGOTIATION' ? 'bg-green-600/20 border-green-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                    <input type="radio" name="actionType" className="hidden" checked={actionType === 'REASSIGN_NEGOTIATION'} onChange={() => setActionType('REASSIGN_NEGOTIATION')} />
                    <div className="w-4 h-4 rounded-full border border-current mr-3 flex-shrink-0 flex items-center justify-center">
                      {actionType === 'REASSIGN_NEGOTIATION' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                    </div>
                    <span className="text-sm font-medium">Riassegna Trattativa</span>
                  </label>
                )}
                <label className={`cursor-pointer rounded-lg border p-3 flex items-center transition ${actionType === 'CANCEL_AND_CALDERONE' ? 'bg-red-600/20 border-red-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  <input type="radio" name="actionType" className="hidden" checked={actionType === 'CANCEL_AND_CALDERONE'} onChange={() => setActionType('CANCEL_AND_CALDERONE')} />
                  <div className="w-4 h-4 rounded-full border border-current mr-3 flex-shrink-0 flex items-center justify-center">
                    {actionType === 'CANCEL_AND_CALDERONE' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                  </div>
                  <span className="text-sm font-medium">Annulla {isApp ? "App" : "Trattativa"} &rarr; Calderone</span>
                </label>
              </>
            )}
          </div>
          {actionType === 'RESCHEDULE_APP' && (
            <div className="grid grid-cols-2 gap-4 mb-4 bg-blue-900/10 p-4 rounded-lg border border-blue-900/30">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nuova Data</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nuova Ora</label>
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" />
              </div>
            </div>
          )}
          {actionType === 'REASSIGN_NEGOTIATION' && (
            <div className="mb-4 bg-green-900/10 p-4 rounded-lg border border-green-900/30">
              <label className="block text-sm text-gray-400 mb-1">Seleziona Operatore</label>
              <select value={selectedOperatorId} onChange={e => setSelectedOperatorId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white">
                <option value="">-- Scegli Operatore --</option>
                {operators.map(op => (
                  <option key={op.id} value={op.id}>{op.name}</option>
                ))}
              </select>
            </div>
          )}
          {actionType === 'CANCEL_AND_CALDERONE' && (
            <div className="mb-4 bg-red-900/10 p-4 rounded-lg border border-red-900/30">
              <label className="block text-sm text-gray-400 mb-1">Tieni nascosto nel calderone per (minuti)</label>
              <input type="number" min="0" value={delayMins} onChange={e => setDelayMins(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" />
            </div>
          )}
          <div className="mb-2">
            <label className="block text-sm text-gray-400 mb-1">
              Nota da lasciare nel log del contatto {isTrashRequest ? "(Opzionale)" : "(Obbligatoria se 'Lascia al proprietario')"}
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={isTrashRequest ? "Es: Confermo, numero inesistente..." : "Es: Ho verificato, il cliente ha chiesto di essere richiamato stasera..."}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 h-20 resize-none"
            />
          </div>
        </div>
        <div className="bg-gray-800 border-t border-gray-700 p-4 px-6 flex justify-between items-center shrink-0">
          <button onClick={onClose} className="px-5 py-2 text-gray-400 hover:text-white transition font-medium" disabled={loading}>
            Ignora (Chiudi)
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50">
            {loading ? "Salvataggio..." : "Conferma Azione"} <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
