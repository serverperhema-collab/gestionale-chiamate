# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/commercial-app/CommercialeAgendaClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add Notifiche to TabType
target_tab_type = '''  | "CONTRATTI_FIRMATI";'''
replacement_tab_type = '''  | "CONTRATTI_FIRMATI" | "NOTIFICHE";'''
code = code.replace(target_tab_type, replacement_tab_type)

# Add Notifiche icon import
target_import = '''import { Clock, MapPin, Phone, User, FileText, CheckCircle, AlertTriangle, Printer, PhoneCall, RefreshCw, Handshake, XCircle, PauseCircle, PhoneForwarded } from "lucide-react";'''
replacement_import = '''import { Clock, MapPin, Phone, User, FileText, CheckCircle, AlertTriangle, Printer, PhoneCall, RefreshCw, Handshake, XCircle, PauseCircle, PhoneForwarded, Bell } from "lucide-react";'''
code = code.replace(target_import, replacement_import)

# Add notifications state
target_state = '''  const [appointments, setAppointments] = useState<any[]>([]);'''
replacement_state = '''  const [appointments, setAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);'''
code = code.replace(target_state, replacement_state)

# Add notifications fetch
target_fetch = '''      const data = await res.json();
      setAppointments(data.appointments || []);'''
replacement_fetch = '''      const data = await res.json();
      setAppointments(data.appointments || []);
      
      const notifRes = await fetch("/api/commerciale/notifications");
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      }'''
code = code.replace(target_fetch, replacement_fetch)

# Unread count
target_count = '''  const filterAppointments = () => {'''
replacement_count = '''  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/commerciale/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch(e) {}
  };

  const filterAppointments = () => {'''
code = code.replace(target_count, replacement_count)

# Render tab button
target_tab_btn = '''          <SidebarButton id="CONTRATTI_FIRMATI" icon={Handshake} label="Contratti Firmati" count={categorized.firmati.length} color="text-emerald-400" />
        </nav>'''
replacement_tab_btn = '''          <SidebarButton id="CONTRATTI_FIRMATI" icon={Handshake} label="Contratti Firmati" count={categorized.firmati.length} color="text-emerald-400" />
          <SidebarButton id="NOTIFICHE" icon={Bell} label="Notifiche" count={unreadNotifCount} color="text-amber-400" />
        </nav>'''
code = code.replace(target_tab_btn, replacement_tab_btn)

# Render Notifications view
target_render = '''        {activeTab === "CONTRATTI_FIRMATI" && (
          <div className="space-y-4">'''
replacement_render = '''        {activeTab === "NOTIFICHE" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-amber-400 mb-6 flex items-center">
              <Bell className="w-6 h-6 mr-2" /> Notifiche ({unreadNotifCount} da leggere)
            </h2>
            {notifications.length === 0 ? (
              <p className="text-gray-400 italic">Nessuna notifica presente.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-4 rounded-xl border ${n.isRead ? 'bg-gray-800/50 border-gray-700 opacity-70' : 'bg-gray-800 border-amber-500/50 shadow-lg relative overflow-hidden'}`}>
                  {!n.isRead && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                      NUOVA
                    </div>
                  )}
                  <h3 className="font-bold text-white mb-1">{n.title}</h3>
                  <p className="text-sm text-gray-300 mb-4">{n.message}</p>
                  <p className="text-xs text-gray-500 mb-4">{new Date(n.createdAt).toLocaleString('it-IT')}</p>
                  
                  <div className="flex gap-2">
                    {!n.isRead && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-semibold transition"
                      >
                        Segna come Letta
                      </button>
                    )}
                    {n.appointmentId && (
                      <button 
                        onClick={() => { if (!n.isRead) markAsRead(n.id); setSelectedApptId(n.appointmentId); }}
                        className="flex-1 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-500/30 rounded text-sm font-semibold transition"
                      >
                        Apri Scheda
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === "CONTRATTI_FIRMATI" && (
          <div className="space-y-4">'''
code = code.replace(target_render, replacement_render)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")