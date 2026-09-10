import re

with open('src/components/WizardCreaTrattativa.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
content = content.replace(
    'import { X, Calendar, Clock, Handshake, User, Briefcase, FileText, Save, CheckCircle } from "lucide-react";',
    'import { X, Calendar, Clock, Handshake, User, Briefcase, FileText, Save, CheckCircle, PhoneCall } from "lucide-react";\nimport AppointmentModal from "./AppointmentModal";'
)

# Add states
content = content.replace(
    '  const [saving, setSaving] = useState(false);',
    '''  const [saving, setSaving] = useState(false);
  const [inCorsoAction, setInCorsoAction] = useState<"RICHIAMO" | "APPUNTAMENTO">("RICHIAMO");
  const [createdTrattativaId, setCreatedTrattativaId] = useState<string | null>(null);
  const [showApptModal, setShowApptModal] = useState(false);'''
)

# Edit handleNext
handle_next = '''  const handleNext = () => {
    if (!operatorId) {
      toast.error("Seleziona un operatore");
      return;
    }
    setStep(2);
  };'''
content = content.replace(handle_next, handle_next)

# Edit submit to support actionMode
old_submit = '''      const res = await fetch("/api/tl/wizard-trattativa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          flow,
          operatorId,
          commercialeId,
          notes,
          appuntamentoSvolto,
          nextActionTo,
          nextActionDate: nextActionDate,
          nextActionTime: nextActionTime,
          nextActionIso: nextActionIso.toISOString(),
          preventivoFile,
          contrattoFile
        })
      });'''

new_submit = '''      const actionMode = (flow === "IN_CORSO" && inCorsoAction === "APPUNTAMENTO") ? "APPUNTAMENTO_PENDING" : "RICHIAMO";
      
      const res = await fetch("/api/tl/wizard-trattativa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          flow,
          operatorId,
          commercialeId,
          notes,
          appuntamentoSvolto,
          nextActionTo,
          nextActionDate: nextActionDate,
          nextActionTime: nextActionTime,
          nextActionIso: nextActionIso ? nextActionIso.toISOString() : null,
          preventivoFile,
          contrattoFile,
          actionMode
        })
      });'''
content = content.replace(old_submit, new_submit)

# Handle success for APPUNTAMENTO
old_success = '''      if (data.success) {
        toast.success("Trattativa creata con successo!");
        onSuccess();
      } else {'''

new_success = '''      if (data.success) {
        if (actionMode === "APPUNTAMENTO_PENDING") {
           setCreatedTrattativaId(data.trattativa.id);
           setShowApptModal(true);
        } else {
           toast.success("Trattativa creata con successo!");
           onSuccess();
        }
      } else {'''
content = content.replace(old_success, new_success)

# UI step 2
old_step2 = '''          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="font-bold text-white text-lg flex items-center border-b border-gray-800 pb-2">
                <Calendar className="w-5 h-5 mr-2 text-blue-400" /> Pianifica Prossima Azione
              </h3>

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
            </div>
          )}'''

new_step2 = '''          {step === 2 && (
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
          )}'''
content = content.replace(old_step2, new_step2)

# Edit Button logic
old_btn = '''            <button onClick={submit} disabled={saving} className="flex items-center px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
              {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Save className="w-4 h-4 mr-2" />}
              {flow === "IN_CORSO" ? "Salva e Crea Trattativa" : "Salva e Archivia"}
            </button>'''

new_btn = '''            <button onClick={submit} disabled={saving} className="flex items-center px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
              {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Save className="w-4 h-4 mr-2" />}
              {flow === "IN_CORSO" ? (inCorsoAction === "APPUNTAMENTO" ? "Procedi all'Agenda" : "Salva e Crea Trattativa") : "Salva e Archivia"}
            </button>'''
content = content.replace(old_btn, new_btn)

# Add AppointmentModal to the very bottom
modal = '''  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">'''

new_modal = '''  if (showApptModal) {
    return (
      <AppointmentModal
        contactId={contact.id}
        cap={contact.cap || ""}
        initialReferentName=""
        initialPhone={contact.originalPhone || ""}
        initialEmail={contact.email || ""}
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">'''
content = content.replace(modal, new_modal)

with open('src/components/WizardCreaTrattativa.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
