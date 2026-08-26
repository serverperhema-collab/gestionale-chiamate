"use client";
import React, { createContext, useContext, useState, useRef, useEffect } from "react";

interface ExtractionContextType {
  logs: string[];
  isExtracting: boolean;
  startExtraction: (cap: string, source: string, enabledCategories: string[], comune: string, provincia: string) => void;
  searchedCaps: string[];
  setSearchedCaps: React.Dispatch<React.SetStateAction<string[]>>;
  batchProgress: { current: number; total: number } | null;
}

const ExtractionContext = createContext<ExtractionContextType | undefined>(undefined);

const BATCH_SIZE = 5; // Numero di settori per ogni singola chiamata al server

export function ExtractionProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<string[]>(["Il motore è pronto. Inserisci CAP e premi Avvia."]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [searchedCaps, setSearchedCaps] = useState<string[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => { if (data.caps) setSearchedCaps(data.caps); })
      .catch(() => {});
  }, []);

  const runBatch = (cap: string, source: string, categories: string[], customApiKey: string): Promise<void> => {
    return new Promise((resolve) => {
      if (abortRef.current) { resolve(); return; }

      const categoriesParam = categories.join(',');
      const url = `/api/scrape?cap=${encodeURIComponent(cap)}&source=${source}&apikey=${customApiKey}&categories=${categoriesParam}`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        if (abortRef.current) { eventSource.close(); resolve(); return; }
        if (event.data === "[DONE]") {
          eventSource.close();
          resolve();
          return;
        }
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.message) {
            setLogs(prev => [...prev, parsed.message]);
          }
        } catch (e) {}
      };

      eventSource.onerror = () => {
        eventSource.close();
        if (!abortRef.current) {
          setLogs(prev => [...prev, `⚠️ Batch completato (${categories.length} settori)`]);
        }
        resolve(); // Continua al prossimo batch anche in caso di errore
      };
    });
  };

  const startExtraction = async (cap: string, source: string, enabledCategories: string[], comune: string, provincia: string) => {
    if (isExtracting) return;
    setIsExtracting(true);
    abortRef.current = false;

    // Dividi i settori in batch da BATCH_SIZE
    const batches: string[][] = [];
    for (let i = 0; i < enabledCategories.length; i += BATCH_SIZE) {
      batches.push(enabledCategories.slice(i, i + BATCH_SIZE));
    }
    const totalBatches = batches.length;

    setLogs([
      "--- INIZIO NUOVA ESTRAZIONE (modalità batch) ---",
      `Parametri: CAP ${cap} (${comune}, ${provincia})`,
      `Categorie selezionate: ${enabledCategories.length} settori in ${totalBatches} blocchi da ${BATCH_SIZE}`,
      `Sorgente: ${source === 'google' ? 'Google Maps' : 'OpenStreetMap'}`,
      "Avvio elaborazione blocchi...",
      ""
    ]);
    setBatchProgress({ current: 0, total: totalBatches });

    for (let i = 0; i < batches.length; i++) {
      if (abortRef.current) break;
      const batch = batches[i];
      setBatchProgress({ current: i + 1, total: totalBatches });
      setLogs(prev => [...prev, `🔄 Blocco ${i + 1}/${totalBatches}: ${batch.join(', ')}`]);
      const customApiKey = localStorage.getItem('custom_google_api_key') || '';
      await runBatch(cap, source, batch, customApiKey);
    }

    setIsExtracting(false);
    setBatchProgress(null);
    if (!abortRef.current) {
      setSearchedCaps(prev => prev.includes(cap) ? prev : [...prev, cap]);
      setLogs(prev => [...prev, "", "✅ ESTRAZIONE COMPLETATA CON SUCCESSO!"]);
    } else {
      setLogs(prev => [...prev, "", "⛔ Estrazione interrotta."]);
    }
  };

  return (
    <ExtractionContext.Provider value={{ logs, isExtracting, startExtraction, searchedCaps, setSearchedCaps, batchProgress }}>
      {children}
    </ExtractionContext.Provider>
  );
}

export function useExtraction() {
  const context = useContext(ExtractionContext);
  if (!context) throw new Error("useExtraction must be used within an ExtractionProvider");
  return context;
}
