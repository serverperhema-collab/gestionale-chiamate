"use client";

import { useState, useEffect } from "react";
import { Database, Search, Filter, History, X, ChevronLeft, ChevronRight, User, Phone, PhoneOff, Calendar, AlertCircle, ArrowRightCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function GlobalContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [cap, setCap] = useState("");
  const [sector, setSector] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal Timeline
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Modal Assegnazione
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignContact, setAssignContact] = useState<any | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [assignData, setAssignData] = useState({
    assigneeId: "",
    blockHours: "24",
    notes: ""
  });
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        search,
        cap,
        sector,
        status: statusFilter
      });
      const res = await fetch(`/api/tl/contacts/all?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setContacts(data.contacts);
        setTotalPages(data.pagination.totalPages);
        setTotalContacts(data.pagination.total);
      } else {
        toast.error(data.error || "Errore durante il caricamento dei contatti");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchContacts();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, search, cap, sector, statusFilter]);

  const fetchUsers = async () => {
    if (usersList.length > 0) return;
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok) {
        setUsersList(data.users.filter((u: any) => u.role === "OPERATORE" || u.role === "COMMERCIALE"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openAssignModal = (contact: any) => {
    setAssignContact(contact);
    setShowAssignModal(true);
    setAssignData({ assigneeId: "", blockHours: "24", notes: "" });
    fetchUsers();
  };

  const submitAssign = async () => {
    if (!assignData.assigneeId || !assignData.notes) {
      return toast.error("Seleziona un assegnatario e inserisci una nota.");
    }
    const assignee = usersList.find(u => u.id === assignData.assigneeId);
    if (!assignee) return;

    setIsAssigning(true);
    try {
      const res = await fetch(`/api/tl/contacts/${assignContact.id}/assign-recall`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigneeId: assignData.assigneeId,
          assigneeRole: assignee.role,
          blockHours: assignData.blockHours,
          notes: assignData.notes
        })
      });
      if (res.ok) {
        toast.success("Contatto assegnato con successo!");
        setShowAssignModal(false);
        fetchContacts();
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore durante l'assegnazione");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setIsAssigning(false);
    }
  };

  const viewTimeline = async (contact: any) => {
    setSelectedContact(contact);
    setLoadingTimeline(true);
    setTimeline([]);
    
    try {
      const res = await fetch(`/api/tl/contacts/${contact.id}/logs`);
      const data = await res.json();
      if (res.ok) {
        // L'API restituisce già un array timeline formattato e ordinato
        setTimeline(data.timeline || []);
      } else {
        toast.error("Errore nel caricamento della cronologia");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Helper per lo stato visivo
  const getStatusBadge = (c: any) => {
    if (c.isKo) return <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs font-semibold">KO</span>;
    if (c.hiddenUntil && new Date(c.hiddenUntil) > new Date()) return <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs font-semibold">Nascosto (In Trattativa)</span>;
    if (c.assignedToId) return <span className="px-2 py-1 bg-purple-900/50 text-purple-400 rounded text-xs font-semibold">Assegnato ({c.assignedTo?.name})</span>;
    return <span className="px-2 py-1 bg-emerald-900/50 text-emerald-400 rounded text-xs font-semibold">Libero</span>;
  };

  const getTimelineIcon = (type: string) => {
    switch(type) {
      case "CALL": return <Phone className="w-5 h-5 text-blue-400" />;
      case "ACTIVITY": return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case "APPOINTMENT": return <Calendar className="w-5 h-5 text-emerald-400" />;
      default: return <History className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      {/* HEADER & FILTERS */}
      <div className="p-6 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Database className="w-5 h-5 mr-2 text-amber-500" />
              Database Contatti
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Visualizza l'intero database. Ordinato per numero di esiti registrati (dal più chiamato al meno).
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white">{totalContacts}</span>
            <span className="text-sm text-gray-400 block">Contatti Trovati</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca per nome o numero..."
              value={search}
              onChange={(e) => {setSearch(e.target.value); setPage(1);}}
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-amber-500 transition"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtra per CAP..."
              value={cap}
              onChange={(e) => {setCap(e.target.value); setPage(1);}}
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-amber-500 transition"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtra per Settore..."
              value={sector}
              onChange={(e) => {setSector(e.target.value); setPage(1);}}
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-amber-500 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {setStatusFilter(e.target.value); setPage(1);}}
            className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 transition appearance-none"
          >
            <option value="">Tutti gli stati</option>
            <option value="FREE">Liberi e Lavorabili</option>
            <option value="ASSIGNED">Assegnati</option>
            <option value="HIDDEN">Nascosti (Trattative)</option>
            <option value="KO">KO Definitivi</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto bg-gray-900 p-6">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Database className="w-12 h-12 mb-4 opacity-50" />
            <p>Nessun contatto trovato con i filtri attuali.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-sm">
                <th className="pb-3 font-medium">Nome Azienda</th>
                <th className="pb-3 font-medium">CAP</th>
                <th className="pb-3 font-medium">Settore</th>
                <th className="pb-3 font-medium">Stato</th>
                <th className="pb-3 font-medium text-center">N° Esiti / Log</th>
                <th className="pb-3 font-medium text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {contacts.map((c) => {
                const totalLogs = (c._count?.callLogs || 0) + (c._count?.activityLogs || 0) + (c._count?.appointments || 0);
                
                return (
                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition group">
                  <td className="py-4">
                    <div className="font-semibold text-gray-200">{c.name}</div>
                    <div className="text-gray-500 text-xs font-mono">{c.originalPhone || "Nessun tel."}</div>
                  </td>
                  <td className="py-4 text-gray-400">{c.cap || "-"}</td>
                  <td className="py-4 text-gray-400">{c.sector || "-"}</td>
                  <td className="py-4">{getStatusBadge(c)}</td>
                  <td className="py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${totalLogs > 10 ? 'bg-red-900/30 text-red-400 border border-red-800' : totalLogs > 0 ? 'bg-amber-900/30 text-amber-400 border border-amber-800' : 'bg-gray-800 text-gray-500'}`} title={`Esiti Telefonici: ${c._count?.callLogs || 0} | Azioni Sistema: ${c._count?.activityLogs || 0} | Appuntamenti: ${c._count?.appointments || 0}`}>
                      {totalLogs}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openAssignModal(c)}
                        className="inline-flex items-center px-3 py-1.5 bg-purple-900/30 hover:bg-purple-800/50 text-purple-400 rounded border border-purple-800/50 transition"
                      >
                        <ArrowRightCircle className="w-4 h-4 mr-1.5" />
                        Delega
                      </button>
                      <button
                        onClick={() => viewTimeline(c)}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition"
                      >
                        <History className="w-4 h-4 mr-1.5" />
                        Cronologia
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      <div className="p-4 border-t border-gray-700 bg-gray-800 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          Pagina {page} di {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="p-2 rounded bg-gray-700 text-white disabled:opacity-50 hover:bg-gray-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(p => p + 1)}
            className="p-2 rounded bg-gray-700 text-white disabled:opacity-50 hover:bg-gray-600 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TIMELINE MODAL */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/30 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center">
                  <History className="w-5 h-5 mr-2 text-amber-500" />
                  Cronologia Completa
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Storia di <span className="font-semibold text-gray-200">{selectedContact.name}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedContact(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              {loadingTimeline ? (
                <div className="flex justify-center p-12">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : timeline.length === 0 ? (
                <div className="text-center text-gray-500 p-12">
                  Nessun evento registrato per questo contatto.
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">
                  {timeline.map((event, idx) => (
                    <div key={event.id || idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Icona */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-gray-900 bg-gray-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                        {getTimelineIcon(event.type)}
                      </div>
                      
                      {/* Card */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-gray-700 bg-gray-800/50 shadow-sm relative">
                        {/* Triangolo freccia (CSS puro, semplificato con bordi) */}
                        <div className="absolute top-4 w-3 h-3 bg-gray-800/50 border-t border-l border-gray-700 transform rotate-45 -left-1.5 md:group-odd:-left-1.5 md:group-even:-right-1.5 md:group-even:rotate-[225deg]"></div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-bold text-sm ${
                            event.type === 'CALL' ? 'text-blue-400' : 
                            event.type === 'APPOINTMENT' ? 'text-emerald-400' : 
                            'text-amber-400'
                          }`}>
                            {event.title}
                          </span>
                          <span className="text-xs font-mono text-gray-500">
                            {new Date(event.date).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-gray-300 text-sm mb-3">
                          {event.description}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <User className="w-3 h-3 mr-1" />
                          {event.user} ({event.userRole === "TEAM_LEADER" ? "TL" : "Operatore"})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {showAssignModal && assignContact && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-purple-500/30 rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-purple-900/10 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center">
                  <ArrowRightCircle className="w-5 h-5 mr-2 text-purple-400" />
                  Delega Contatto
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Stai assegnando: <span className="text-white font-semibold">{assignContact.name}</span>
                </p>
              </div>
              <button 
                onClick={() => setShowAssignModal(false)}
                className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm text-gray-300 font-medium block mb-2">Assegna a (Operatore/Commerciale)</label>
                <select
                  value={assignData.assigneeId}
                  onChange={e => setAssignData({...assignData, assigneeId: e.target.value})}
                  disabled={loadingUsers}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
                >
                  <option value="">-- Seleziona --</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role === 'OPERATORE' ? 'Op.' : 'Comm.'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-300 font-medium block mb-2">Durata Blocco (Ore)</label>
                {assignContact.hiddenUntil && new Date(assignContact.hiddenUntil) > new Date() ? (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-400 text-sm italic">
                    Il contatto è già bloccato fino al {new Date(assignContact.hiddenUntil).toLocaleString()}. 
                    Questo tempo di blocco non verrà modificato.
                  </div>
                ) : (
                  <input
                    type="number"
                    min="1"
                    value={assignData.blockHours}
                    onChange={e => setAssignData({...assignData, blockHours: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Tempo entro il quale l'assegnatario deve lavorare il contatto prima che torni nel calderone globale.
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-300 font-medium block mb-2">Nota Direttiva (Obbligatoria)</label>
                <textarea
                  value={assignData.notes}
                  onChange={e => setAssignData({...assignData, notes: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white h-24 resize-none focus:border-purple-500 outline-none"
                  placeholder="Es. Ricontatta il cliente e verifica se..."
                ></textarea>
              </div>

              <button
                onClick={submitAssign}
                disabled={isAssigning || !assignData.assigneeId || !assignData.notes}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg transition"
              >
                {isAssigning ? "Assegnazione in corso..." : "Conferma Assegnazione"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
