"use client";

import { useState, useEffect, useMemo } from "react";
import { EyeOff, Clock, Unlock, AlertTriangle, Building, MapPin, Search, FileText, Phone, Settings as SettingsIcon, Calendar, X, Filter } from "lucide-react";
import toast from "react-hot-toast";

interface HiddenContact {
  id: string;
  name: string;
  cap: string;
  address: string | null;
  phone: string | null;
  hiddenUntil: string;
  reason: string;
  blockedBy: string;
}

interface LogEvent {
  id: string;
  type: "CALL" | "ACTIVITY" | "APPOINTMENT";
  title: string;
  description: string;
  date: string;
  user: string;
  userRole: string;
}

const MultiSelect = ({ options, selected, onChange, placeholder }: { options: string[], selected: string[], onChange: (s: string[]) => void, placeholder: string }) => {
  const [open, setOpen] = useState(false);
  
  const toggle = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter(x => x !== val));
    else onChange([...selected, val]);
  };

  return (
    <div className="relative w-full">
      <div 
        onClick={() => setOpen(!open)}
        className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg p-2.5 cursor-pointer flex justify-between items-center w-full min-w-[200px]"
      >
        <span className="truncate">
          {selected.length === 0 ? placeholder : `${selected.length} Selezionati`}
        </span>
      </div>
      
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-auto">
            {options.map(opt => (
              <label key={opt} className="flex items-center px-4 py-2 hover:bg-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="mr-3 w-4 h-4 text-emerald-500 rounded border-gray-600 bg-gray-900 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-200 truncate">{opt}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function HiddenContactsPage() {
  const [contacts, setContacts] = useState<HiddenContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(new Date());

  // Filters State
  const [filterOperators, setFilterOperators] = useState<string[]>([]);
  const [filterReasons, setFilterReasons] = useState<string[]>([]);
  const [filterCaps, setFilterCaps] = useState<string[]>([]);

  // Logs Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<HiddenContact | null>(null);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Unblock Confirmation Modal State
  const [contactToUnblock, setContactToUnblock] = useState<HiddenContact | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/tl/hidden-contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts);
      } else {
        toast.error("Errore nel caricamento dei contatti bloccati");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUnblockClick = (contact: HiddenContact) => {
    setContactToUnblock(contact);
  };

  const confirmUnblock = async () => {
    if (!contactToUnblock) return;

    try {
      const res = await fetch(`/api/tl/hidden-contacts/${contactToUnblock.id}/unblock`, {
        method: "POST"
      });

      if (res.ok) {
        toast.success("Contatto sbloccato e reinserito nel calderone!");
        fetchData();
        if (selectedContact?.id === contactToUnblock.id) setIsModalOpen(false);
      } else {
        toast.error("Errore durante lo sblocco");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setContactToUnblock(null);
    }
  };

  const handleViewLogs = async (contact: HiddenContact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
    setLogsLoading(true);

    try {
      const res = await fetch(`/api/tl/contacts/${contact.id}/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.timeline);
      } else {
        toast.error("Errore nel caricamento dei log");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setLogsLoading(false);
    }
  };

  const getTimeRemaining = (targetDateStr: string) => {
    const target = new Date(targetDateStr);
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return "Sblocco imminente";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    if (days > 0) return `${days}g ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  // Estrazione opzioni uniche per i filtri
  const uniqueOperators = useMemo(() => Array.from(new Set(contacts.map(c => c.blockedBy))).sort(), [contacts]);
  const uniqueReasons = useMemo(() => Array.from(new Set(contacts.map(c => c.reason.split(' (')[0]))).sort(), [contacts]);
  const uniqueCaps = useMemo(() => Array.from(new Set(contacts.map(c => c.cap))).sort(), [contacts]);

  const filteredContacts = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchOperator = filterOperators.length === 0 || filterOperators.includes(c.blockedBy);
    const matchReason = filterReasons.length === 0 || filterReasons.includes(c.reason);
    const matchCap = filterCaps.length === 0 || filterCaps.includes(c.cap);

    return matchSearch && matchOperator && matchReason && matchCap;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case "CALL": return <Phone className="w-5 h-5 text-blue-400" />;
      case "ACTIVITY": return <SettingsIcon className="w-5 h-5 text-purple-400" />;
      case "APPOINTMENT": return <Calendar className="w-5 h-5 text-emerald-400" />;
      default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center mb-2">
            <EyeOff className="w-8 h-8 mr-3 text-yellow-500" />
            Contatti Nascosti ({filteredContacts.length}{filteredContacts.length !== contacts.length ? ` di ${contacts.length}` : ''})
          </h1>
          <p className="text-gray-400">
            Monitora i contatti attualmente in pausa. I contatti in questa lista non vengono estratti dagli operatori finché il timer non scade.
          </p>
        </div>
        
        <div className="relative w-full xl:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-700 rounded-lg leading-5 bg-gray-900 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition duration-150 ease-in-out shadow-inner"
            placeholder="Cerca nome contatto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Barra dei Filtri Avanzati */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center text-gray-400 mr-2 shrink-0">
          <Filter className="w-5 h-5 mr-2" />
          <span className="font-medium text-sm">Filtri:</span>
        </div>

        <div className="flex-1 min-w-[200px]">
          <MultiSelect 
            options={uniqueOperators} 
            selected={filterOperators} 
            onChange={setFilterOperators} 
            placeholder="Tutti gli Operatori" 
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <MultiSelect 
            options={uniqueReasons} 
            selected={filterReasons} 
            onChange={setFilterReasons} 
            placeholder="Tutti i Motivi" 
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <MultiSelect 
            options={uniqueCaps} 
            selected={filterCaps} 
            onChange={setFilterCaps} 
            placeholder="Tutti i CAP" 
          />
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center flex-1">
          <EyeOff className="w-16 h-16 mx-auto text-gray-700 mb-4" />
          <h3 className="text-xl font-medium text-gray-300">Nessun contatto trovato</h3>
          <p className="text-gray-500 mt-2">I filtri attuali non hanno prodotto nessun risultato oppure la lista è vuota.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredContacts.map((contact) => (
            <div key={contact.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg transition hover:border-gray-700 flex flex-col">
              <div className="p-5 border-b border-gray-800/50 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-white truncate pr-4 flex-1" title={contact.name}>
                    {contact.name}
                  </h3>
                  <div className="bg-yellow-900/30 text-yellow-500 border border-yellow-700/30 px-2 py-1 rounded text-xs font-mono flex items-center whitespace-nowrap">
                    <Clock className="w-3 h-3 mr-1.5" />
                    {getTimeRemaining(contact.hiddenUntil)}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-400 mb-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="truncate">{contact.address || 'Indirizzo non disponibile'} (CAP: {contact.cap})</span>
                  </div>
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Azionato da: <span className="text-gray-300 font-medium">{contact.blockedBy}</span></span>
                  </div>
                </div>

                <div className="bg-gray-800/80 rounded border border-gray-700 p-3 mt-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5 font-bold">Motivo del Blocco</p>
                      <p className="text-sm text-gray-300">{contact.reason}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/30 p-3 flex justify-between items-center">
                <button
                  onClick={() => handleViewLogs(contact)}
                  className="flex items-center text-emerald-400 hover:text-emerald-300 px-2 py-2 text-sm font-medium transition-colors"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  Vedi Storico
                </button>
                <button
                  onClick={() => handleUnblockClick(contact)}
                  className="flex items-center bg-gray-800 hover:bg-emerald-600 border border-gray-700 hover:border-emerald-500 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Sblocca
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Storico */}
      {isModalOpen && selectedContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-emerald-400" />
                  Storico Contatto
                </h2>
                <p className="text-sm text-gray-400 mt-1">{selectedContact.name} ({selectedContact.cap})</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {logsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400">Nessun evento registrato per questo contatto.</p>
                </div>
              ) : (
                <div className="relative border-l border-gray-800 ml-4 space-y-8">
                  {logs.map((log, index) => (
                    <div key={log.id} className="relative pl-8">
                      {/* Pallino sulla timeline */}
                      <div className="absolute -left-3.5 top-1 bg-gray-900 p-1 rounded-full border border-gray-700">
                        {getLogIcon(log.type)}
                      </div>

                      <div className="bg-gray-800/40 border border-gray-800/80 rounded-lg p-4 hover:border-gray-700 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-medium text-base">{log.title}</h4>
                          <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">
                            {new Date(log.date).toLocaleString()}
                          </span>
                        </div>
                        
                        {log.description && (
                          <p className="text-gray-300 text-sm mb-3 whitespace-pre-wrap">{log.description}</p>
                        )}
                        
                        <div className="flex items-center text-xs text-gray-500 mt-2">
                          <span className="font-medium text-gray-400 mr-1">{log.user}</span> 
                          ({log.userRole})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex justify-end">
              <button
                onClick={() => handleUnblockClick(selectedContact)}
                className="flex items-center bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Unlock className="w-4 h-4 mr-2" />
                Forza Sblocco Subito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finestrella Custom Conferma Sblocco */}
      {contactToUnblock && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-800/50 p-5 flex items-center justify-center border-b border-gray-700/50">
              <div className="bg-emerald-500/10 p-3 rounded-full">
                <Unlock className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-white mb-2">Conferma Sblocco</h3>
              <p className="text-gray-300 mb-4">
                Vuoi davvero sbloccare il contatto <span className="font-bold text-white">"{contactToUnblock.name}"</span>?
              </p>

              <div className="bg-gray-800/80 rounded border border-gray-700 p-3 mb-6 text-sm text-left">
                <span className="block text-gray-500 mb-1">Cosa succederà:</span>
                <ul className="text-gray-400 list-disc list-inside space-y-1">
                  <li>Il timer verrà annullato.</li>
                  <li>Il contatto sarà di nuovo estraibile dal calderone.</li>
                  {contactToUnblock.reason.includes("Non Risponde") && (
                    <li><span className="text-emerald-400 font-medium">I tentativi "Non Risponde" verranno azzerati a 0.</span></li>
                  )}
                  {contactToUnblock.reason.includes("Appuntamento") && (
                    <li className="text-orange-400">Attenzione: se c'è un appuntamento, l'operatore potrebbe richiamarlo sovrapponendosi!</li>
                  )}
                  {contactToUnblock.reason.includes("Richiami") && (
                    <li>Verrà sganciato dall'operatore attuale.</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setContactToUnblock(null)}
                  className="flex-1 px-4 py-2.5 bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-medium transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={confirmUnblock}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-lg shadow-emerald-900/20 transition-colors"
                >
                  Sì, Sbloccalo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
