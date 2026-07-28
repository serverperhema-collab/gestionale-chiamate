"use client";
import { useState, useEffect } from "react";
import { Settings, Save } from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('custom_google_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const saveSettings = () => {
    if (apiKey.trim()) {
      localStorage.setItem('custom_google_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('custom_google_api_key');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Settings className="w-8 h-8 mr-3 text-gray-400" />
          Impostazioni Avanzate
        </h1>
        <button 
          onClick={saveSettings}
          className={`flex items-center px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${saved ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}
        >
          <Save className="w-5 h-5 mr-2" />
          {saved ? "Impostazioni Salvate!" : "Salva Impostazioni"}
        </button>
      </div>

      {/* SEZIONE CHIAVE API */}
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
        <h2 className="text-lg font-bold text-white">Chiave Google Maps API (Opzionale)</h2>
        <p className="text-sm text-gray-400 mt-1 mb-4">
          Inserisci una tua chiave API personale per fatturare i contatti direttamente sul tuo account Google Cloud o quello di un tuo cliente. Se lasci vuoto, verrà usata la chiave predefinita del sistema.
        </p>
        <input 
          type="password" 
          value={apiKey} 
          onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
          placeholder="es. AIzaSyD..." 
          className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
        />
      </div>
      
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
        <h2 className="text-lg font-bold text-white">Filtri di Estrazione Globale</h2>
        <p className="text-sm text-gray-400 mt-1">
          L'estrazione globale è attualmente attiva. Il gestionale eseguirà una scansione massiva automatica per estrarre qualsiasi tipologia di azienda e attività presente nel CAP, aggirando i limiti di paginazione di Google. 
          Verranno scartati in automatico solo: forze dell'ordine, municipi, caserme, parchi pubblici, aeroporti, stazioni, e vigili del fuoco.
        </p>
      </div>
    </div>
  );
}
