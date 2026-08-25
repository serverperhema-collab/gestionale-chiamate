"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return <div className="w-20"></div>; // Placeholder during SSR

  return (
    <div className="flex items-center text-emerald-400 font-mono text-lg tracking-wider mr-4 bg-gray-900 px-3 py-1 rounded-lg border border-gray-700 shadow-inner">
      <Clock className="w-4 h-4 mr-2 opacity-70" />
      {time.toLocaleTimeString('it-IT')}
    </div>
  );
}
