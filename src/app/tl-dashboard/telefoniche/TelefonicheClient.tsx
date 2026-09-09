"use client";

import { useState } from "react";
import TrattativeTable from "@/components/TL/TrattativeTable";

export default function TelefonicheClient() {
  const [activeTab, setActiveTab] = useState<"IN_GESTIONE" | "KO">("IN_GESTIONE");

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto h-[85vh] flex flex-col">
        <div className="flex bg-gray-900 border border-gray-700 rounded-lg p-1 mb-6 shrink-0 w-fit">
          <button 
            onClick={() => setActiveTab("IN_GESTIONE")}
            className={`px-6 py-2.5 text-sm font-bold rounded-md transition ${activeTab === "IN_GESTIONE" ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-gray-200"}`}
          >
            IN GESTIONE
          </button>
          <button 
            onClick={() => setActiveTab("KO")}
            className={`px-6 py-2.5 text-sm font-bold rounded-md transition ${activeTab === "KO" ? "bg-red-600 text-white shadow-md" : "text-gray-400 hover:text-gray-200"}`}
          >
            KO
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <TrattativeTable 
            type="telefonica" 
            stateGroup={activeTab} 
            title={activeTab === "IN_GESTIONE" ? "Trattative Telefoniche in Gestione" : "Trattative Telefoniche Perse (KO)"}
          />
        </div>
      </div>
    </main>
  );
}
