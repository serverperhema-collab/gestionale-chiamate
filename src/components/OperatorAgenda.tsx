"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Phone, AlertCircle } from "lucide-react";

interface OperatorAgendaProps {
  trattative: any[];
  onOpenTimeline: (id: string) => void;
}

export default function OperatorAgenda({ trattative, onOpenTimeline }: OperatorAgendaProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter valid recalls for the operator
  const recalls = trattative.filter(st => 
    !st.currentCommercialeId && 
    (st.status === 'RICHIAMO_PERSONALE' || st.nextActionType === 'RICHIAMO') &&
    st.nextActionDate
  );

  // Group by date (YYYY-MM-DD)
  const groupedRecalls: Record<string, any[]> = {};
  recalls.forEach(st => {
    const d = new Date(st.nextActionDate);
    const dateKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(d);
    if (!groupedRecalls[dateKey]) groupedRecalls[dateKey] = [];
    groupedRecalls[dateKey].push(st);
  });

  // Sort within each day by time
  Object.keys(groupedRecalls).forEach(key => {
    groupedRecalls[key].sort((a, b) => new Date(a.nextActionDate).getTime() - new Date(b.nextActionDate).getTime());
  });

  const changeDay = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d);
  };

  const setToday = () => setCurrentDate(new Date());

  const dateKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(currentDate);
  const todaysRecalls = groupedRecalls[dateKey] || [];

  const dateFormatter = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-full min-h-[600px] w-full">
      {/* Header Toolbar */}
      <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-600/20 p-2 rounded-lg border border-indigo-500/30">
            <CalendarIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white capitalize">{dateFormatter.format(currentDate)}</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setToday()}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg border border-gray-700 transition"
          >
            Oggi
          </button>
          <div className="flex bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <button 
              onClick={() => changeDay(-1)}
              className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-px bg-gray-700"></div>
            <button 
              onClick={() => changeDay(1)}
              className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Agenda Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-black relative">
        {/* Timeline Line */}
        <div className="absolute left-14 top-0 bottom-0 w-px bg-gray-800"></div>

        {todaysRecalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-60 pt-20">
            <CalendarIcon className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-400">Nessun richiamo in agenda</h3>
            <p className="text-gray-500 text-sm mt-2">Goditi la pausa o seleziona un altro giorno.</p>
          </div>
        ) : (
          <div className="space-y-6 relative">
            {todaysRecalls.map((st, idx) => {
              const d = new Date(st.nextActionDate);
              const timeStr = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
              const isPast = d < new Date();

              return (
                <div 
                  key={st.id} 
                  className="flex items-start group cursor-pointer"
                  onClick={() => onOpenTimeline(st.id)}
                >
                  {/* Time Axis */}
                  <div className="w-20 shrink-0 text-right pr-6 relative py-3">
                    <span className={`text-lg font-bold ${isPast ? 'text-red-400' : 'text-gray-300'}`}>{timeStr}</span>
                    {/* Timeline Dot */}
                    <div className={`absolute right-[-5px] top-4 w-3 h-3 rounded-full border-2 border-black ${isPast ? 'bg-red-500' : 'bg-indigo-500 group-hover:scale-125 transition-transform'}`}></div>
                  </div>

                  {/* Card */}
                  <div className="flex-1 ml-6 bg-gray-900 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-4 shadow-sm group-hover:shadow-indigo-500/10 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">
                        {st.contact?.name || "Contatto Sconosciuto"}
                      </h4>
                      {isPast && (
                        <span className="flex items-center text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          IN RITARDO
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-gray-400 text-sm mb-3">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      {st.contact?.originalPhone || "Nessun numero"}
                      <span className="mx-3 text-gray-700">•</span>
                      <span>{st.contact?.cap || "No CAP"}</span>
                    </div>

                    {st.outcomeNotes && (
                      <div className="text-sm text-gray-300 bg-gray-800 rounded p-3 italic border border-gray-700">
                        "{st.outcomeNotes}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
