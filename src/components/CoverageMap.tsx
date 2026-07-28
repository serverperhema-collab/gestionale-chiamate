"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import lazioData from "@/data/lazio_caps.json";
import coordsData from "@/data/lazio_coords.json";

interface CoverageMapProps {
  searchedCaps: string[];
  provinceName: string;
}

export default function CoverageMap({ searchedCaps, provinceName }: CoverageMapProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[400px] bg-gray-900 rounded-xl flex items-center justify-center border border-gray-700 animate-pulse text-gray-500">Inizializzazione Radar...</div>;

  // Trova tutti i CAP della provincia selezionata
  const provinceCaps: string[] = [];
  lazioData.forEach((d: { provincia: string; cap: string[] }) => {
    if (d.provincia === provinceName) {
      d.cap.forEach((c: string) => provinceCaps.push(c));
    }
  });

  // Centro di default in base alla provincia
  const centers: Record<string, [number, number]> = {
    "Roma": [41.9028, 12.4964],
    "Latina": [41.4676, 12.9038],
    "Frosinone": [41.6406, 13.3382],
    "Viterbo": [42.4207, 12.1077],
    "Rieti": [42.4048, 12.8624]
  };
  const defaultCenter = centers[provinceName] || [41.9, 12.5];

  // Map settings
  const zoomLevel = provinceName === "Roma" ? 10 : 9;

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-700 shadow-xl relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={zoomLevel} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }} // Dark bg
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {provinceCaps.map(cap => {
          const coords = (coordsData as Record<string, { lat: number; lon: number }>)[cap];
          if (!coords || !coords.lat) return null;

          const isSearched = searchedCaps.includes(cap);
          const color = isSearched ? "#10b981" : "#ef4444"; // Emerald per esplorati, Red per non esplorati
          const radius = isSearched ? 10 : 6;
          const opacity = isSearched ? 0.9 : 0.4;
          const fillOpacity = isSearched ? 0.6 : 0.2;

          return (
            <CircleMarker
              key={cap}
              center={[coords.lat, coords.lon]}
              pathOptions={{ 
                color: color, 
                fillColor: color, 
                fillOpacity: fillOpacity, 
                weight: 2, 
                opacity: opacity 
              }}
              radius={radius}
              eventHandlers={{
                click: () => {
                  router.push(`/extract?cap=${cap}`);
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="font-bold text-gray-900">CAP {cap}</div>
                <div className="text-xs text-gray-600">{isSearched ? "✅ Esplorato" : "❌ Da esplorare"}</div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
