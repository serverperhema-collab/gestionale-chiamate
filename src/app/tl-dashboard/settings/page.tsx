"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, MapPin, Edit2, Check, XCircle, ChevronLeft, Trash2, AlertTriangle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

function SuggestedZone({ cap }: { cap: string }) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchSuggestion = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.zippopotam.us/it/${cap}`);
        let newName = `Zona ${cap}`;
        
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.places && data.places.length > 0) {
            newName = `${data.places[0]["place name"]}, ${data.places[0]["state abbreviation"]}`;
          }
        }
        
        if (mounted) {
          setSuggestion(newName);
          // Save automatically to DB regardless of result
          fetch("/api/tl/settings/zones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cap, zoneName: newName }),
          }).catch(console.error);
        }
      } catch (e) {
        if (mounted) {
          const fallbackName = `Zona ${cap}`;
          setSuggestion(fallbackName);
          fetch("/api/tl/settings/zones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cap, zoneName: fallbackName }),
          }).catch(console.error);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Stagger requests between 0 and 15 seconds to prevent browser freezing
    const timeout = setTimeout(() => {
      fetchSuggestion();
    }, Math.random() * 15000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [cap]);

  if (loading) return <span className="text-gray-500 italic text-xs animate-pulse">Ricerca in corso...</span>;
  return <span className="text-gray-500 italic">{suggestion || "In attesa..."} (da configurare)</span>;
}

export default function SettingsPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCap, setEditingCap] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Reset sistema
  const [showResetPanel, setShowResetPanel] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleReset = async () => {
    if (!resetConfirm) { toast.error("Spunta la conferma prima di procedere"); return; }
    setResetLoading(true);
    try {
      const res = await fetch("/api/tl/reset-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Reset completato! Tutti i dati operativi sono stati azzerati.");
        setShowResetPanel(false);
        setResetPassword("");
        setResetConfirm(false);
      } else {
        toast.error(data.error || "Errore durante il reset");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setResetLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tl/settings/zones");
      if (res.ok) {
        const data = await res.json();
        setZones(data.zones || []);
      }
    } catch (e) {
      toast.error("Errore nel caricamento delle zone");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleSave = async (cap: string, zoneName: string) => {
    if (!zoneName.trim()) {
      toast.error("Il nome della zona non può essere vuoto");
      return;
    }

    try {
      const res = await fetch("/api/tl/settings/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cap, zoneName }),
      });

      if (res.ok) {
        toast.success("Zona salvata con successo");
        setEditingCap(null);
        fetchZones();
      } else {
        toast.error("Errore durante il salvataggio");
      }
    } catch (e) {
      toast.error("Errore di connessione");
    }
  };

  const handleDelete = async (cap: string) => {
    if (!confirm(`Sei sicuro di voler nascondere il CAP ${cap} dalla lista?`)) return;
    
    try {
      const res = await fetch(`/api/tl/settings/zones?cap=${cap}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("CAP nascosto con successo");
        setZones(zones.filter((z) => z.cap !== cap));
      } else {
        toast.error("Errore durante l'eliminazione");
      }
    } catch (e) {
      toast.error("Errore di connessione");
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedZones = [...zones].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    if (sortConfig.key === 'zoneName') {
      aVal = a.zoneName || `Zona ${a.cap}`;
      bVal = b.zoneName || `Zona ${b.cap}`;
    }

    if (aVal < bVal) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aVal > bVal) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-2xl w-full">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-xl font-bold text-white flex items-center mb-2">
            <MapPin className="w-5 h-5 mr-2 text-purple-400" />
            Mappatura Zone per CAP
          </h3>
          <p className="text-gray-400 text-sm">
            Qui puoi assegnare un nome personalizzato ad ogni CAP. Questo nome verrà usato automaticamente come nome della zona quando crei una nuova Agenda per quel CAP.
          </p>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950 text-gray-400 text-sm uppercase tracking-wider">
                  <th 
                    className="p-4 border-b border-gray-800 font-semibold cursor-pointer hover:text-white transition"
                    onClick={() => handleSort('cap')}
                  >
                    CAP {sortConfig?.key === 'cap' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th 
                    className="p-4 border-b border-gray-800 font-semibold cursor-pointer hover:text-white transition"
                    onClick={() => handleSort('zoneName')}
                  >
                    Nome Zona Attuale {sortConfig?.key === 'zoneName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th 
                    className="p-4 border-b border-gray-800 font-semibold cursor-pointer hover:text-white transition"
                    onClick={() => handleSort('count')}
                  >
                    Contatti {sortConfig?.key === 'count' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-4 border-b border-gray-800 font-semibold text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {sortedZones.map((zone) => (
                  <tr key={zone.cap} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="p-4 font-bold text-purple-400">
                      <a 
                        href={`https://www.google.com/search?q=${zone.cap}+cap`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline hover:text-purple-300"
                        title="Cerca su Google"
                      >
                        {zone.cap}
                      </a>
                    </td>
                    <td className="p-4">
                      {editingCap === zone.cap ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            placeholder="Es: Roma Centro"
                            className="bg-gray-950 border border-emerald-500 rounded px-3 py-1.5 text-emerald-400 font-medium outline-none ring-2 ring-emerald-500/20 w-full max-w-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSave(zone.cap, editingName);
                              if (e.key === 'Escape') setEditingCap(null);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center group">
                          {zone.isCustom ? (
                            <span className="font-semibold text-emerald-400">{zone.zoneName}</span>
                          ) : (
                            <SuggestedZone cap={zone.cap} />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      <span className="bg-gray-800 px-2.5 py-1 rounded-full border border-gray-700">
                        {zone.count} contatti
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {editingCap === zone.cap ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleSave(zone.cap, editingName)}
                            className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded text-white transition shadow"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditingCap(null)}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingCap(zone.cap);
                              setEditingName(zone.zoneName || "");
                            }}
                            className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-900/20 transition rounded-lg"
                            title="Modifica Zona"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(zone.cap)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition rounded-lg"
                            title="Nascondi CAP"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                
                {zones.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      Nessun CAP trovato nel database contatti.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== PANNELLO RESET SISTEMA ===== */}
      <div className="mt-8 bg-gray-900 border border-red-900/50 rounded-xl overflow-hidden shadow-2xl w-full">
        <div className="p-6 border-b border-red-900/30 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-red-400 flex items-center mb-1">
              <ShieldAlert className="w-5 h-5 mr-2" />
              Reset Sistema
            </h3>
            <p className="text-gray-500 text-sm">
              Azzera tutti i dati operativi (appuntamenti, trattative, log, assegnazioni). <strong className="text-gray-300">Contatti e account operatori NON vengono toccati.</strong>
            </p>
          </div>
          <button
            onClick={() => { setShowResetPanel(p => !p); setResetPassword(""); setResetConfirm(false); }}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-400 rounded-lg font-semibold transition text-sm"
          >
            {showResetPanel ? "Annulla" : "⚠️ Avvia Reset"}
          </button>
        </div>

        {showResetPanel && (
          <div className="p-6 space-y-5">
            <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">
                <strong>Attenzione!</strong> Questa operazione è irreversibile. Verranno eliminati definitivamente: tutti gli appuntamenti, le trattative, i log chiamate, i log attività, le assegnazioni giornaliere, le zone agenda, le richieste preventivo e i record KO. Tutti i contatti torneranno "vergini" nel calderone.
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Password di Sicurezza</label>
              <input
                type="password"
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
                placeholder="Inserisci la password..."
                className="w-full max-w-xs bg-gray-800 border border-gray-700 focus:border-red-500 rounded-lg px-4 py-2.5 text-white outline-none"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={resetConfirm}
                onChange={e => setResetConfirm(e.target.checked)}
                className="w-4 h-4 accent-red-500"
              />
              <span className="text-gray-300 text-sm">Ho capito che questa operazione è irreversibile e voglio procedere.</span>
            </label>

            <button
              onClick={handleReset}
              disabled={resetLoading || !resetPassword}
              className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold transition shadow-lg shadow-red-900/30"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              {resetLoading ? "Reset in corso..." : "Conferma Reset Definitivo"}
            </button>
          </div>
        )}
      </div>
  );
}
