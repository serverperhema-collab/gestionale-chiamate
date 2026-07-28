"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, User, Clock, Plus, ChevronLeft, ChevronRight, MapPin, XCircle, ChevronDown, ChevronRight as ChevronRightIcon, AlertTriangle, Trash2, Edit2, Check, X, Lock, Unlock, MessageSquare, PhoneCall, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import AppointmentActionModal from "@/components/AppointmentActionModal";
import CreateAppointmentModalTL from "@/components/CreateAppointmentModalTL";
import Link from "next/link";

function AddAgendaModal({ date, onClose, onSuccess }: { date: Date, onClose: () => void, onSuccess: () => void }) {
  const [capsInput, setCapsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capsInput) {
      toast.error("Inserisci almeno un CAP");
      return;
    }

    const caps = capsInput.split(",").map(c => c.trim()).filter(c => c.length > 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(12, 0, 0, 0); 
    const dateStr = targetDate.toISOString().split("T")[0];

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tl/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, caps })
      });

      if (res.ok) {
        toast.success("Agenda aperta!");
        onSuccess();
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Nuova Agenda</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Inserisci i CAP abilitati per il {date.toLocaleDateString('it-IT')}. Il nome della zona verrà calcolato in automatico.
        </p>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Zone (CAP Abilitati)</label>
            <input
              type="text"
              autoFocus
              placeholder="es. 00100, 00101, 20123"
              value={capsInput}
              onChange={(e) => setCapsInput(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">Separati da virgola</p>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-gray-400 hover:text-white transition">
              Annulla
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition disabled:opacity-50">
              {isSubmitting ? "Apertura in corso..." : "Apri Agenda"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UnifiedCalendarPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [agendas, setAgendas] = useState<any[]>([]);
  const [commerciali, setCommerciali] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalAgendaPrefill, setCreateModalAgendaPrefill] = useState<any>(null);
  
  const [selectedDayModal, setSelectedDayModal] = useState<Date | null>(null);
  const [addAgendaDate, setAddAgendaDate] = useState<Date | null>(null);
  
  const [editingNotesAgenda, setEditingNotesAgenda] = useState<any>(null);
  const [agendaNotes, setAgendaNotes] = useState("");

  const handleToggleAgendaStatus = async (agenda: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const isPast = new Date(new Date(agenda.date).setHours(0,0,0,0)) < new Date(new Date().setHours(0,0,0,0));
    
    if (agenda.isClosed && isPast) {
      toast.error("Non puoi sbloccare un'agenda di un giorno passato");
      return;
    }
    
    const action = agenda.isClosed ? "REOPEN" : "CLOSE_ONLY";
    const confirmMsg = agenda.isClosed ? "Vuoi riaprire questa agenda?" : "Vuoi sospendere/chiudere questa agenda?";
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/tl/agendas/${agenda.id}/close`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        toast.success(agenda.isClosed ? "Agenda riaperta" : "Agenda sospesa");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (e) { toast.error("Errore"); }
  };

  const handleSaveAgendaNotes = async () => {
    if (!editingNotesAgenda) return;
    try {
      const res = await fetch(`/api/tl/agendas/${editingNotesAgenda.id}/close`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_NOTES", notes: agendaNotes })
      });
      if (res.ok) {
        toast.success("Note aggiornate");
        fetchData();
        setEditingNotesAgenda(null);
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (e) { toast.error("Errore"); }
  };
  const [expandedAgendaId, setExpandedAgendaId] = useState<string | null>(null);
  const [editingAgendaId, setEditingAgendaId] = useState<string | null>(null);
  const [editingAgendaName, setEditingAgendaName] = useState<string>("");
  const [editingCapsAgendaId, setEditingCapsAgendaId] = useState<string | null>(null);
  const [editingCapsInput, setEditingCapsInput] = useState<string>("");

  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    today.setDate(1); // Start from 1st of current month
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to first monday
    const firstMonday = new Date(today.setDate(diff));
    firstMonday.setHours(0, 0, 0, 0);
    return firstMonday;
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAgendas, resAppts, resUsers] = await Promise.all([
        fetch('/api/tl/calendar'),
        fetch('/api/tl/appointments'),
        fetch('/api/users')
      ]);

      if (resAgendas.ok) {
        const data = await resAgendas.json();
        setAgendas(data.agendas || []);
      }
      
      if (resAppts.ok) {
        const data = await resAppts.json();
        setAppointments(data.appointments || []);
      }
      
      if (resUsers.ok) {
        const data = await resUsers.json();
        setCommerciali((data.users || []).filter((u: any) => u.role === "COMMERCIALE" && u.isActive));
      }
    } catch (error) {
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const handleRenameAgenda = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/tl/calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newName })
      });
      if (res.ok) {
        toast.success("Nome aggiornato");
        setEditingAgendaId(null);
        fetchData();
      } else {
        toast.error("Errore durante l'aggiornamento");
      }
    } catch (error) {
      toast.error("Errore di connessione");
    }
  };

  const handleUpdateCaps = async (id: string, newCapsInput: string) => {
    const caps = newCapsInput.split(",").map(c => c.trim()).filter(c => c.length > 0);
    if (caps.length === 0) {
      toast.error("Devi inserire almeno un CAP");
      return;
    }
    try {
      const res = await fetch('/api/tl/calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, caps })
      });
      if (res.ok) {
        toast.success("CAP aggiornati");
        setEditingCapsAgendaId(null);
        fetchData();
      } else {
        toast.error("Errore durante l'aggiornamento dei CAP");
      }
    } catch (error) {
      toast.error("Errore di rete");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteAgenda = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Sei sicuro di voler eliminare questa agenda vuota?")) return;
    try {
      const res = await fetch(`/api/tl/calendar?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Agenda eliminata");
        fetchData();
      } else {
        toast.error("Errore eliminazione");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  const handleAssignCommercialeToAgenda = async (agendaId: string, commercialeId: string) => {
    try {
      const res = await fetch(`/api/tl/calendar/${agendaId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commercialeId: commercialeId || null })
      });
      if (res.ok) {
        toast.success("Commerciale assegnato all'agenda e agli appuntamenti");
        fetchData();
      } else {
        toast.error("Errore assegnazione commerciale");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  const getStatusBadge = (appt: any) => {
    if (appt.status === "CANCELLED") return <span className="bg-orange-900/50 text-orange-400 border border-orange-700/50 text-[10px] px-1.5 py-0.5 rounded">Annullato</span>;
    if (appt.isDeroga && !appt.isApproved) return <span className="bg-red-900/50 text-red-400 border border-red-700/50 text-[10px] px-1.5 py-0.5 rounded">Da Assegnare</span>;
    if (appt.status === "PENDING") return <span className="bg-yellow-900/50 text-yellow-400 border border-yellow-700/50 text-[10px] px-1.5 py-0.5 rounded">In Attesa</span>;
    if (appt.status === "CONFIRMED") return <span className="bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 text-[10px] px-1.5 py-0.5 rounded">Confermato</span>;
    if (appt.status === "DONE" || appt.status === "NOT_CONFIRMED") return <span className="bg-gray-800 text-gray-400 border border-gray-600 text-[10px] px-1.5 py-0.5 rounded">Passato</span>;
    return <span className="bg-gray-800 text-gray-400 border border-gray-600 text-[10px] px-1.5 py-0.5 rounded">{appt.status}</span>;
  };

  // Generate 5 weeks (Mon-Sun) to display a full month
  const weeks = [];
  let currentDate = new Date(startDate);
  for (let i = 0; i < 5; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      week.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
  }

  const handlePrevMonth = () => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() - 35);
    setStartDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + 35);
    setStartDate(newDate);
  };

  const isSameDate = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate();
  };

  // Determine current month name based on the middle of the displayed grid
  const midGridDate = new Date(startDate);
  midGridDate.setDate(midGridDate.getDate() + 17);
  const monthName = midGridDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="flex flex-col h-screen bg-gray-950 p-4">
      {/* Top Header */}
      <div className="mb-4 flex justify-between items-center bg-gray-900 p-3 rounded-xl border border-gray-800 shadow-lg">
        <div className="flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-purple-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Agende & Appuntamenti</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 font-semibold text-gray-200 min-w-[140px] text-center text-sm">
              {monthName}
            </span>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => {
              setCreateModalAgendaPrefill(null);
              setCreateModalOpen(true);
            }}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg font-medium transition shadow flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Inserisci App. Senza Agenda
          </button>
          
          <div className="w-px h-6 bg-gray-700 mx-2"></div>
          
          <Link href="/tl-dashboard" className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg font-medium transition border border-gray-700">
            Torna alla Dashboard
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 border-b border-gray-800 bg-gray-950/50">
            {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'].map((day, idx) => (
              <div key={day} className={`py-3 text-center text-xs font-bold uppercase tracking-wider border-r border-gray-800 last:border-r-0 ${idx >= 5 ? 'text-gray-600' : 'text-gray-400'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-gray-950">
            {weeks.flat().map((date, i) => {
              const isToday = isSameDate(date, new Date());
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isCurrentMonth = date.getMonth() === midGridDate.getMonth();
              
              // Find agendas for this day
              const dayAgendas = agendas.filter(a => isSameDate(new Date(a.date), date));
              
              // Find appointments for this day
              const dayAppointments = appointments.filter(a => isSameDate(new Date(a.date), date));
              
              const hasAgendas = dayAgendas.length > 0;
              const hasAppointments = dayAppointments.length > 0;

              return (
                <div 
                  key={i} 
                  onClick={() => !isWeekend && setSelectedDayModal(date)}
                  className={`border-r border-b border-gray-800/50 p-2 flex flex-col relative transition duration-200
                    ${i % 7 === 6 ? 'border-r-0' : ''} 
                    ${i >= 28 ? 'border-b-0' : ''}
                    ${isWeekend ? 'bg-gray-900/20 opacity-50 cursor-not-allowed' : 'hover:bg-gray-800/40 cursor-pointer'}
                    ${hasAgendas && !isWeekend ? 'ring-inset ring-2 ring-emerald-500/50 bg-emerald-950/10' : ''}
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-purple-600 text-white' : !isCurrentMonth ? 'text-gray-600' : 'text-gray-300'}`}>
                      {date.getDate()}
                    </span>
                    {date.getDate() === 1 && (
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pt-1 pr-1">
                        {date.toLocaleDateString('it-IT', { month: 'short' })}
                      </span>
                    )}
                  </div>

                  {!isWeekend && (
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden pointer-events-none">
                      {hasAgendas && (
                        <span 
                          className="text-[10px] font-medium text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded border border-emerald-800/50 block truncate max-w-full"
                          title={dayAgendas.map(a => a.name).join(', ')}
                        >
                          {dayAgendas.map(a => a.name).join(', ')}
                        </span>
                      )}
                      {hasAppointments && (
                        <span className="text-[10px] font-medium text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-800/50 w-fit">
                          {dayAppointments.length} Appt.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fullscreen Day Detail Modal */}
      {selectedDayModal && (() => {
        // Sort agendas by createdAt so the oldest is first
        const dayAgendas = agendas.filter(a => isSameDate(new Date(a.date), selectedDayModal))
                                     .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const dayAppointments = appointments.filter(a => isSameDate(new Date(a.date), selectedDayModal));

        // Find which appointments belong to which agenda based on the physical ID
        const getAppointmentsForAgenda = (agenda: any) => {
          return dayAppointments.filter(appt => appt.zoneAgendaId === agenda.id);
        };

        // Find appointments not covered by any agenda (Orphan)
        const getOrphanAppointments = () => {
          return dayAppointments.filter(appt => !appt.zoneAgendaId);
        };

        const orphanAppts = getOrphanAppointments();

        return (
          <div className="fixed inset-0 bg-black/90 flex flex-col z-[60] backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center shadow-md">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Dettaglio {selectedDayModal.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-gray-400 text-sm mt-1">Gestisci le agende per zona e visualizza gli appuntamenti associati.</p>
              </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (!selectedDayModal) return;
                      const isPast = new Date(new Date(selectedDayModal).setHours(0,0,0,0)) < new Date(new Date().setHours(0,0,0,0));
                      if (isPast) {
                        if (!confirm("Attenzione: Stai creando un'agenda in una data già passata.\nVuoi procedere comunque?")) {
                          return;
                        }
                      }
                      setAddAgendaDate(selectedDayModal);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition flex items-center shadow-lg"
                  >
                    <Plus className="w-5 h-5 mr-1.5" /> Nuova Agenda
                </button>
                <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
                  <button 
                    onClick={() => {
                      const prev = new Date(selectedDayModal);
                      prev.setDate(prev.getDate() - 1);
                      if (prev.getDay() === 0) prev.setDate(prev.getDate() - 2); // skip sunday
                      if (prev.getDay() === 6) prev.setDate(prev.getDate() - 1); // skip saturday
                      setSelectedDayModal(prev);
                      setExpandedAgendaId(null);
                    }}
                    className="p-1.5 hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-white"
                    title="Giorno precedente"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedDayModal(null);
                      setExpandedAgendaId(null);
                    }} 
                    className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white transition"
                  >
                    Torna al Calendario
                  </button>
                  <button 
                    onClick={() => {
                      const next = new Date(selectedDayModal);
                      next.setDate(next.getDate() + 1);
                      if (next.getDay() === 6) next.setDate(next.getDate() + 2); // skip saturday
                      if (next.getDay() === 0) next.setDate(next.getDate() + 1); // skip sunday
                      setSelectedDayModal(next);
                      setExpandedAgendaId(null);
                    }}
                    className="p-1.5 hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-white"
                    title="Giorno successivo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full custom-scrollbar">
              {dayAgendas.length === 0 && dayAppointments.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <CalendarIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Nessuna agenda o appuntamento per questa giornata.</p>
                </div>
              )}

              <div className="space-y-4">
                {dayAgendas.map(agenda => {
                  const isExpanded = expandedAgendaId === agenda.id;
                  const agendaAppts = getAppointmentsForAgenda(agenda);
                  
                  return (
                    <div key={agenda.id} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
                      {/* Accordion Header */}
                      <div 
                        onClick={() => setExpandedAgendaId(isExpanded ? null : agenda.id)}
                        className={`p-4 hover:bg-gray-800 cursor-pointer flex justify-between items-center select-none ${agenda.isClosed ? 'bg-gray-800/40 opacity-80' : 'bg-gray-800/80'}`}
                      >
                        <div className="flex items-center">
                          {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400 mr-3" /> : <ChevronRightIcon className="w-5 h-5 text-gray-400 mr-3" />}
                          <div className="flex-1">
                            {editingAgendaId === agenda.id ? (
                              <div className="flex items-center" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingAgendaName}
                                  onChange={(e) => setEditingAgendaName(e.target.value)}
                                  className="bg-gray-900 border border-emerald-500 rounded px-2 py-1 text-emerald-400 font-bold outline-none ring-2 ring-emerald-500/20"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameAgenda(agenda.id, editingAgendaName);
                                    if (e.key === 'Escape') setEditingAgendaId(null);
                                  }}
                                />
                                <button 
                                  onClick={() => handleRenameAgenda(agenda.id, editingAgendaName)}
                                  className="ml-2 p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white transition"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setEditingAgendaId(null)}
                                  className="ml-1 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center group">
                                <h3 className="text-lg font-bold text-emerald-400">{agenda.name}</h3>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAgendaId(agenda.id);
                                    setEditingAgendaName(agenda.name);
                                  }}
                                  className="ml-3 p-1.5 text-gray-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition rounded hover:bg-emerald-900/20"
                                  title="Rinomina Zona"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            {editingCapsAgendaId === agenda.id ? (
                              <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingCapsInput}
                                  onChange={(e) => setEditingCapsInput(e.target.value)}
                                  className="bg-gray-900 border border-emerald-500 rounded px-2 py-1 text-sm text-white focus:outline-none w-64"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateCaps(agenda.id, editingCapsInput);
                                    if (e.key === 'Escape') setEditingCapsAgendaId(null);
                                  }}
                                  placeholder="Es. 00100, 00101"
                                />
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUpdateCaps(agenda.id, editingCapsInput); }}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white transition"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingCapsAgendaId(null); }}
                                  className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="mt-2 flex items-center gap-2 group">
                                {agenda.caps.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {agenda.caps.map((cap: string, i: number) => (
                                      <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-900/50 border border-gray-700/50 shadow-sm text-xs font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:border-gray-600">
                                        <MapPin className="w-3 h-3 mr-1.5 text-emerald-500/70" />
                                        {cap}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500 italic">Nessun CAP</span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCapsAgendaId(agenda.id);
                                    setEditingCapsInput(agenda.caps.join(", "));
                                  }}
                                  className="p-1.5 text-gray-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition rounded hover:bg-emerald-900/20"
                                  title="Modifica CAP"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
                          
                          <div className="flex items-center bg-gray-950 border border-gray-700/60 rounded-full pl-2 pr-4 py-1.5 shadow-inner group hover:border-emerald-500/50 hover:bg-gray-900 transition-all cursor-pointer relative">
                            <div className="w-7 h-7 rounded-full bg-emerald-900/40 flex items-center justify-center mr-3 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                              <User className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5 pointer-events-none">Assegna A</label>
                              <div className="relative">
                                <select
                                  className="appearance-none bg-transparent text-sm font-semibold text-white outline-none cursor-pointer pr-6 w-full focus:text-emerald-400 transition-colors"
                                  value={agenda.commercialeId || ""}
                                  onChange={(e) => handleAssignCommercialeToAgenda(agenda.id, e.target.value)}
                                >
                                  <option value="" className="bg-gray-900 text-gray-400 italic">Nessuno</option>
                                  {commerciali.map((c: any) => (
                                    <option key={c.id} value={c.id} className="bg-gray-900 text-white font-medium">{c.name}</option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-emerald-400 transition-colors" />
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={(e) => handleToggleAgendaStatus(agenda, e)}
                            className={`p-2 border rounded-lg transition flex items-center justify-center shadow-sm ${agenda.isClosed ? 'border-orange-500/50 bg-orange-900/20 text-orange-400 hover:bg-orange-900/40 hover:border-orange-500' : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-900/20'}`}
                            title={agenda.isClosed ? "Sblocca Agenda" : "Sospendi/Chiudi Agenda"}
                          >
                            {agenda.isClosed ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                          </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingNotesAgenda(agenda);
                              setAgendaNotes(agenda.tlNotes || "");
                            }}
                            className={`p-2 border rounded-lg transition flex items-center justify-center shadow-sm ${agenda.tlNotes ? 'border-blue-500/50 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 hover:border-blue-500' : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-900/20'}`}
                            title="Note Agenda"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setCreateModalAgendaPrefill(agenda);
                              setCreateModalOpen(true);
                            }}
                            className="p-2 border border-gray-700 bg-gray-800 rounded-lg transition flex items-center justify-center shadow-sm text-gray-400 hover:text-purple-400 hover:border-purple-500/50 hover:bg-purple-900/20"
                            title="Nuovo Appuntamento in questa Agenda"
                          >
                            <Plus className="w-5 h-5" />
                          </button>

                          <span className="text-sm font-medium bg-gray-900 px-3 py-1 rounded-full border border-gray-700 text-gray-300">
                            {agendaAppts.length} Appuntamenti
                          </span>
                          {agendaAppts.length === 0 ? (
                            <button 
                              onClick={(e) => handleDeleteAgenda(agenda.id, e)}
                              className="p-2 border border-gray-700 bg-gray-800 rounded-lg transition flex items-center justify-center shadow-sm text-gray-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-900/20"
                              title="Elimina Agenda Vuota"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          ) : (
                            <div className="w-7 h-7"></div> // spacer per mantenere l'allineamento
                          )}
                        </div>
                      </div>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                          {agenda.tlNotes && (
                            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-start text-sm">
                              <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                              <div className="text-blue-200 whitespace-pre-wrap">{agenda.tlNotes}</div>
                            </div>
                          )}
                          
                          {agendaAppts.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">Nessun appuntamento per questa zona.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {agendaAppts.map(appt => {
                                const isActionable = appt.status === "PENDING" || (appt.isDeroga && !appt.isApproved);
                                return (
                            <div 
                              key={appt.id}
                              onClick={() => setSelectedAppt(appt)}
                              className={`p-3 rounded-lg border ${isActionable ? 'border-purple-500/50 hover:border-purple-400 bg-purple-900/20 shadow-lg' : 'border-gray-700 bg-gray-800/80 hover:bg-gray-700'} cursor-pointer relative transition-colors`}
                            >
                                    <div className="font-bold text-white truncate pr-16 mb-1" title={appt.contact.name}>{appt.contact.name}</div>
                                    <div className="text-xs text-gray-400 mb-2">{appt.contact.address || 'Indirizzo non specificato'}</div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-300 flex items-center font-medium">
                                        <Clock className="w-4 h-4 mr-1.5 text-blue-400" />
                                        {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      <div className="flex gap-1 ml-2">
                                        {appt.isPhoneAppt && <span title="App. Telefonico" className="bg-purple-900/50 text-purple-300 px-1 py-0.5 rounded border border-purple-500/50 text-[10px]"><PhoneCall className="w-3 h-3" /></span>}
                                        {appt.isSecondAppt && <span title="Secondo Appuntamento" className="bg-teal-900/50 text-teal-300 px-1 py-0.5 rounded border border-teal-500/50 text-[10px]"><RefreshCw className="w-3 h-3" /></span>}
                                      </div>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                      {getStatusBadge(appt)}
                                    </div>
                                    {appt.commerciale && (
                                      <div className="mt-3 pt-2 border-t border-gray-700/50 text-emerald-400 text-xs flex items-center">
                                        <User className="w-3.5 h-3.5 mr-1" /> Assegnato: {appt.commerciale.name}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Orphan Appointments */}
                {orphanAppts.length > 0 && (
                  <div className="mt-8 border-t border-gray-700 pt-6">
                    <h3 className="text-md font-bold text-gray-400 mb-4 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                      Appuntamenti Fuori Zona (Non associati ad alcuna agenda)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-80">
                      {orphanAppts.map(appt => {
                        const isActionable = appt.status === "PENDING" || (appt.isDeroga && !appt.isApproved);
                        return (
                          <div 
                            key={appt.id}
                            onClick={() => setSelectedAppt(appt)}
                            className={`p-3 rounded-lg border ${isActionable ? 'border-purple-500/50 hover:border-purple-400 bg-purple-900/20 shadow-lg' : 'border-gray-700 bg-gray-800 hover:bg-gray-700'} cursor-pointer relative transition-colors`}
                          >
                            <div className="font-bold text-white truncate pr-16 mb-1" title={appt.contact.name}>{appt.contact.name}</div>
                            <div className="text-xs text-gray-400 mb-2">CAP: {appt.contact.cap}</div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-300 flex items-center">
                                <Clock className="w-4 h-4 mr-1.5 text-blue-400" />
                                {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div className="flex gap-1 ml-2">
                                {appt.isPhoneAppt && <span title="App. Telefonico" className="bg-purple-900/50 text-purple-300 px-1 py-0.5 rounded border border-purple-500/50 text-[10px]"><PhoneCall className="w-3 h-3" /></span>}
                                {appt.isSecondAppt && <span title="Secondo Appuntamento" className="bg-teal-900/50 text-teal-300 px-1 py-0.5 rounded border border-teal-500/50 text-[10px]"><RefreshCw className="w-3 h-3" /></span>}
                              </div>
                            </div>
                            <div className="absolute top-3 right-3">
                              {getStatusBadge(appt)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {selectedAppt && (
        <AppointmentActionModal
          appointment={selectedAppt}
          commerciali={commerciali}
          onClose={() => setSelectedAppt(null)}
          onSuccess={() => {
            setSelectedAppt(null);
            fetchData();
          }}
        />
      )}

      {createModalOpen && (
        <CreateAppointmentModalTL
          commerciali={commerciali}
          onClose={() => { setCreateModalOpen(false); setCreateModalAgendaPrefill(null); }}
          onSuccess={() => {
            setCreateModalOpen(false);
            setCreateModalAgendaPrefill(null);
            fetchData();
          }}
          prefilledAgendaId={createModalAgendaPrefill?.id}
          prefilledDate={createModalAgendaPrefill?.date ? (() => {
            const d = new Date(createModalAgendaPrefill.date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          })() : undefined}
          prefilledCommercialeId={createModalAgendaPrefill?.commercialeId}
        />
      )}

      {addAgendaDate && (
        <AddAgendaModal 
          date={addAgendaDate} 
          onClose={() => setAddAgendaDate(null)}
          onSuccess={() => {
            setAddAgendaDate(null);
            fetchData();
          }}
        />
      )}
      {/* Notes Modal */}
      {editingNotesAgenda && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Note Agenda: {editingNotesAgenda.name}</h3>
              <button onClick={() => setEditingNotesAgenda(null)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white h-32 outline-none focus:border-blue-500"
              placeholder="Inserisci note per questa agenda..."
              value={agendaNotes}
              onChange={e => setAgendaNotes(e.target.value)}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button 
                onClick={() => setEditingNotesAgenda(null)} 
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                Annulla
              </button>
              <button 
                onClick={handleSaveAgendaNotes} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
              >
                Salva Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
