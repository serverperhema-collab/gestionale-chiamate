# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/commercial-app/CommercialeAgendaClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Fix fetch logic
target_fetch = '''      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments);
      } else {'''
replacement_fetch = '''      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments);
        
        const notifRes = await fetch("/api/commerciale/notifications");
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.notifications || []);
        }
      } else {'''
code = code.replace(target_fetch, replacement_fetch)

# Add markAsRead and unreadNotifCount
target_filter = '  const filterAppointments = () => {'
replacement_filter = '''  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

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
code = code.replace(target_filter, replacement_filter)

# Fix Tab Button
target_tab = '''        <SidebarButton id="CONTRATTI_FIRMATI" icon={Handshake} label="Contratti Firmati" count={categorized.firmati.length} color="text-emerald-400" />
      </nav>'''
replacement_tab = '''        <SidebarButton id="CONTRATTI_FIRMATI" icon={Handshake} label="Contratti Firmati" count={categorized.firmati.length} color="text-emerald-400" />
        <SidebarButton id="NOTIFICHE" icon={Bell} label="Notifiche" count={unreadNotifCount} color="text-amber-400" />
      </nav>'''
code = code.replace(target_tab, replacement_tab)

# Fix Tab Content
target_content = '''      {activeTab === "CONTRATTI_FIRMATI" && (
        <div className="space-y-4">'''
replacement_content = '''      {activeTab === "NOTIFICHE" && (
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
code = code.replace(target_content, replacement_content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")