"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone, AlertCircle, Clock } from "lucide-react";

interface AgendaViewProps {
  trattative: any[];
  onOpenTimeline: (id: string) => void;
}

export default function AgendaView({ trattative, onOpenTimeline }: AgendaViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter ONLY items that actually have a nextActionDate (safety check)
  const recalls = trattative.filter(st => st.nextActionDate);

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

  // Calculate start of week (Monday)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const startOfWeek = getStartOfWeek(currentDate);
  
  // Generate the 7 days of the week
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const endOfWeek = weekDays[6];

  const changeWeek = (weeks: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + weeks * 7);
    setCurrentDate(d);
  };

  const setToday = () => setCurrentDate(new Date());

  const monthFormatter = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' });
  const dayNameFormatter = new Intl.DateTimeFormat('it-IT', { weekday: 'short' });

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-full min-h-[600px] w-full">
      {/* Header Toolbar */}
      <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-600/20 p-2 rounded-lg border border-indigo-500/30">
            <CalendarIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white capitalize">
            {startOfWeek.getDate()} - {endOfWeek.getDate()} {monthFormatter.format(startOfWeek)}
          </h2>
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
              onClick={() => changeWeek(-1)}
              className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-px bg-gray-700"></div>
            <button 
              onClick={() => changeWeek(1)}
              className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Agenda Content (Weekly Grid) */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-black p-4">
        <div className="flex h-full gap-4 min-w-[1200px]">
          {weekDays.map((day, idx) => {
            const dateKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(day);
            const isToday = dateKey === new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
            const dayRecalls = groupedRecalls[dateKey] || [];

            return (
              <div key={dateKey} className="flex-1 flex flex-col h-full bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
                {/* Day Header */}
                <div className={`p-3 text-center border-b ${isToday ? 'bg-indigo-900/40 border-indigo-500/30' : 'bg-gray-900 border-gray-800'}`}>
                  <div className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-indigo-400' : 'text-gray-500'}`}>
                    {dayNameFormatter.format(day)}
                  </div>
                  <div className={`text-2xl font-black ${isToday ? 'text-indigo-300' : 'text-gray-300'}`}>
                    {day.getDate()}
                  </div>
                  <div className="mt-1 flex justify-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${dayRecalls.length > 0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-800 text-gray-500'}`}>
                      {dayRecalls.length} event{dayRecalls.length === 1 ? 'o' : 'i'}
                    </span>
                  </div>
                </div>

                {/* Day Content */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {dayRecalls.map((st) => {
                    const d = new Date(st.nextActionDate);
                    const timeStr = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                    const isPast = d < new Date();
                    
                    let statusColor = "border-gray-700 bg-gray-800 text-gray-300";
                    if (st.status === 'APPUNTAMENTO') statusColor = "border-blue-500/50 bg-blue-900/20 text-blue-300";
                    if (st.status === 'RICHIAMO_PERSONALE') statusColor = "border-purple-500/50 bg-purple-900/20 text-purple-300";
                    if (st.status === 'CHIUSA_PERSA') statusColor = "border-red-500/50 bg-red-900/20 text-red-400 opacity-60";

                    return (
                      <div 
                        key={st.id} 
                        onClick={() => onOpenTimeline(st.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all hover:bg-gray-700 group relative overflow-hidden ${statusColor}`}
                      >
                        {st.status === 'CHIUSA_PERSA' && (
                          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9InRyYW5zcGFyZW50Ii8+PHBhdGggZD0iTTAgNEw0IDBaIiBzdHJva2U9InJnYmEoMjU1LCAwLCAwLCAwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] pointer-events-none" />
                        )}
                        <div className="flex justify-between items-start mb-1.5 relative z-10">
                          <div className="flex items-center text-xs font-black">
                            <Clock className="w-3 h-3 mr-1 opacity-70" />
                            <span className={isPast && st.status !== 'CHIUSA_PERSA' ? 'text-red-400' : ''}>{timeStr}</span>
                            {st.status === 'CHIUSA_PERSA' && <span className="ml-2 px-1 text-[9px] bg-red-500/30 rounded text-red-200">ANNULLATO</span>}
                          </div>
                          {isPast && st.status !== 'CHIUSA_PERSA' && (
                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          )}
                        </div>
                        
                        <div className={`font-bold text-sm text-white truncate mb-1 relative z-10 ${st.status === 'CHIUSA_PERSA' ? 'line-through opacity-70' : ''}`} title={st.contact?.name}>
                          {st.contact?.name || "Sconosciuto"}
                        </div>
                        
                        <div className="flex items-center text-xs opacity-70 truncate relative z-10">
                          <Phone className="w-3 h-3 mr-1" />
                          {st.contact?.originalPhone || "No numero"}
                        </div>
                      </div>
                    );
                  })}
                  
                  {dayRecalls.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 p-4 text-center">
                      <p className="text-xs font-bold mt-2">Nessun impegno</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
