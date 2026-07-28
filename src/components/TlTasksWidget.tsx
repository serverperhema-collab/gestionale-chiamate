"use client";

import { useState, useEffect } from "react";
import { CheckCircle, PhoneCall, AlertCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function TlTasksWidget() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tl/tasks");
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tl/tasks/${id}`, {
        method: "PATCH"
      });
      if (res.ok) {
        toast.success("Task completato");
        fetchTasks();
      } else {
        toast.error("Errore completamento task");
      }
    } catch (e) {
      console.error(e);
      toast.error("Errore di rete");
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-800 rounded-xl p-6 h-48 border border-gray-700"></div>;
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 h-full flex flex-col relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <PhoneCall className="w-6 h-6 mr-3 text-purple-400" /> Check list
        </h2>
        <span className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full text-sm font-bold border border-purple-500/30">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8 flex flex-col items-center">
            <CheckCircle className="w-12 h-12 mb-3 opacity-20" />
            <p>Nessun task pendente.</p>
            <p className="text-xs mt-1">Ottimo lavoro!</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg flex justify-between items-center group/item hover:border-purple-500/50 transition">
              <div>
                <p className="font-bold text-white text-sm">
                  {task.contact?.name || "Contatto Sconosciuto"}
                </p>
                <p className="text-xs text-gray-400 mt-1">{task.title}</p>
                {task.recallDate && (
                  <p className="text-xs text-purple-400 mt-2 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Richiamo: {new Date(task.recallDate).toLocaleString()}
                  </p>
                )}
              </div>
              <button 
                onClick={() => completeTask(task.id)}
                className="p-2 rounded-full text-gray-500 hover:text-emerald-400 hover:bg-emerald-900/30 transition opacity-50 group-hover/item:opacity-100"
                title="Segna come completato"
              >
                <CheckCircle className="w-6 h-6" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
