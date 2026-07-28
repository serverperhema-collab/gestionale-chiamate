"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import lazioData from "@/data/lazio_caps.json";

// Importazione dinamica del componente mappa per evitare errori "window is not defined" lato server
const CoverageMap = dynamic(() => import("../components/CoverageMap"), { ssr: false });

interface DashboardClientProps {
  searchedCaps: string[];
}

export default function DashboardClient({ searchedCaps }: DashboardClientProps) {
  const provinces = ["Roma", "Latina", "Frosinone", "Viterbo", "Rieti"];
  const [activeTab, setActiveTab] = useState("Roma");

  // Calcola statistiche per la provincia attiva
  const activeProvinceCaps = new Set<string>();
  lazioData.forEach((d: any) => {
    if (d.provincia === activeTab) {
      d.cap.forEach((c: string) => activeProvinceCaps.add(c));
    }
  });

  const totalInProvince = activeProvinceCaps.size;
  let searchedInProvince = 0;
  activeProvinceCaps.forEach(c => {
    if (searchedCaps.includes(c)) searchedInProvince++;
  });

  const percent = totalInProvince > 0 ? Math.round((searchedInProvince / totalInProvince) * 100) : 0;

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl mt-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white mb-4 md:mb-0">Radar Territoriale: {activeTab}</h2>
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
          {provinces.map(p => (
            <button
              key={p}
              onClick={() => setActiveTab(p)}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === p ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-medium text-gray-400">Copertura territoriale</span>
          <span className="text-2xl font-bold text-emerald-400">{percent}%</span>
        </div>
        <div className="w-full bg-gray-900 rounded-full h-3 border border-gray-700">
          <div className="bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${percent}%` }}></div>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-right">
          {searchedInProvince} su {totalInProvince} CAP esplorati
        </div>
      </div>

      <div className="relative">
        {/* Il componente mappa è pesante e interagisce con il DOM, viene renderizzato solo lato client */}
        <CoverageMap provinceName={activeTab} searchedCaps={searchedCaps} />
      </div>
    </div>
  );
}
