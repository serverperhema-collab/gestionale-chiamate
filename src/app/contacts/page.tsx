"use client";
import { useEffect, useState, Fragment } from "react";
import { Search, MapPin, Clock, Phone, Download, Building, Globe, Navigation, ChevronDown, ChevronUp, LayoutGrid, Trash2, AlertTriangle, Pencil, Check, X, ClipboardPaste, ChevronLeft, ChevronRight } from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState("Tutti");
  const [uniqueSectors, setUniqueSectors] = useState<string[]>([]);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const limit = 50;

  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [tempPhone, setTempPhone] = useState<string>("");

  // Fetch unique sectors on mount
  useEffect(() => {
    fetch('/api/contacts/sectors')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUniqueSectors(["Tutti", ...data]);
      })
      .catch(e => console.error("Error fetching sectors", e));
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 400); // 400ms delay
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch contacts whenever page, debounced search or sector changes
  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (debouncedSearch) query.append("search", debouncedSearch);
    if (selectedSector !== "Tutti") query.append("sector", selectedSector);

    fetch(`/api/contacts?${query.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setContacts(data.data);
          setTotalPages(data.meta.totalPages);
          setTotalContacts(data.meta.total);
        } else {
          setContacts([]);
          setTotalPages(1);
          setTotalContacts(0);
        }
        setLoading(false);
      })
      .catch(e => {
        console.error("Error fetching contacts", e);
        setLoading(false);
      });
  }, [page, debouncedSearch, selectedSector]);

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const exportCSV = async () => {
    const query = new URLSearchParams({ export: 'true' });
    if (debouncedSearch) query.append("search", debouncedSearch);
    if (selectedSector !== "Tutti") query.append("sector", selectedSector);

    try {
      const res = await fetch(`/api/contacts?${query.toString()}`);
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const header = "Nome Azienda;Telefono;Orari;CAP;Settore;Indirizzo Completo;Sito Web;Stato;Link Google Maps\n";
      const rows = data.map((c: any) => `"${c.name || ''}";"${c.phone || ''}";"${c.hours || ''}";"${c.cap || ''}";"${c.sector || ''}";"${c.address || ''}";"${c.website || ''}";"${c.businessStatus || ''}";"${c.url || ''}"`).join("\n");
      const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "database_estrazioni.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Errore durante l'esportazione");
    }
  };

  const handleDeleteAll = async () => {
    const psw = window.prompt("ATTENZIONE: Questa azione eliminerà TUTTI i contatti dal database. Inserisci la password di sicurezza per procedere:");
    if (psw === "kk2bva6a") {
      try {
        const res = await fetch('/api/contacts/delete-all', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: psw })
        });
        if (res.ok) {
          setContacts([]);
          setTotalContacts(0);
          setTotalPages(1);
          alert("Database svuotato con successo.");
        } else {
          alert("Errore durante l'eliminazione.");
        }
      } catch (e) {
        alert("Errore di rete.");
      }
    } else if (psw !== null) {
      alert("Password errata. Eliminazione annullata.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il contatto "${name}"?`)) {
      try {
        const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setContacts(contacts.filter(c => c.id !== id));
          setTotalContacts(prev => prev - 1);
        } else {
          alert("Errore durante l'eliminazione.");
        }
      } catch (e) {
        alert("Errore di rete.");
      }
    }
  };

  const savePhone = async (id: string) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: tempPhone })
      });
      if (res.ok) {
        setContacts(contacts.map(c => c.id === id ? { ...c, phone: tempPhone } : c));
        setEditingPhone(null);
      } else {
        alert("Errore salvataggio");
      }
    } catch(e) {
      alert("Errore di rete");
    }
  };

  const handleAutoPaste = async (id: string) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0) {
        const res = await fetch(`/api/contacts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: text.trim() })
        });
        if (res.ok) {
          setContacts(contacts.map(c => c.id === id ? { ...c, phone: text.trim() } : c));
        } else {
          alert("Errore durante il salvataggio.");
        }
      } else {
        alert("Gli appunti sono vuoti. Copia prima un numero.");
      }
    } catch (e) {
      alert("Permesso per gli appunti negato. Clicca 'Consenti' nel browser, oppure usa la matita per inserirlo manualmente.");
    }
  };

  const openGoogleSearch = (c: any) => {
    const via = c.address ? c.address.split(',')[0] : '';
    const query = `"${c.name}" ${via} ${c.cap} telefono`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Rubrica Contatti</h1>
          <p className="text-gray-400 mt-1">Totale in archivio: <strong className="text-blue-400">{totalContacts}</strong></p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleDeleteAll} className="flex items-center px-4 py-2 bg-red-900/40 hover:bg-red-600 text-red-200 hover:text-white rounded-lg border border-red-700/50 transition-colors shadow-sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Svuota Database
          </button>
          <button onClick={exportCSV} className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition-colors shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            Esporta in Excel
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cerca per nome azienda, CAP o settore..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
            />
          </div>
          <div className="md:w-64 shrink-0 relative">
            <select 
              value={selectedSector}
              onChange={(e) => {
                setSelectedSector(e.target.value);
                setPage(1);
              }}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer"
            >
              {uniqueSectors.length === 0 && <option value="Tutti">Caricamento settori...</option>}
              {uniqueSectors.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
            <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-sm">
                <th className="pb-3 font-medium px-4">Azienda</th>
                <th className="pb-3 font-medium px-4">Telefono</th>
                <th className="pb-3 font-medium px-4">Settore</th>
                <th className="pb-3 font-medium px-4">Indirizzo</th>
                <th className="pb-3 font-medium px-4">CAP</th>
                <th className="pb-3 font-medium px-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4 text-gray-400">Caricamento database...</p>
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">Nessun contatto trovato.</td>
                </tr>
              ) : (
                contacts.map(c => (
                  <Fragment key={c.id}>
                    <tr className="hover:bg-gray-700/20 transition-colors group border-b border-gray-700/30">
                      <td className="py-4 px-4 min-w-[200px]">
                        <div className="flex items-start text-white font-medium">
                          <Building className="w-4 h-4 mr-2 mt-0.5 text-gray-500 shrink-0" />
                          <span className="whitespace-normal leading-snug">{c.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {editingPhone === c.id ? (
                          <div className="flex items-center space-x-2">
                            <input 
                              type="text" 
                              value={tempPhone} 
                              onChange={e => setTempPhone(e.target.value)}
                              className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white w-32 focus:ring-1 focus:ring-blue-500 outline-none"
                              autoFocus
                              onKeyDown={e => e.key === 'Enter' && savePhone(c.id)}
                            />
                            <button onClick={() => savePhone(c.id)} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingPhone(null)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 group/phone">
                            {c.phone === "N/D" || c.phone === "Nessun Risultato dal Web" ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500 flex items-center text-sm">
                                    <Phone className="w-4 h-4 mr-2 opacity-50" />
                                    {c.phone}
                                </span>
                                <button 
                                    onClick={() => openGoogleSearch(c)}
                                    className="inline-flex items-center px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded text-xs transition-colors border border-blue-500/30 whitespace-nowrap"
                                    title="Cerca su Google"
                                >
                                    <Search className="w-3 h-3 mr-1" /> Google
                                </button>
                              </div>
                            ) : (
                              <a 
                                href={`tel:${c.phone}`} 
                                className="flex items-center text-gray-300 hover:text-blue-400 transition-colors cursor-pointer w-max text-sm"
                                title="Chiama ora con il PC"
                              >
                                <Phone className="w-4 h-4 mr-2 text-blue-400" />
                                {c.phone}
                              </a>
                            )}
                            <button 
                              onClick={() => handleAutoPaste(c.id)}
                              className="opacity-0 group-hover/phone:opacity-100 p-1 text-emerald-400 hover:text-emerald-300 transition-opacity"
                              title="Incolla dagli appunti e Salva subito"
                            >
                              <ClipboardPaste className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { setTempPhone(c.phone === "N/D" || c.phone === "Nessun Risultato dal Web" ? "" : c.phone); setEditingPhone(c.id); }}
                              className="opacity-0 group-hover/phone:opacity-100 p-1 text-gray-500 hover:text-white transition-opacity"
                              title="Modifica numero manualmente"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 min-w-[150px]">
                        <div className="flex items-start text-gray-300 text-sm">
                          <LayoutGrid className="w-4 h-4 mr-2 mt-0.5 text-blue-400 shrink-0" />
                          <span className="whitespace-normal leading-snug">{c.sector}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 min-w-[200px]">
                        <div className="flex items-start text-gray-300 text-sm">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5 text-red-400 shrink-0" />
                          <span className="whitespace-normal leading-snug">{c.address || 'N/D'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-300 text-sm font-mono bg-gray-900 px-2 py-1 rounded border border-gray-700">
                          {c.cap}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleDelete(c.id, c.name)}
                            className="inline-flex items-center p-1.5 bg-red-900/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                            title="Elimina contatto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => toggleRow(c.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-sm transition-colors border border-blue-500/20"
                          >
                            Dettagli
                            {expandedRows.has(c.id) ? (
                              <ChevronUp className="w-4 h-4 ml-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 ml-1" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows.has(c.id) && (
                      <tr className="bg-gray-900/50">
                        <td colSpan={6} className="px-6 py-6 border-b border-gray-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Orari di Apertura</h4>
                              <div className="flex items-start text-gray-300 text-sm bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <Clock className="w-4 h-4 mr-2 mt-0.5 text-yellow-500 shrink-0" />
                                <span className="whitespace-normal leading-relaxed">
                                  {c.hours && c.hours !== "Orari non disponibili" 
                                    ? c.hours.split(" | ").map((h: string, i: number) => <div key={i}>{h}</div>) 
                                    : "Orari non disponibili"}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Risorse Web</h4>
                              <div className="space-y-2 bg-gray-800 p-3 rounded-lg border border-gray-700">
                                {c.website ? (
                                  <a href={c.website} target="_blank" className="flex items-center p-2 rounded hover:bg-gray-700 text-blue-400 hover:text-blue-300 text-sm transition-colors w-full">
                                    <Globe className="w-4 h-4 mr-2 shrink-0" />
                                    Visita il Sito Ufficiale
                                  </a>
                                ) : (
                                  <div className="flex items-center p-2 text-gray-500 text-sm">
                                    <Globe className="w-4 h-4 mr-2 opacity-50 shrink-0" />
                                    Sito web non inserito
                                  </div>
                                )}
                                {c.url && (
                                  <a href={c.url} target="_blank" className="flex items-center p-2 rounded hover:bg-gray-700 text-green-400 hover:text-green-300 text-sm transition-colors w-full">
                                    <Navigation className="w-4 h-4 mr-2 shrink-0" />
                                    Apri su Google Maps
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Info Aggiuntive</h4>
                              <div className="space-y-2 bg-gray-800 p-3 rounded-lg border border-gray-700 text-sm text-gray-400">
                                <p className="flex justify-between"><span>Stato Attività:</span> {c.businessStatus === 'OPERATIONAL' ? <span className="text-green-400 font-medium">Operativa</span> : <span className="text-red-400 font-medium">{c.businessStatus || 'Sconosciuto'}</span>}</p>
                                <p className="flex justify-between"><span>ID Google Maps:</span> <span className="font-mono text-xs">{c.placeId}</span></p>
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Pagina <strong className="text-white">{page}</strong> di <strong className="text-white">{totalPages}</strong>
            </p>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Precedente
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
              >
                Successiva <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
