import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_preventivi_menu = """          <div className="mt-4 pt-4 border-t border-gray-800">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block px-2">Preventivi</span>
            <button 
              onClick={() => setActiveTab("QUOTES_REQUESTS")}
              className={`w-full flex items-center px-4 py-3 rounded-xl border transition ${activeTab === "QUOTES_REQUESTS" ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
            >
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="font-bold">Richieste in Attesa</span>
            </button>
            <button 
              onClick={() => setActiveTab("QUOTES_RECEIVED")}
              className={`w-full flex items-center px-4 py-3 mt-2 rounded-xl border transition ${activeTab === "QUOTES_RECEIVED" ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
            >
              <FileText className="w-5 h-5 mr-3" />
              <span className="font-bold">Inviati dal Comm.</span>
            </button>
          </div>"""

new_preventivi_menu = """          <div className="mt-4 pt-4 border-t border-gray-800">
            <span className="text-sm font-bold text-white uppercase tracking-wider mb-3 block px-1">Area Preventivi</span>
            <button 
              onClick={() => setActiveTab("QUOTES_REQUESTS")}
              className={`w-full text-left px-4 py-4 rounded-xl border transition flex flex-col mb-2 ${activeTab === "QUOTES_REQUESTS" ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
            >
              <span className="font-bold text-lg mb-1">In Attesa</span>
              <span className="text-xs opacity-80">Richieste da gestire</span>
            </button>
            
            <button 
              onClick={() => setActiveTab("QUOTES_RECEIVED")}
              className={`w-full text-left px-4 py-4 rounded-xl border transition flex flex-col ${activeTab === "QUOTES_RECEIVED" ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
            >
              <span className="font-bold text-lg mb-1">Inviati</span>
              <span className="text-xs opacity-80">Caricati dal commerciale</span>
            </button>
          </div>"""

code = code.replace(old_preventivi_menu, new_preventivi_menu)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
