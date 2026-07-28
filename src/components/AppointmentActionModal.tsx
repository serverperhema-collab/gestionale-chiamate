"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, CornerUpLeft, PhoneCall, Edit2, Save, MapPin, XCircle, Users, Phone, Printer } from "lucide-react";
import toast from "react-hot-toast";

interface AppointmentActionModalProps {
  appointment: any;
  commerciali: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AppointmentActionModal({ appointment, commerciali, onClose, onSuccess }: AppointmentActionModalProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(appointment.tlNotes || "");

  const [isEditing, setIsEditing] = useState(false);
  const [availableAgendas, setAvailableAgendas] = useState<any[]>([]);
  const [operatori, setOperatori] = useState<any[]>([]);
  
  // Action sub-menus (Modals)
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [selectedCancelType, setSelectedCancelType] = useState<string | null>(null);
  const [actionRecallDate, setActionRecallDate] = useState("");
  
  // Agenda closure state
  const [showAgendaClosure, setShowAgendaClosure] = useState(false);
  const [agendaClosureId, setAgendaClosureId] = useState<string | null>(null);
  const [closureCommercialeId, setClosureCommercialeId] = useState("");
  
  // Format date for datetime-local input
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = new Date(appointment.date);
  const localDatetime = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const [editData, setEditData] = useState({
    companyName: appointment.contact.name || "",
    address: appointment.contact.address || "",
    city: appointment.contact.city || "",
    province: appointment.contact.province || "",
    cap: appointment.contact.cap || "",
    referentName: appointment.referentName || "",
    referentRole: appointment.referentRole || "",
    phone: appointment.phone || "",
    email: appointment.email || "",
    clientNeeds: appointment.clientNeeds || "",
    date: localDatetime,
    zoneAgendaId: appointment.zoneAgendaId || "NONE",
    operatorId: appointment.operatorId || "",
    isPhoneAppt: appointment.isPhoneAppt || false
  });

  const [fullData, setFullData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/tl/calendar')
      .then(r => r.json())
      .then(d => {
        if (d.agendas) {
          setAvailableAgendas(d.agendas);
        }
      });
      
    fetch('/api/users')
      .then(r => r.json())
      .then(d => {
        if (d.users) {
          setOperatori(d.users.filter((u: any) => u.role === "OPERATORE" && u.isActive));
        }
      });
      
    fetch(`/api/tl/appointments/${appointment.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.appointment) {
          setFullData(d.appointment);
        }
      });
  }, [appointment.id]);

  const selectedDateStr = editData.date.split('T')[0];
  const agendasForDate = availableAgendas.filter(a => {
    const aDate = new Date(a.date);
    return `${aDate.getFullYear()}-${pad(aDate.getMonth()+1)}-${pad(aDate.getDate())}` === selectedDateStr;
  });

  const agendasForCap = availableAgendas.filter(a => a.caps.includes(editData.cap));

  const handleSelectSuggestedAgenda = (a: any) => {
    const currentDate = new Date(editData.date);
    const newDate = new Date(a.date);
    newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
    
    const localDatetime = `${newDate.getFullYear()}-${pad(newDate.getMonth()+1)}-${pad(newDate.getDate())}T${pad(newDate.getHours())}:${pad(newDate.getMinutes())}`;

    setEditData({
      ...editData,
      date: localDatetime,
      zoneAgendaId: a.id
    });
  };

  const handleAction = async (actionType: string) => {

    if (actionType === "RIMBALZA_COMMERCIALE" && !appointment.commercialeId) {
      toast.error("Devi assegnare un'Agenda prima di poter delegare l'appuntamento al Commerciale.");
      return;
    }

    if (actionType === "ANNULLA_RIMANDA_OPERATORE" && !actionRecallDate) {
      toast.error("Devi inserire la data/ora del richiamo.");
      return;
    }

    if (actionType.startsWith("ANNULLA_") && !notes.trim()) {
      toast.error("Le note/motivazione sono obbligatorie per l'annullamento.");
      return;
    }

    if (actionType === "RICHIAMA_TL" && !notes.trim()) {
      toast.error("Inserisci il titolo o il motivo nelle note per il tuo Task.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tl/appointments/${appointment.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          actionType, 
          commercialeId: appointment.commercialeId, 
          notes,
          recallDate: actionRecallDate ? new Date(actionRecallDate).toISOString() : null
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.allAgendaManaged && data.agendaId) {
          setAgendaClosureId(data.agendaId);
          setShowAgendaClosure(true);
        } else {
          toast.success("Azione completata");
          onSuccess();
        }
      } else {
        toast.error(data.error || "Errore");
      }
    } catch (e) {
      console.error(e);
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAgenda = async (closureAction: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tl/agendas/${agendaClosureId}/close`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: closureAction, 
          commercialeId: closureCommercialeId 
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Agenda aggiornata con successo");
        onSuccess();
      } else {
        toast.error(data.error || "Errore durante l'aggiornamento dell'agenda");
        setLoading(false);
      }
    } catch (e) {
      toast.error("Errore di rete");
      setLoading(false);
    }
  };

