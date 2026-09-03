# -*- coding: utf-8 -*-
import sys

path = 'src/app/commercial-app/CommercialeAgendaClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target_tab = '''          <div className="space-y-1 mt-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block px-2">Contratti</span>
            <TabButton id="CONTRATTI_FIRMATI" label="Contratti Firmati" count={contrattiFirmati.length} active={activeTab} setActive={setActiveTab} color="bg-emerald-600/20 text-emerald-400 border-emerald-500/50" />
          </div>'''
replacement_tab = '''          <div className="space-y-1 mt-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block px-2">Contratti</span>
            <TabButton id="CONTRATTI_FIRMATI" label="Contratti Firmati" count={contrattiFirmati.length} active={activeTab} setActive={setActiveTab} color="bg-emerald-600/20 text-emerald-400 border-emerald-500/50" />
            <TabButton id="NOTIFICHE" label="Notifiche" count={unreadNotifCount} active={activeTab} setActive={setActiveTab} color="bg-amber-600/20 text-amber-400 border-amber-500/50" />
          </div>'''
code = code.replace(target_tab, replacement_tab)

target_content = '''      <div className="p-4 max-w-[1400px] mx-auto pb-12 flex flex-col md:flex-row gap-6 h-[calc(100vh-4rem)]">'''
replacement_content = '''      <div className="p-4 max-w-[1400px] mx-auto pb-12 flex flex-col md:flex-row gap-6 h-[calc(100vh-4rem)]">
      {activeTab === "NOTIFICHE" && (
        <div className="absolute inset-0 bg-gray-950 z-50 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-amber-400 flex items-center">
                <Bell className="w-8 h-8 mr-3" /> Notifiche ({unreadNotifCount} da leggere)
              </h2>
              <button onClick={() => setActiveTab("DA_SVOLGERE")} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">Chiudi</button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-gray-400 italic bg-gray-900 p-8 rounded-xl text-center">Nessuna notifica presente.</p>
            ) : (
              <div className="space-y-4">
              {notifications.map((n) => (
                <div key={n.id} className={`p-6 rounded-xl border ${n.isRead ? 'bg-gray-900/50 border-gray-800 opacity-70' : 'bg-gray-900 border-amber-500/50 shadow-lg shadow-amber-900/10 relative overflow-hidden'}`}>
                  {!n.isRead && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-bl-xl">
                      NUOVA
                    </div>
                  )}
                  <h3 className="font-bold text-white text-lg mb-2">{n.title}</h3>
                  <p className="text-gray-300 mb-4">{n.message}</p>
                  <p className="text-sm text-gray-500 mb-6 flex items-center"><Clock className="w-4 h-4 mr-1" /> {new Date(n.createdAt).toLocaleString('it-IT')}</p>
                  
                  <div className="flex gap-3">
                    {!n.isRead && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
                      >
                        Segna come Letta
                      </button>
                    )}
                    {n.appointmentId && (
                      <button 
                        onClick={() => { if (!n.isRead) markAsRead(n.id); setActiveTab("DA_SVOLGERE"); setSelectedApptId(n.appointmentId); }}
                        className="px-6 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-500/30 rounded-lg font-semibold transition"
                      >
                        Apri Scheda Appuntamento
                      </button>
                    )}
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      )}'''
code = code.replace(target_content, replacement_content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")