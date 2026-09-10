import re

with open('src/app/operator-dashboard/negotiations/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make "TRATTATIVE PERSONALI" premium
content = content.replace(
    '''<h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">TRATTATIVE PERSONALI</h2>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('personal-recall')}
                className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center justify-between ${activeTab === 'personal-recall' ? 'bg-purple-600/20 text-purple-300 font-bold border border-purple-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
              >
                Da Richiamare
                {activeTab === 'personal-recall' && <ChevronRight className="w-4 h-4" />}
                </button>
                <button onClick={() => setActiveTab('personal-ko')} className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center justify-between ${activeTab === 'personal-ko' ? 'bg-red-600/20 text-red-300 font-bold border border-red-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}>
                  Trattative KO
                  {activeTab === 'personal-ko' && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>''',
    '''<h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                <span className="bg-purple-500/20 text-purple-400 p-1 rounded mr-2"><PhoneCall className="w-3 h-3" /></span>
                TRATTATIVE PERSONALI
              </h2>
              <div className="space-y-1 bg-gray-900/50 p-2 rounded-xl border border-gray-800 shadow-inner">
                <button 
                  onClick={() => setActiveTab('personal-recall')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-between ${activeTab === 'personal-recall' ? 'bg-gradient-to-r from-purple-600/30 to-purple-500/10 text-purple-300 font-bold border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                >
                  Da Richiamare
                  {activeTab === 'personal-recall' && <ChevronRight className="w-4 h-4 text-purple-400" />}
                </button>
                <button 
                  onClick={() => setActiveTab('personal-ko')} 
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-between ${activeTab === 'personal-ko' ? 'bg-gradient-to-r from-red-600/30 to-red-500/10 text-red-300 font-bold border border-red-500/40 shadow-[0_0_10px_rgba(220,38,38,0.1)]' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                >
                  Trattative KO
                  {activeTab === 'personal-ko' && <ChevronRight className="w-4 h-4 text-red-400" />}
                </button>
              </div>'''
)

# Make "TRATTATIVE CON APPUNTAMENTO" premium
content = content.replace(
    '''<h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">TRATTATIVE CON APPUNTAMENTO</h2>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('appointment-recall')}
                className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center justify-between ${activeTab === 'appointment-recall' ? 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
              >
                Da Richiamare
                {activeTab === 'appointment-recall' && <ChevronRight className="w-4 h-4" />}
                </button>
                <button onClick={() => setActiveTab('appointment-commerciale')} className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center justify-between ${activeTab === 'appointment-commerciale' ? 'bg-yellow-600/20 text-yellow-300 font-bold border border-yellow-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}>
                    In gestione al commerciale
                    {activeTab === 'appointment-commerciale' && <ChevronRight className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setActiveTab('appointment-ko')} className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center justify-between ${activeTab === 'appointment-ko' ? 'bg-red-600/20 text-red-300 font-bold border border-red-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}>
                  Trattative KO
                  {activeTab === 'appointment-ko' && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>''',
    '''<h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 mt-6 flex items-center">
                <span className="bg-blue-500/20 text-blue-400 p-1 rounded mr-2"><FileText className="w-3 h-3" /></span>
                TRATTATIVE CON APPUNTAMENTO
              </h2>
              <div className="space-y-1 bg-gray-900/50 p-2 rounded-xl border border-gray-800 shadow-inner">
                <button 
                  onClick={() => setActiveTab('appointment-recall')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-between ${activeTab === 'appointment-recall' ? 'bg-gradient-to-r from-blue-600/30 to-blue-500/10 text-blue-300 font-bold border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                >
                  Da Richiamare
                  {activeTab === 'appointment-recall' && <ChevronRight className="w-4 h-4 text-blue-400" />}
                </button>
                <button 
                  onClick={() => setActiveTab('appointment-commerciale')} 
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-between ${activeTab === 'appointment-commerciale' ? 'bg-gradient-to-r from-yellow-600/30 to-yellow-500/10 text-yellow-300 font-bold border border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.1)]' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                >
                  In gestione al comm.
                  {activeTab === 'appointment-commerciale' && <ChevronRight className="w-4 h-4 text-yellow-400" />}
                </button>
                <button 
                  onClick={() => setActiveTab('appointment-ko')} 
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-between ${activeTab === 'appointment-ko' ? 'bg-gradient-to-r from-red-600/30 to-red-500/10 text-red-300 font-bold border border-red-500/40 shadow-[0_0_10px_rgba(220,38,38,0.1)]' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                >
                  Trattative KO
                  {activeTab === 'appointment-ko' && <ChevronRight className="w-4 h-4 text-red-400" />}
                </button>
              </div>'''
)

# Make "CONTRATTI FIRMATI" premium
content = content.replace(
    '''<h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">CONTRATTI FIRMATI</h2>
              <div className="space-y-1">
                <button onClick={() => setActiveTab('contratti-attivi')} className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center justify-between ${activeTab === 'contratti-attivi' ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}>
                  Attivi
                  {activeTab === 'contratti-attivi' && <ChevronRight className="w-4 h-4" />}
                </button>
                <button onClick={() => setActiveTab('contratti-non-attivi')} className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center justify-between ${activeTab === 'contratti-non-attivi' ? 'bg-gray-600/20 text-gray-300 font-bold border border-gray-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}>
                  Non Attivi
                  {activeTab === 'contratti-non-attivi' && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>''',
    '''<h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 mt-6 flex items-center">
                <span className="bg-emerald-500/20 text-emerald-400 p-1 rounded mr-2"><Handshake className="w-3 h-3" /></span>
                CONTRATTI FIRMATI
              </h2>
              <div className="space-y-1 bg-gray-900/50 p-2 rounded-xl border border-gray-800 shadow-inner">
                <button 
                  onClick={() => setActiveTab('contratti-attivi')} 
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-between ${activeTab === 'contratti-attivi' ? 'bg-gradient-to-r from-emerald-600/30 to-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                >
                  Attivi
                  {activeTab === 'contratti-attivi' && <ChevronRight className="w-4 h-4 text-emerald-400" />}
                </button>
                <button 
                  onClick={() => setActiveTab('contratti-non-attivi')} 
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-between ${activeTab === 'contratti-non-attivi' ? 'bg-gradient-to-r from-gray-600/30 to-gray-500/10 text-gray-300 font-bold border border-gray-500/40 shadow-[0_0_10px_rgba(156,163,175,0.1)]' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                >
                  Non Attivi
                  {activeTab === 'contratti-non-attivi' && <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>
              </div>'''
)

with open('src/app/operator-dashboard/negotiations/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
