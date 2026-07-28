"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Search, Database, ArrowLeft, DownloadCloud, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface ExtractionResult {
  found: number;
  saved: number;
  duplicates: number;
}

export default function ExtractionPage() {
  const [cap, setCap] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ExtractionResult | null>(null);

  const handleExtraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cap || !keyword) {
      toast.error("Inserisci CAP e Keyword");
      return;
    }

    setLoading(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cap, keyword })
      });

      const data = await res.json();

      if (res.ok) {
        setLastResult(data.results);
        if (data.results.saved > 0) {
          toast.success(`${data.results.saved} aziende salvate nel calderone!`);
        } else if (data.results.duplicates > 0) {
          toast.success("Ricerca completata, ma erano tutti doppioni già nel DB.");
        } else {
          toast.error("Nessun risultato trovato da Google.");
        }
      } else {
        toast.error(data.error || "Errore durante l'estrazione");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-950 text-gray-100 p-8">
      <div className="mb-8 flex items-center space-x-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-white flex items-center">
            <DownloadCloud className="w-6 h-6 mr-3 text-blue-400" />
            Popolamento Massivo (Google Maps)
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Cerca aziende tramite Google Places API e inseriscile automaticamente nel Calderone.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form di Ricerca */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-xl">
          <form onSubmit={handleExtraction} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">CAP di Ricerca</label>
              <input
                type="text"
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                placeholder="Es. 00100"
                required
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Keyword / Settore</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Es. Ristoranti, Imprese di pulizia, Dentisti..."
                required
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start">
                <Search className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-blue-200">
                  Il sistema cercherà su Google: <strong>"{keyword} cap {cap || '...'} italia"</strong>. I risultati passeranno dal filtro anti-doppione prima di essere salvati.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Estrazione in corso... (potrebbe richiedere alcuni secondi)
                </>
              ) : (
                <>
                  <DownloadCloud className="w-5 h-5 mr-2" />
                  Estrai da Google Maps
                </>
              )}
            </button>
          </form>
        </div>

        {/* Risultati */}
        <div>
          {lastResult ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gray-900/50 p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Risultati Estrazione</h3>
              </div>
              <div className="p-6 space-y-6">
                
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="flex items-center text-gray-300">
                    <Search className="w-5 h-5 mr-3 text-gray-500" />
                    Aziende Trovate da Google
                  </div>
                  <span className="text-2xl font-bold text-white">{lastResult.found}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="flex items-center text-gray-300">
                    <AlertTriangle className="w-5 h-5 mr-3 text-yellow-500" />
                    Doppioni Scartati (Già nel DB)
                  </div>
                  <span className="text-2xl font-bold text-yellow-500">{lastResult.duplicates}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-emerald-900/20 rounded-lg border border-emerald-500/30 relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-emerald-500/10 to-transparent"></div>
                  <div className="flex items-center text-emerald-100 z-10">
                    <CheckCircle2 className="w-6 h-6 mr-3 text-emerald-400" />
                    <span className="text-lg font-medium">Aziende Vergini Salvate</span>
                  </div>
                  <span className="text-4xl font-black text-emerald-400 z-10">{lastResult.saved}</span>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 shadow-xl h-full flex flex-col items-center justify-center text-center text-gray-500">
              <Database className="w-16 h-16 mb-4 text-gray-600 opacity-50" />
              <p className="text-lg">Nessuna estrazione effettuata.</p>
              <p className="text-sm mt-2">Compila il modulo a sinistra per riempire il calderone.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
