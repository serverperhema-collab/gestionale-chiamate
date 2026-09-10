with open('src/app/operator-dashboard/negotiations/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix filters
content = content.replace(
    "if (activeTab === 'personal-ko') return !st.currentCommercialeId && (st.status === 'SOSPESA' || st.status === 'CHIUSA_PERSA') && !st.hadAppointment;",
    "if (activeTab === 'personal-ko') return !st.currentCommercialeId && !st.hadAppointment && (st.status === 'SOSPESA' || st.status === 'CHIUSA_PERSA');"
)
content = content.replace(
    "if (activeTab === 'telefonica-commerciale') return !!st.currentCommercialeId && st.status === 'RICHIAMO_PERSONALE' && st.nextActionType !== 'RICHIAMO';",
    "if (activeTab === 'telefonica-commerciale') return !!st.currentCommercialeId && st.status === 'RICHIAMO_PERSONALE' && st.nextActionType !== 'RICHIAMO';\n      if (activeTab === 'telefonica-ko') return !!st.currentCommercialeId && !st.hadAppointment && (st.status === 'SOSPESA' || st.status === 'CHIUSA_PERSA');"
)
content = content.replace(
    "if (activeTab === 'appointment-ko') return (!!st.currentCommercialeId || st.hadAppointment) && (st.status === 'SOSPESA' || st.status === 'CHIUSA_PERSA');",
    "if (activeTab === 'appointment-ko') return st.hadAppointment && (st.status === 'SOSPESA' || st.status === 'CHIUSA_PERSA');"
)

# Add telefonica-ko button and premium UI
buttons_old = """<div>
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">TRATT. TELEFONICA CON COMM.</h2>
              <div className="space-y-1 mb-6">
                <button 
                  onClick={() => setActiveTab('telefonica-operator')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center justify-between ${activeTab === 'telefonica-operator' ? 'bg-orange-600/20 text-orange-300 font-bold border border-orange-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                >
                  Da Richiamare
                  {activeTab === 'telefonica-operator' && <ChevronRight className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setActiveTab('telefonica-commerciale')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center justify-between ${activeTab === 'telefonica-commerciale' ? 'bg-orange-600/20 text-orange-300 font-bold border border-orange-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                >
                  In attesa del commerciale
                  {activeTab === 'telefonica-commerciale' && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>"""

buttons_new = """<div>
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                <span className="bg-orange-500/20 text-orange-400 p-1 rounded mr-2"><PhoneCall className="w-3 h-3" /></span>
                TRATT. TELEFONICA CON COMM.
              </h2>
              <div className="space-y-1 mb-6 bg-gray-900/50 p-2 rounded-xl border border-gray-800 shadow-inner">
                <button 
                  onClick={() => setActiveTab('telefonica-operator')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-between ${activeTab === 'telefonica-operator' ? 'bg-gradient-to-r from-orange-600/30 to-orange-500/10 text-orange-300 font-bold border border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.1)]' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                >
                  Da Richiamare
                  {activeTab === 'telefonica-operator' && <ChevronRight className="w-4 h-4 text-orange-400" />}
                </button>
                <button 
                  onClick={() => setActiveTab('telefonica-commerciale')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-between ${activeTab === 'telefonica-commerciale' ? 'bg-gradient-to-r from-orange-600/30 to-orange-500/10 text-orange-300 font-bold border border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.1)]' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                >
                  In attesa del commerciale
                  {activeTab === 'telefonica-commerciale' && <ChevronRight className="w-4 h-4 text-orange-400" />}
                </button>
                <button 
                  onClick={() => setActiveTab('telefonica-ko')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-between ${activeTab === 'telefonica-ko' ? 'bg-gradient-to-r from-red-600/30 to-red-500/10 text-red-300 font-bold border border-red-500/40 shadow-[0_0_10px_rgba(220,38,38,0.1)]' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                >
                  Trattative KO
                  {activeTab === 'telefonica-ko' && <ChevronRight className="w-4 h-4 text-red-400" />}
                </button>
              </div>
            </div>"""

content = content.replace(buttons_old, buttons_new)

with open('src/app/operator-dashboard/negotiations/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
