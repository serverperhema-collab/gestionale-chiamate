"use client";
import { useState, useEffect } from "react";
import { Settings, Save, CheckSquare, Square, X } from "lucide-react";

const SECTORS = [
  { id: "ristoranti", label: "Ristoranti e Pizzerie", default: true },
  { id: "alberghi", label: "Alberghi e B&B", default: true },
  { id: "bar", label: "Bar e Caffetterie", default: true },
  { id: "abbigliamento", label: "Negozi di Abbigliamento", default: true },
  { id: "estetica", label: "Parrucchieri e Centri Estetici", default: true },
  { id: "imbianchini", label: "Imprese Edili e Artigiani", default: true },
  { id: "agenzie_immobiliari", label: "Agenzie Immobiliari", default: true },
  { id: "avvocati", label: "Studi Legali", default: true },
  { id: "commercialisti", label: "Commercialisti", default: true },
  { id: "medici", label: "Studi Medici e Dentisti", default: true },
  { id: "meccanici", label: "Meccanici e Carrozzerie", default: true },
  { id: "palestre", label: "Palestre e Centri Sportivi", default: true },
  { id: "supermercati", label: "Supermercati e Alimentari", default: true },
  { id: "farmacie", label: "Farmacie", default: true },
  
  // Da escludere di default
  { id: "parchi_pubblici", label: "Parchi Pubblici", default: false },
  { id: "attrazioni", label: "Attrazioni Pubbliche e Musei", default: false },
  { id: "comuni", label: "Municipi e Uffici Comunali", default: false },
  { id: "polizia", label: "Polizia, Carabinieri e Forze dell'Ordine", default: false },
  { id: "vigili_fuoco", label: "Vigili del Fuoco", default: false },
  { id: "stazioni_treno", label: "Stazioni Ferroviarie e Aeroporti", default: false },
  { id: "scuole", label: "Scuole Pubbliche", default: false },
];

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [enabledSectors, setEnabledSectors] = useState<string[]>([]);

  useEffect(() => {
    const storedKey = localStorage.getItem('custom_google_api_key');
    if (storedKey) setApiKey(storedKey);

    const storedCategories = localStorage.getItem('enabled_categories');
    if (storedCategories) {
      try {
        setEnabledSectors(JSON.parse(storedCategories));
      } catch (e) {
        setEnabledSectors(SECTORS.filter(s => s.default).map(s => s.id));
      }
    } else {
      // Se non c'è nulla salvato, imposta i default
      setEnabledSectors(SECTORS.filter(s => s.default).map(s => s.id));
    }
  }, []);

  const saveSettings = () => {
    if (apiKey.trim()) {
      localStorage.setItem('custom_google_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('custom_google_api_key');
    }
    
    localStorage.setItem('enabled_categories', JSON.stringify(enabledSectors));

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleSector = (id: string) => {
    setEnabledSectors(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
    setSaved(false);
  };

  const selectAll = () => {
    setEnabledSectors(SECTORS.map(s => s.id));
    setSaved(false);
  };

  const selectRecommended = () => {
    setEnabledSectors(SECTORS.filter(s => s.default).map(s => s.id));
    setSaved(false);
  };

  const clearAll = () => {
    setEnabledSectors([]);
    setSaved(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Settings className="w-8 h-8 mr-3 text-gray-400" />
          Impostazioni Sistema
        </h1>
        <button 
          onClick={saveSettings}
          className={`flex items-center px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${saved ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}
        >
          <Save className="w-5 h-5 mr-2" />
          {saved ? "Impostazioni Salvate!" : "Salva Impostazioni"}
        </button>
      </div>

      {/* SEZIONE SETTORI ESTRAZIONE */}
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Settori di Estrazione</h2>
            <p className="text-sm text-gray-400 mt-1">
              Seleziona quali categorie commerciali cercare quando avvii l'estrazione dalla Mappa.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={selectRecommended} className="px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
              Consigliati (No Pubblico)
            </button>
            <button onClick={selectAll} className="px-3 py-1.5 text-xs font-medium bg-blue-900/50 hover:bg-blue-800 text-blue-200 border border-blue-500/30 rounded-lg transition flex items-center">
              <CheckSquare className="w-3 h-3 mr-1.5" /> Seleziona Tutti
            </button>
            <button onClick={clearAll} className="px-3 py-1.5 text-xs font-medium bg-red-900/30 hover:bg-red-800/50 text-red-300 border border-red-500/30 rounded-lg transition flex items-center">
              <X className="w-3 h-3 mr-1.5" /> Azzera
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SECTORS.map(sector => {
            const isSelected = enabledSectors.includes(sector.id);
            const isDanger = !sector.default; // Evidenzia in modo diverso le istituzioni
            return (
              <label 
                key={sector.id} 
                className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected 
                    ? isDanger 
                      ? 'bg-orange-900/20 border-orange-500/50 text-orange-200' 
                      : 'bg-emerald-900/20 border-emerald-500/50 text-emerald-200' 
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => toggleSector(sector.id)}
                  className="hidden" 
                />
                <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 ${isSelected ? (isDanger ? 'bg-orange-500' : 'bg-emerald-500') : 'bg-gray-800 border border-gray-600'}`}>
                  {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                </div>
                <span className="font-medium text-sm">{sector.label}</span>
                {isDanger && isSelected && <span className="ml-auto text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded uppercase font-bold">Incluso</span>}
              </label>
            );
          })}
        </div>
      </div>

      {/* SEZIONE CHIAVE API */}
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
        <h2 className="text-lg font-bold text-white">Chiave Google Maps API (Opzionale)</h2>
        <p className="text-sm text-gray-400 mt-1 mb-4">
          Inserisci una tua chiave API personale per fatturare i contatti direttamente sul tuo account Google Cloud. Se lasci vuoto, verrà usata la chiave predefinita.
        </p>
        <input 
          type="password" 
          value={apiKey} 
          onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
          placeholder="es. AIzaSyD..." 
          className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
        />
      </div>
    </div>
  );
}
