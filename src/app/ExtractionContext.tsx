"use client";
import React, { createContext, useContext, useState, useRef, useEffect } from "react";

interface ExtractionContextType {
  logs: string[];
  isExtracting: boolean;
  startExtraction: (cap: string, source: string, enabledCategories: string[], comune: string, provincia: string) => void;
  searchedCaps: string[];
  setSearchedCaps: React.Dispatch<React.SetStateAction<string[]>>;
}

const ExtractionContext = createContext<ExtractionContextType | undefined>(undefined);

export function ExtractionProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<string[]>(["Il motore è pronto. Inserisci CAP e premi Avvia."]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [searchedCaps, setSearchedCaps] = useState<string[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Carica i CAP esplorati una sola volta all'avvio globale
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.caps) setSearchedCaps(data.caps);
      })
      .catch(() => {});
  }, []);

  const startExtraction = (cap: string, source: string, enabledCategories: string[], comune: string, provincia: string) => {
    if (isExtracting) return;
    setIsExtracting(true);
    setLogs([
        "--- INIZIO NUOVA ESTRAZIONE ---", 
        `Parametri: CAP ${cap} (${comune}, ${provincia})`, 
        `Categorie selezionate: ${enabledCategories.length} settori`,
        `Sorgente: ${source === 'google' ? 'Google Maps' : 'OpenStreetMap'}`,
        "Attendo connessione ai server...",
        ""
    ]);

    try {
      const customApiKey = localStorage.getItem('custom_google_api_key') || '';
      const eventSource = new EventSource(`/api/scrape?cap=${encodeURIComponent(cap)}&source=${source}&apikey=${customApiKey}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        if (event.data === "[DONE]") {
          eventSource.close();
          eventSourceRef.current = null;
          setIsExtracting(false);
          setLogs(prev => [...prev, "", "✅ ESTRAZIONE COMPLETATA CON SUCCESSO!"]);
          setSearchedCaps(prev => prev.includes(cap) ? prev : [...prev, cap]);
          return;
        }
        try {
            const parsed = JSON.parse(event.data);
            if (parsed.message) {
                setLogs(prev => [...prev, parsed.message]);
            }
        } catch(e) {}
      };

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
        setIsExtracting(false);
        setLogs(prev => [...prev, "❌ Errore o fine inaspettata dello stream."]);
      };
    } catch (error) {
      setIsExtracting(false);
      setLogs(prev => [...prev, "❌ Impossibile avviare la richiesta."]);
    }
  };

  return (
    <ExtractionContext.Provider value={{ logs, isExtracting, startExtraction, searchedCaps, setSearchedCaps }}>
      {children}
    </ExtractionContext.Provider>
  );
}

export function useExtraction() {
  const context = useContext(ExtractionContext);
  if (!context) throw new Error("useExtraction must be used within an ExtractionProvider");
  return context;
}
