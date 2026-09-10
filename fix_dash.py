with open('src/app/operator-dashboard/negotiations/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "if (activeTab === 'personal-ko') return !st.currentCommercialeId && st.status === 'SOSPESA';",
    "if (activeTab === 'personal-ko') return !st.currentCommercialeId && (st.status === 'SOSPESA' || st.status === 'CHIUSA_PERSA') && !st.hadAppointment;"
)
content = content.replace(
    "if (activeTab === 'appointment-ko') return !!st.currentCommercialeId && st.status === 'SOSPESA';",
    "if (activeTab === 'appointment-ko') return (!!st.currentCommercialeId || st.hadAppointment) && (st.status === 'SOSPESA' || st.status === 'CHIUSA_PERSA');"
)

content = content.replace(
    "return false;\n      });",
    "if (activeTab === 'contratti-attivi') return st.status === 'CHIUSA_VINTA';\n        if (activeTab === 'contratti-non-attivi') return false;\n        return false;\n      });"
)

buttons_html = """</div>
            </div>

            <div>
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">CONTRATTI FIRMATI</h2>
              <div className="space-y-1">
                <button onClick={() => setActiveTab('contratti-attivi')} className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center justify-between ${activeTab === 'contratti-attivi' ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}>
                  Attivi
                  {activeTab === 'contratti-attivi' && <ChevronRight className="w-4 h-4" />}
                </button>
                <button onClick={() => setActiveTab('contratti-non-attivi')} className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center justify-between ${activeTab === 'contratti-non-attivi' ? 'bg-gray-600/20 text-gray-300 font-bold border border-gray-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}>
                  Non Attivi
                  {activeTab === 'contratti-non-attivi' && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
        </div>"""

content = content.replace("""</div>
            </div>
        </div>""", buttons_html)

with open('src/app/operator-dashboard/negotiations/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)