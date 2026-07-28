"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { Play, Loader2, Map as MapIcon, AlertTriangle, CheckCircle2 } from "lucide-react";
import lazioData from "@/data/lazio_caps.json";
import { useExtraction } from "../ExtractionContext";

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
  const { logs, isExtracting, startExtraction: startGlobalExtraction, searchedCaps } = useExtraction();
  const [cap, setCap] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState("google");

  // Nuovi stati per la selezione a cascata
  const [provincia, setProvincia] = useState("");
  const [comune, setComune] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);

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

  const handleStartExtraction = () => {
    if (!cap) {
      alert("Seleziona un CAP prima di iniziare.");
      return;
    }
    
    let enabledCategories: string[] = [];
    const stored = localStorage.getItem('enabled_categories');
    if (stored) {
      try {
        enabledCategories = JSON.parse(stored);
      } catch (e) {}
    }

    if (enabledCategories.length === 0) {
      alert("Attenzione: non hai selezionato nessuna categoria! Vai in Impostazioni per spuntare i settori che ti interessano.");
      return;
    }

    startGlobalExtraction(cap, source, enabledCategories, comune, provincia);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-white flex items-center">
        <MapIcon className="w-8 h-8 mr-3 text-emerald-400" />
        Manager Territoriale Lazio
      </h1>

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



        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-400 mb-3">Sorgente Dati</label>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className={`flex-1 flex items-center p-4 border rounded-xl cursor-pointer transition-all ${source === 'google' ? 'border-blue-500 bg-blue-500/10 shadow-inner' : 'border-gray-700 bg-gray-900 hover:border-gray-600'}`}>
              <input type="radio" name="source" value="google" checked={source === 'google'} onChange={() => setSource('google')} className="hidden" />
              <div className="ml-2">
                <div className="font-bold text-white">Google Maps API</div>
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
        
        <button 
          onClick={handleStartExtraction}
          disabled={isExtracting || !cap}
          className="w-full flex justify-center items-center py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
        >
          {isExtracting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
          {isExtracting ? "Estrazione in corso..." : "Avvia Motore di Ricerca"}
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