  const handleSaveEdits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tl/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editData,
          date: new Date(editData.date).toISOString()
        })
      });

      if (res.ok) {
        toast.success("Appuntamento aggiornato");
        setIsEditing(false);
        onSuccess(); // Refresh list to get updated data
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore durante il salvataggio");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  const allLogs = fullData?.contact ? [
    ...(fullData.contact.callLogs || []).map((l: any) => ({ ...l, type: 'CALL' })),
    ...(fullData.contact.activityLogs || []).map((l: any) => ({ ...l, type: 'ACTIVITY' }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  return (
    <>
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          .modal-print-container, .modal-print-container * {
            visibility: visible;
          }
          .modal-print-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .modal-print-container * {
            color: black !important;
            border-color: #ddd !important;
          }
          .modal-print-container .print\\:hidden, 
          .modal-print-container .print\\:hidden * {
            display: none !important;
          }
          /* Nascondi gli sfondi scuri */
          .modal-print-container .bg-gray-800,
          .modal-print-container .bg-gray-900 {
            background-color: transparent !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 modal-print-container">
        <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl border border-gray-700 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none">
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-700 bg-gray-900/50 rounded-t-xl print:bg-white print:border-b-2 print:border-gray-300">
            <h2 className="text-xl font-bold text-white flex items-center print:text-black">
              Gestione Appuntamento: 
              {isEditing ? (
                <input 
                  value={editData.companyName} 
                  onChange={e => setEditData({...editData, companyName: e.target.value})}
                  className="ml-2 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white focus:border-emerald-500 outline-none w-64"
                />
              ) : (
                <span className="text-blue-400 ml-2 print:text-black">
                  {appointment.contact.name}
                  {appointment.isPhoneAppt && <span className="ml-3 text-xs bg-purple-900/50 text-purple-300 border border-purple-500/50 px-2 py-1 rounded">📞 App. Telefonico</span>}
                </span>
              )}
              
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="ml-4 p-1.5 bg-gray-800 text-gray-400 hover:text-emerald-400 hover:bg-emerald-900/30 rounded transition print:hidden"
                  title="Modifica o Sposta"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition print:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto print:overflow-visible">
            
            {/* Sinistra & Centro: Dettagli Appuntamento */}
            <div className="space-y-4 md:col-span-2 print:col-span-3">
              
              <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4">
                
                {/* Top Row: Data, Agenda, Operatore */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-gray-800">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Data e Ora</p>
                    {isEditing ? (
                      <input 
                        type="datetime-local"
                        value={editData.date}
                        onChange={e => setEditData({...editData, date: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    ) : (
                      <p className="text-lg font-bold text-white flex items-center">
                        {new Date(appointment.date).toLocaleString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        {appointment.isDeroga && (
                          <span className="ml-3 bg-red-900/50 text-red-400 border border-red-700/50 text-xs px-2 py-0.5 rounded flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Deroga
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Agenda Assegnata</p>
                    {isEditing ? (
                      <>
                        <select
                          value={editData.zoneAgendaId}
                          onChange={e => setEditData({...editData, zoneAgendaId: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="NONE">Nessuna Agenda (Non Assegnato)</option>
                          {agendasForDate.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.caps.join(", ")})</option>
                          ))}
                        </select>
                        {agendasForCap.length > 0 && (
                          <div className="mt-3 bg-blue-900/20 border border-blue-500/30 p-2 rounded">
                            <p className="text-xs text-blue-300 mb-2 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" /> Agende attive per CAP {editData.cap}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {agendasForCap.map(a => (
                                <button
                                  key={a.id}
                                  onClick={() => handleSelectSuggestedAgenda(a)}
                                  className="text-xs bg-blue-600/30 hover:bg-blue-600/60 border border-blue-500/50 text-blue-200 px-2 py-1 rounded transition text-left"
                                >
                                  {new Date(a.date).toLocaleDateString()} - {a.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-medium text-blue-300 bg-blue-900/20 py-1 px-2 rounded inline-block">
                        {appointment.zoneAgenda?.name || "Non Assegnato ad Agenda"}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Preso da Operatore</p>
                    {isEditing ? (
                      <select
                        value={editData.operatorId}
                        onChange={e => setEditData({...editData, operatorId: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        {operatori.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-white font-medium">{appointment.operator?.name || "Operatore Sconosciuto"}</p>
                    )}
                  </div>
                </div>

                {/* Tipo Appuntamento (Solo in modifica) */}
                {isEditing && (
                  <div className="pb-4 border-b border-gray-800">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={editData.isPhoneAppt}
                        onChange={e => setEditData({...editData, isPhoneAppt: e.target.checked})}
                        className="w-4 h-4 text-emerald-500 rounded bg-gray-800 border-gray-600 focus:ring-emerald-500 focus:ring-offset-gray-900"
                      />
                      <span className="text-sm font-medium text-purple-300 flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        Appuntamento Telefonico
                      </span>
                    </label>
                  </div>
                )}

                {/* Resto dei Dati: Unico Corpo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Indirizzo (Via, Civico, Città)</p>
                    {isEditing ? (
                      <input value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white" />
                    ) : (
                      <p className="text-sm text-white">{fullData?.contact?.address || appointment.contact?.address || "-"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Telefono Principale</p>
                    {isEditing ? (
                      <input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    ) : (
                      <p className="text-sm text-white font-mono">{appointment.phone}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">CAP</p>
                    {isEditing ? (
                      <input value={editData.cap} onChange={e => setEditData({...editData, cap: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white" />
                    ) : (
                      <p className="text-sm text-white">{fullData?.contact?.cap || appointment.contact?.cap || "-"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    {isEditing ? (
                      <input value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    ) : (
                      <p className="text-sm text-white truncate">{appointment.email || "-"}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Referente</p>
                    {isEditing ? (
                      <input value={editData.referentName} onChange={e => setEditData({...editData, referentName: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    ) : (
                      <p className="text-sm text-white">{appointment.referentName}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ruolo</p>
                    {isEditing ? (
                      <input value={editData.referentRole} onChange={e => setEditData({...editData, referentRole: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    ) : (
                      <p className="text-sm text-white">{appointment.referentRole}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Settore / Categoria</p>
                    <p className="text-sm text-white">{fullData?.contact?.sector || appointment.contact?.sector || "-"}</p>
                  </div>
                  
                  {/* Altri Recapiti Telefonici */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Altri Recapiti Telefonici</p>
                    <div className="flex gap-2 flex-wrap">
                      {fullData?.contact?.phones?.filter((p: any) => p.phone && p.phone.toUpperCase() !== 'N/D' && p.phone.toUpperCase() !== 'N/A').length > 0 ? (
                        fullData.contact.phones.filter((p: any) => p.phone && p.phone.toUpperCase() !== 'N/D' && p.phone.toUpperCase() !== 'N/A').map((p: any) => (
                          <span key={p.id} className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2 py-1 rounded">
                            {p.phone} {p.label ? `(${p.label})` : ""}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-white">-</span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2 mt-2">
                    <p className="text-xs text-gray-500 mb-1">Esigenze / Note Cliente</p>
                    {isEditing ? (
                      <textarea 
                        value={editData.clientNeeds} 
                        onChange={e => setEditData({...editData, clientNeeds: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-y h-24"
                      />
                    ) : (
                      <p className="text-sm text-gray-300 italic p-3 bg-gray-800/50 rounded border border-gray-700/50">"{appointment.clientNeeds}"</p>
                    )}
                  </div>

                  {/* Sito Web - Mostra alla fine */}
                  <div className="col-span-1 sm:col-span-2 mt-2">
                    <p className="text-xs text-gray-500 mb-1">Sito Web / Link</p>
                    {isEditing ? (
                      <p className="text-sm text-gray-400">Modificabile solo dalla scheda cliente</p>
                    ) : (
                      <p className="text-sm text-blue-400 truncate">
                        {fullData?.contact?.website && fullData.contact.website.toUpperCase() !== 'N/D' && fullData.contact.website.toUpperCase() !== 'N/A' ? (
                          <a href={fullData.contact.website} target="_blank" rel="noreferrer">{fullData.contact.website}</a>
                        ) : (
                          <span className="text-white">-</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 mt-4">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                  >
                    Annulla
                  </button>
                  <button 
                    onClick={handleSaveEdits}
                    disabled={loading}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition font-medium flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salva Modifiche
                  </button>
                </div>
              )}
            </div>

            {/* Destra: Pulsantiera Workflow (Nascosta se isEditing o in Stampa) */}
            {!isEditing && (
              <div className="space-y-3 border-l border-gray-700 pl-8 print:hidden">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Azioni & Workflow</h3>

                {/* 1. Conferma o Stampa */}
                <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg mb-4">
                  <h4 className="text-blue-400 font-bold text-sm mb-2">Step Finale: Conferma</h4>
                  {appointment.status === "CONFIRMED" ? (
                    <>
                      <p className="text-xs text-blue-300 mb-3">
                        L'appuntamento è già stato confermato e validato.
                      </p>
                      <button
                        onClick={() => window.print()}
                        className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 rounded transition font-medium text-sm"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Stampa Scheda
                      </button>
                    </>
                  ) : appointment.zoneAgenda ? (
                    <>
                      <p className="text-xs text-blue-300 mb-3">
                        Agenda assegnata: <strong>{appointment.zoneAgenda.name}</strong>. Clicca il tasto qui sotto per validare e confermare definitivamente l'appuntamento.
                      </p>
                      <button
                        onClick={() => handleAction("CONFIRM")}
                        disabled={loading}
                        className="w-full flex items-center justify-center px-4 py-2.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 rounded transition disabled:opacity-50 font-medium text-sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Conferma
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-orange-300 mb-3 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                        Assegna un'Agenda prima di confermare.
                      </p>
                      <button
                        onClick={() => setActiveSubMenu("ASSIGN_AGENDA")}
                        disabled={loading}
                        className="w-full flex items-center justify-center px-4 py-2.5 bg-orange-600/20 text-orange-400 hover:bg-orange-600 hover:text-white border border-orange-500/30 rounded transition disabled:opacity-50 font-medium text-sm"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Assegna Agenda
                      </button>
                    </>
                  )}
                </div>

                {/* 2. Annullamento */}
                <button
                  onClick={() => setActiveSubMenu("CANCEL")}
                  disabled={loading}
                  className="w-full flex items-center justify-start px-4 py-2.5 bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-500/30 rounded transition disabled:opacity-50 font-medium text-sm"
                >
                  <XCircle className="w-4 h-4 mr-3" />
                  Annulla Appuntamento...
                </button>

                {/* 3. Gestione Diretta Commerciale */}
                <button
                  onClick={() => setActiveSubMenu("COMM_DIRECT")}
                  disabled={loading}
                  className="w-full flex items-center justify-start px-4 py-2.5 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/40 border border-yellow-500/30 rounded transition disabled:opacity-50 font-medium text-sm"
                >
                  <Users className="w-4 h-4 mr-3" />
                  Gestione Diretta Comm...
                </button>

                {/* 4. Richiamo TL */}
                <button
                  onClick={() => setActiveSubMenu("TL_CALLBACK")}
                  disabled={loading}
                  className="w-full flex items-center justify-start px-4 py-2.5 bg-purple-900/20 text-purple-400 hover:bg-purple-900/40 border border-purple-500/30 rounded transition disabled:opacity-50 font-medium text-sm"
                >
                  <PhoneCall className="w-4 h-4 mr-3" />
                  Richiama Team Leader...
                </button>

              </div>
            )}
          </div>
          <div className="hidden print:block mt-8 border-t border-gray-700 pt-6">
            <h3 className="text-lg font-bold text-white mb-4">Storico Contatto e Log</h3>
            {allLogs.length > 0 ? (
              <div className="space-y-3">
                {allLogs.map((log: any) => {
                  const rawNotes = log.notes || log.details || "";
                  let displayNotes = rawNotes.replace(/\s*\(Deroga:\s*(true|false)\)/ig, '');
                  
                  // Pulizia ID e traduzione note tecniche
                  displayNotes = displayNotes.replace(/sull'appuntamento\s[a-z0-9]+/ig, "");
                  displayNotes = displayNotes.replace(/Azione CONFIRM eseguita/g, "Appuntamento confermato definitivamente");
                  displayNotes = displayNotes.replace(/Azione RIMBALZA_COMMERCIALE eseguita/g, "Appuntamento passato in gestione al Commerciale");
                  displayNotes = displayNotes.replace(/Azione ANNULLA_RIMANDA_OPERATORE eseguita/g, "Appuntamento annullato, rimandato all'operatore");
                  displayNotes = displayNotes.replace(/Azione ANNULLA_CALDERONE eseguita/g, "Appuntamento annullato, contatto sbloccato");
                  displayNotes = displayNotes.replace(/Azione ANNULLA_BLOCCO_PERENNE eseguita/g, "Appuntamento annullato, contatto bloccato per sempre");
                  displayNotes = displayNotes.replace(/Contatto pescato dal calderone/g, "Contatto prelevato dal sistema e assegnato all'operatore");
                  
                  const actionKey = log.type === 'CALL' ? log.outcome : log.action;
                  const mapping: Record<string, string> = {
                    "NO_ANSWER": "Non Reperibile",
                    "NOT_AVAILABLE": "Richiamo Generico",
                    "NO_INFO": "Nessuna Info",
                    "NEGOTIATION": "Richiamo Personale",
                    "APPOINTMENT": "Appuntamento Fissato",
                    "TRASH_REQUEST": "Richiesta Eliminazione",
                    "SKIP": "Contatto Saltato",
                    "CONTACT_EXTRACTED": "Contatto Assegnato",
                    "TL_APPOINTMENT_ACTION": "Azione Team Leader",
                    "TL_CHANGED_OPERATOR": "Cambio Operatore",
                    "LOGIN": "Accesso di Sistema",
                    "SUSPENDED": "Sospensione",
                    "ADDED_PHONE": "Recapito Aggiunto"
                  };
                  const displayAction = mapping[actionKey] || actionKey.replace(/_/g, ' ');
                  
                  return (
                    <div key={log.id} className="bg-gray-800 p-3 rounded border border-gray-700 text-sm print:break-inside-avoid">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-blue-300">
                          {displayAction}
                        </span>
                        <span className="text-gray-400">{new Date(log.createdAt).toLocaleString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-gray-300">Operatore: {log.user?.name}</p>
                      {displayNotes && <p className="text-gray-400 mt-1 italic">"{displayNotes.trim()}"</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">Nessun log disponibile.</p>
            )}
          </div>
        </div>
      </div>

      {/* OVERLAY MODALS FOR SUB-ACTIONS */}
      {activeSubMenu && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
          
          {/* CANCEL MODAL */}
          {activeSubMenu === "CANCEL" && (
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-red-500/50 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-red-900/50 bg-red-900/20">
                <h3 className="text-lg font-bold text-red-400 flex items-center">
                  <XCircle className="w-5 h-5 mr-2" /> Opzioni Annullamento
                </h3>
                <button onClick={() => { setActiveSubMenu(null); setSelectedCancelType(null); }} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                {!selectedCancelType ? (
                  <>
                    <p className="text-sm text-gray-300 mb-4">Seleziona la destinazione finale di questo contatto annullato:</p>

                    <div className="space-y-3 mb-2">
                      <button onClick={() => setSelectedCancelType("ANNULLA_RIMANDA_OPERATORE")} className="w-full text-left p-3 bg-gray-900 hover:bg-gray-700 border border-gray-600 hover:border-blue-500 rounded-lg transition group">
                        <strong className="text-blue-400 block text-sm flex items-center"><CornerUpLeft className="w-4 h-4 mr-2" /> 1. Rimanda a Operatore</strong>
                        <span className="text-xs text-gray-400 mt-1 block group-hover:text-gray-300">Torna in lavorazione all'operatore per essere richiamato.</span>
                      </button>
                      <button onClick={() => setSelectedCancelType("ANNULLA_CALDERONE")} className="w-full text-left p-3 bg-gray-900 hover:bg-gray-700 border border-gray-600 hover:border-emerald-500 rounded-lg transition group">
                        <strong className="text-emerald-400 block text-sm flex items-center"><Users className="w-4 h-4 mr-2" /> 2. Rimetti nel Calderone</strong>
                        <span className="text-xs text-gray-400 mt-1 block group-hover:text-gray-300">Torna libero e chiamabile da chiunque nel calderone.</span>
                      </button>
                      <button onClick={() => setSelectedCancelType("ANNULLA_BLOCCO_PERENNE")} className="w-full text-left p-3 bg-gray-900 hover:bg-red-900/30 border border-gray-600 hover:border-red-500 rounded-lg transition group">
                        <strong className="text-red-500 block text-sm flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> 3. Blocco Perenne (Blacklist)</strong>
                        <span className="text-xs text-gray-400 mt-1 block group-hover:text-gray-300">Congelato per sempre, numero errato o cliente furioso.</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-300 mb-4 font-medium border-b border-gray-700 pb-2 flex items-center justify-between">
                      <span>
                        Hai scelto: <strong className="text-white">
                          {selectedCancelType === "ANNULLA_RIMANDA_OPERATORE" && "1. Rimanda a Operatore"}
                          {selectedCancelType === "ANNULLA_CALDERONE" && "2. Rimetti nel Calderone"}
                          {selectedCancelType === "ANNULLA_BLOCCO_PERENNE" && "3. Blocco Perenne"}
                        </strong>
                      </span>
                      <button onClick={() => setSelectedCancelType(null)} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300">Modifica</button>
                    </p>

                    <div className="space-y-4">
                      {selectedCancelType === "ANNULLA_RIMANDA_OPERATORE" && (
                        <div>
                          <label className="text-sm text-gray-300 font-medium block mb-1">Data/Ora Richiamo (Obbligatoria)</label>
                          <input 
                            type="datetime-local" 
                            value={actionRecallDate}
                            onChange={e => setActionRecallDate(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 focus:border-blue-500 rounded px-3 py-2 text-sm text-white outline-none transition" 
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-sm text-gray-300 font-medium block mb-1">Motivazione / Note (Obbligatoria)</label>
                        <textarea 
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 focus:border-red-500 rounded px-3 py-2 text-sm text-white h-20 resize-none outline-none transition"
                          placeholder="Specifica in dettaglio perché è stato annullato..."
                        />
                      </div>
                      <div className="flex space-x-3 pt-2">
                        <button onClick={() => setSelectedCancelType(null)} disabled={loading} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition w-1/3 font-bold">
                          Indietro
                        </button>
                        <button onClick={() => handleAction(selectedCancelType)} disabled={loading} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition shadow-lg shadow-red-900/20">
                          Conferma Annullamento
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* COMM DIRECT MODAL */}
          {activeSubMenu === "COMM_DIRECT" && (
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-yellow-500/50 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-yellow-900/50 bg-yellow-900/20">
                <h3 className="text-lg font-bold text-yellow-400 flex items-center">
                  <Users className="w-5 h-5 mr-2" /> Gestione Commerciale
                </h3>
                <button onClick={() => setActiveSubMenu(null)} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-300 mb-4">
                  L'appuntamento sarà messo in "Gestione Libera" nella dashboard del commerciale associato all'Agenda attualmente selezionata.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300 font-medium block mb-1">Note per il Commerciale</label>
                    <textarea 
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 focus:border-yellow-500 rounded px-3 py-2 text-sm text-white h-24 resize-none outline-none transition"
                      placeholder="Cosa deve fare il commerciale con questo contatto?..."
                    />
                  </div>
                  <button 
                    onClick={() => handleAction("RIMBALZA_COMMERCIALE")} 
                    disabled={loading} 
                    className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition"
                  >
                    Invia al Commerciale
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TL CALLBACK MODAL */}
          {activeSubMenu === "TL_CALLBACK" && (
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-purple-500/50 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-purple-900/50 bg-purple-900/20">
                <h3 className="text-lg font-bold text-purple-400 flex items-center">
                  <PhoneCall className="w-5 h-5 mr-2" /> Richiama Team Leader
                </h3>
                <button onClick={() => setActiveSubMenu(null)} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-300 mb-4">
                  Prendi in carico questo contatto. Verrà annullato l'appuntamento e finirà nella tua lista dei Task da gestire.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300 font-medium block mb-1">Data/Ora del Task (Opzionale)</label>
                    <input 
                      type="datetime-local" 
                      value={actionRecallDate}
                      onChange={e => setActionRecallDate(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 focus:border-purple-500 rounded px-3 py-2 text-sm text-white outline-none transition" 
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 font-medium block mb-1">Titolo / Motivo Task (Obbligatorio)</label>
                    <textarea 
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 focus:border-purple-500 rounded px-3 py-2 text-sm text-white h-24 resize-none outline-none transition"
                      placeholder="Scrivi qui cosa devi fare con questo cliente..."
                    />
                  </div>
                  <button 
                    onClick={() => handleAction("RICHIAMA_TL")} 
                    disabled={loading} 
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition"
                  >
                    Salva Task
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ASSIGN AGENDA MODAL */}
          {activeSubMenu === "ASSIGN_AGENDA" && (
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-orange-500/50 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-orange-900/50 bg-orange-900/20">
                <h3 className="text-lg font-bold text-orange-400 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" /> Assegna Agenda
                </h3>
                <button onClick={() => setActiveSubMenu(null)} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-300 mb-4">Seleziona a quale agenda assegnare l'appuntamento:</p>
                <div className="space-y-4">
                  <select
                    value={editData.zoneAgendaId}
                    onChange={e => setEditData({...editData, zoneAgendaId: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="NONE">Nessuna Agenda (Non Assegnato)</option>
                    {agendasForDate.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.caps.join(", ")})</option>
                    ))}
                  </select>
                  {agendasForCap.length > 0 && (
                    <div className="mt-3 bg-blue-900/20 border border-blue-500/30 p-2 rounded">
                      <p className="text-xs text-blue-300 mb-2 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> Agende attive per CAP {editData.cap}
                      </p>
                      <div className="space-y-1">
                        {agendasForCap.map(a => (
                          <button
                            key={a.id}
                            onClick={() => handleSelectSuggestedAgenda(a)}
                            className="block w-full text-left text-xs bg-blue-900/40 hover:bg-blue-600/50 text-blue-200 px-2 py-1 rounded transition"
                          >
                            {new Date(a.date).toLocaleDateString()} - {a.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleSaveEdits}
                    disabled={loading || editData.zoneAgendaId === "NONE"}
                    className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition font-medium flex justify-center items-center mt-6"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Salva Assegnazione
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
      {/* AGENDA CLOSURE OVERLAY */}
      {showAgendaClosure && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg border border-emerald-500/30">
            <h3 className="text-xl font-bold text-emerald-400 mb-4">Tutti gli appuntamenti gestiti</h3>
            <p className="text-gray-300 mb-6">
              Tutti gli appuntamenti di questa agenda sono stati smarcati. Vuoi chiudere l'agenda?
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleCloseAgenda("CLOSE_ASSIGN")}
                disabled={!closureCommercialeId || loading}
                className="w-full flex items-center justify-between p-3 bg-emerald-900/30 border border-emerald-500/50 rounded-lg hover:bg-emerald-800/50 transition disabled:opacity-50"
              >
                <div className="text-left">
                  <span className="block text-emerald-400 font-bold text-sm mb-1">Sì, e assegna a un Commerciale</span>
                </div>
              </button>
              
              <div className="px-1 pb-2">
                <select 
                  value={closureCommercialeId}
                  onChange={e => setClosureCommercialeId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 focus:border-emerald-500 outline-none"
                >
                  <option value="">-- Seleziona Commerciale --</option>
                  {commerciali?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => handleCloseAgenda("CLOSE_ONLY")}
                disabled={loading}
                className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-left"
              >
                <span className="block font-bold text-sm">Sì, ma non assegnare ancora</span>
              </button>

              <button 
                onClick={() => {
                  toast.success("Azione completata");
                  onSuccess();
                }}
                disabled={loading}
                className="w-full p-3 bg-gray-900 hover:bg-gray-800 text-gray-400 rounded-lg transition text-left"
              >
                <span className="block font-bold text-sm">No, lasciala aperta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
