"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, Map as MapIcon, AlertTriangle, CheckCircle2, CheckSquare, Square, X, Search as SearchIcon, ChevronDown, ChevronUp, Key, ShieldAlert } from "lucide-react";
import lazioData from "@/data/lazio_caps.json";
import { useExtraction } from "../ExtractionContext";
import { CATEGORIES } from "@/data/categories";

const EXCLUDED_IDS = ["comuni", "polizia", "parchi_pubblici"];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // raggio terrestre in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function ExtractPage() {
  const { logs, isExtracting, startExtraction: startGlobalExtraction, searchedCaps, batchProgress } = useExtraction();
  const [cap, setCap] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState("google");

  // Nuovi stati per la selezione a cascata
  const [provincia, setProvincia] = useState("");
  const [comune, setComune] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);

  // Stati per la gestione chiavi API e Settori direttamente in pagina
  
  const [enabledSectors, setEnabledSectors] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSectorsExpanded, setIsSectorsExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      
      
      
      const storedSectors = localStorage.getItem("enabled_categories");
      if (storedSectors) {
        try {
          setEnabledSectors(JSON.parse(storedSectors));
        } catch (e) {
          const defaultSectors = CATEGORIES.filter(c => !EXCLUDED_IDS.includes(c.id)).map(c => c.id);
          setEnabledSectors(defaultSectors);
        }
      } else {
        const defaultSectors = CATEGORIES.filter(c => !EXCLUDED_IDS.includes(c.id)).map(c => c.id);
        setEnabledSectors(defaultSectors);
      }
    }
  }, []);

  

  const toggleSector = (id: string) => {
    setEnabledSectors(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("enabled_categories", JSON.stringify(updated));
      return updated;
    });
  };

  const selectAll = () => {
    const all = CATEGORIES.map(c => c.id);
    setEnabledSectors(all);
    localStorage.setItem("enabled_categories", JSON.stringify(all));
  };

  const selectRecommended = () => {
    const recommended = CATEGORIES.filter(c => !EXCLUDED_IDS.includes(c.id)).map(c => c.id);
    setEnabledSectors(recommended);
    localStorage.setItem("enabled_categories", JSON.stringify(recommended));
  };

  const clearAll = () => {
    setEnabledSectors([]);
    localStorage.setItem("enabled_categories", JSON.stringify([]));
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return CATEGORIES;
    const term = searchTerm.toLowerCase();
    return CATEGORIES.filter(c => 
      c.label.toLowerCase().includes(term) || 
      c.group.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const groupedFilteredCategories = useMemo(() => {
    const groups: Record<string, typeof CATEGORIES> = {};
    filteredCategories.forEach(c => {
      if (!groups[c.group]) groups[c.group] = [];
      groups[c.group].push(c);
    });
    return groups;
  }, [filteredCategories]);

  // Controlla se sono selezionati Comuni, Caserme (polizia) o Parchi
  const hasExcludedSelected = useMemo(() => {
    return enabledSectors.some(s => EXCLUDED_IDS.includes(s));
  }, [enabledSectors]);

  // Se arriviamo dalla Mappa con un CAP pre-selezionato
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCap = urlParams.get("cap");
      if (urlCap) {
        // Troviamo a quale provincia e comune appartiene
        const found = lazioData.find((d: any) => d.cap.includes(urlCap));
        if (found) {
          setProvincia(found.provincia);
          setComune(found.comune);
          setCap(urlCap);
        }
      }
    }
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Derivazione liste per le tendine
  const provinceList = useMemo(() => {
    const provs = new Set(lazioData.map((d: any) => d.provincia));
    return Array.from(provs).sort();
  }, []);

  const comuniList = useMemo(() => {
    if (!provincia) return [];
    return lazioData.filter((d: any) => d.provincia === provincia).sort((a: any, b: any) => a.comune.localeCompare(b.comune));
  }, [provincia]);

  const capList = useMemo(() => {
    if (!comune) return [];
    const c = lazioData.find((d: any) => d.comune === comune && d.provincia === provincia);
    if (!c) return [];

    let caps = [...c.cap];
    
    // Ordina per distanza chilometrica dal CAP 00118
    try {
      // Usiamo un import dinamico per il file generato
      const lazioCoords = require("@/data/lazio_coords.json");
      const sedeCoords = lazioCoords["00118"];
      
      if (sedeCoords) {
        caps.sort((a, b) => {
          const coordA = lazioCoords[a];
          const coordB = lazioCoords[b];
          if (!coordA) return 1;
          if (!coordB) return -1;
          
          const distA = haversine(sedeCoords.lat, sedeCoords.lon, coordA.lat, coordA.lon);
          const distB = haversine(sedeCoords.lat, sedeCoords.lon, coordB.lat, coordB.lon);
          return distA - distB;
        });
      }
    } catch(e) {
      console.warn("Coordinate non ancora pronte");
    }

    // Separa i non cercati (sopra) dai cercati (sotto)
    const unsearched = caps.filter(cap => !searchedCaps.includes(cap));
    const searched = caps.filter(cap => searchedCaps.includes(cap));

    return [...unsearched, ...searched];
  }, [comune, provincia, searchedCaps]);

  // Autoselezione CAP se ce n'è solo 1
  useEffect(() => {
    if (capList.length === 1) {
      setCap(capList[0]);
    } else if (capList.length > 1 && !capList.includes(cap)) {
      setCap("");
    }
  }, [capList]);

  // Calcolo Statistiche per Provincia
  const provinceStats = useMemo(() => {
    const stats: Record<string, { total: number, searched: number }> = {};
    provinceList.forEach(p => {
      const capsInProv = new Set<string>();
      lazioData.filter((d: any) => d.provincia === p).forEach((d: any) => d.cap.forEach((c: string) => capsInProv.add(c)));
      let searchedInProv = 0;
      capsInProv.forEach(c => {
        if (searchedCaps.includes(c)) searchedInProv++;
      });
      stats[p] = { total: capsInProv.size, searched: searchedInProv };
    });
    return stats;
  }, [provinceList, searchedCaps]);

  const isCapSearched = cap && searchedCaps.includes(cap);

  const router = useRouter();
  const [isStartingV2, setIsStartingV2] = useState(false);

  const handleStartExtraction = async () => {
    if (!cap) {
      alert("Seleziona un CAP prima di iniziare.");
      return;
    }

    if (enabledSectors.length === 0) {
      alert("Attenzione: non hai selezionato nessun settore commerciale! Seleziona almeno un settore prima di avviare l'estrazione.");
      return;
    }

    // Assicuriamo il salvataggio in localStorage per contesti esterni
    
    localStorage.setItem("enabled_categories", JSON.stringify(enabledSectors));

    setIsStartingV2(true);
    try {
        const res = await fetch('/api/scrape/v2/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cap, source, sectors: enabledSectors })
        });
        const json = await res.json();
        if (json.success) {
            router.push(`/scrape/v2/job/${json.data.jobId}`);
        } else {
            alert("Errore avvio job: " + json.error);
            setIsStartingV2(false);
        }
    } catch (e) {
        console.error(e);
        alert("Errore avvio job v2");
        setIsStartingV2(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-white flex items-center">
        <MapIcon className="w-8 h-8 mr-3 text-emerald-400" />
        Manager Territoriale Lazio
      </h1>

      {/* BARRA PROGRESSO BATCH */}
      {batchProgress && (
        <div className="bg-gray-800 p-4 rounded-2xl border border-emerald-700/50 shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-emerald-400 flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Elaborazione Blocco {batchProgress.current} di {batchProgress.total}
            </span>
            <span className="text-sm font-mono text-gray-400">
              {Math.round((batchProgress.current / batchProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Il sistema suddivide automaticamente i settori in blocchi da 5 per evitare timeout. Attendi il completamento di tutti i blocchi.
          </p>
        </div>
      )}

      {/* DASHBOARD PROGRESSO */}
      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4">Progresso Esplorazione Province</h2>
        {statsLoading ? (
          <div className="flex items-center text-gray-400"><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Caricamento dati...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {provinceList.map(prov => {
              const s = provinceStats[prov];
              const percent = s.total > 0 ? Math.round((s.searched / s.total) * 100) : 0;
              return (
                <div key={prov} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-gray-200">{prov}</span>
                    <span className="text-xs text-emerald-400 font-mono">{percent}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {s.searched} su {s.total} CAP
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">1. Provincia</label>
            <select 
              value={provincia}
              onChange={e => { setProvincia(e.target.value); setComune(""); setCap(""); }}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Seleziona --</option>
              {provinceList.map(p => <option key={p} value={p as string}>{p as string}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">2. Comune</label>
            <select 
              value={comune}
              onChange={e => { setComune(e.target.value); setCap(""); }}
              disabled={!provincia}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              <option value="">-- Seleziona --</option>
              {comuniList.map((c: any) => <option key={c.comune} value={c.comune}>{c.comune}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">3. CAP</label>
            <select 
              value={cap}
              onChange={e => setCap(e.target.value)}
              disabled={!comune || capList.length === 0}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              <option value="">-- Seleziona CAP --</option>
              {capList.map((c: string) => {
                const isSearched = searchedCaps.includes(c);
                return (
                  <option 
                    key={c} 
                    value={c} 
                    className={isSearched ? "text-gray-500 bg-gray-800" : "text-white"}
                  >
                    {c} {isSearched ? "(Già cercato)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* ALERTS CAP GIA ESPLORATO */}
        {isCapSearched && (
          <div className="mb-6 bg-orange-500/10 border border-orange-500/50 rounded-xl p-4 flex items-start shadow-inner">
            <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-orange-400 font-bold text-sm">CAP già esplorato</h4>
              <p className="text-orange-400/80 text-xs mt-1">
                Risulta che hai già salvato aziende da questo CAP. Puoi comunque avviare la ricerca, ma il sistema probabilmente scarterà molti risultati perché già presenti in Rubrica.
              </p>
            </div>
          </div>
        )}



        
                <div className="text-xs text-gray-400 mt-1">Dati ricchi, telefoni garantiti, a pagamento</div>
              </div>
            </label>
            <label className={`flex-1 flex items-center p-4 border rounded-xl cursor-pointer transition-all ${source === 'osm' ? 'border-emerald-500 bg-emerald-500/10 shadow-inner' : 'border-gray-700 bg-gray-900 hover:border-gray-600'}`}>
              <input type="radio" name="source" value="osm" checked={source === 'osm'} onChange={() => setSource('osm')} className="hidden" />
              <div className="ml-2">
                <div className="font-bold text-white">OpenStreetMap</div>
                <div className="text-xs text-gray-400 mt-1">100% Gratuito, veloce, telefoni non garantiti</div>
              </div>
            </label>
          </div>
        </div>

        {/* CONTROLLO SETTORI DINAMICO IN PAGINA */}
        <div className="mb-8 border border-gray-700 rounded-xl overflow-hidden bg-gray-900/30">
          <button 
            type="button"
            onClick={() => setIsSectorsExpanded(!isSectorsExpanded)}
            className="w-full flex justify-between items-center p-4 bg-gray-800 hover:bg-gray-800/80 text-white font-medium transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-200">Settori Commerciali di Ricerca</span>
              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-mono">
                {enabledSectors.length} selezionati
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">{isSectorsExpanded ? "Nascondi" : "Configura"}</span>
              {isSectorsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {isSectorsExpanded && (
            <div className="p-4 border-t border-gray-700 bg-gray-900/50 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Azioni rapide */}
                <div className="flex flex-wrap gap-2">
                  <button 
                    type="button" 
                    onClick={selectRecommended} 
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/30 rounded-lg transition"
                  >
                    Tutti tranne esclusi (Consigliato)
                  </button>
                  <button 
                    type="button" 
                    onClick={selectAll} 
                    className="px-2.5 py-1 text-xs font-semibold bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-500/20 rounded-lg transition"
                  >
                    Includi Comuni/Parchi/Forze Ordine
                  </button>
                  <button 
                    type="button" 
                    onClick={clearAll} 
                    className="px-2.5 py-1 text-xs font-semibold bg-red-900/20 hover:bg-red-900/40 text-red-300 border border-red-500/20 rounded-lg transition"
                  >
                    Azzera
                  </button>
                </div>

                {/* Cerca settore */}
                <div className="relative flex-1 max-w-xs">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-500" />
                  </span>
                  <input
                    type="text"
                    placeholder="Cerca settore..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Avviso Esclusi */}
              {hasExcludedSelected && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start">
                  <ShieldAlert className="w-4 h-4 text-yellow-500 mt-0.5 mr-2.5 flex-shrink-0" />
                  <p className="text-[11px] text-yellow-500 leading-relaxed">
                    <strong>Attenzione:</strong> Hai incluso Municipii, Forze dell'Ordine o Parchi Pubblici. Google potrebbe includere enti pubblici e istituzioni che non sono target commerciali.
                  </p>
                </div>
              )}

              {/* Griglia Settori */}
              <div className="max-h-60 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-800">
                {Object.entries(groupedFilteredCategories).map(([group, sectors]) => (
                  <div key={group} className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">{group}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {sectors.map(sector => {
                        const isSelected = enabledSectors.includes(sector.id);
                        const isExcludedByDefault = EXCLUDED_IDS.includes(sector.id);
                        return (
                          <label
                            key={sector.id}
                            className={`flex items-center p-2 rounded-lg border text-left cursor-pointer transition-all select-none ${
                              isSelected
                                ? isExcludedByDefault
                                  ? 'bg-yellow-950/20 border-yellow-500/40 text-yellow-300'
                                  : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                                : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSector(sector.id)}
                              className="hidden"
                            />
                            <div className={`w-4 h-4 rounded flex items-center justify-center mr-2 flex-shrink-0 ${
                              isSelected 
                                ? isExcludedByDefault ? 'bg-yellow-600' : 'bg-emerald-600' 
                                : 'bg-gray-900 border border-gray-700'
                            }`}>
                              {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="text-xs truncate">{sector.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filteredCategories.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4">Nessun settore corrisponde alla ricerca.</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleStartExtraction}
          disabled={isStartingV2 || !cap}
          className="w-full flex justify-center items-center py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
        >
          {isStartingV2 ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
          {isStartingV2 ? "Avvio motore..." : "Avvia Motore di Ricerca (V2)"}
        </button>
      </div>

      <div className="bg-gray-950 rounded-2xl border border-gray-800 p-4 h-96 overflow-hidden flex flex-col font-mono text-sm shadow-inner relative">
        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-gray-950 to-transparent z-10"></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1 relative z-0">
          {logs.map((log, i) => (
            <div key={i} className={`${log.includes('ERRORE') || log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : 'text-gray-400'}`}>
              {log || <br/>}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}

