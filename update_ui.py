import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Remove max-w-7xl and make it wider
code = code.replace('className="p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col"', 'className="p-6 max-w-[1600px] w-full mx-auto h-[calc(100vh-4rem)] flex flex-col"')

# Replace the horizontal tabs with a layout having left sidebar
old_tabs = """      {/* Tabs */}
      <div className="flex space-x-2 bg-gray-900 p-1 rounded-xl border border-gray-800 mb-6 shrink-0 overflow-x-auto">
        <button 
          onClick={() => setActiveTab("DA_SVOLGERE")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition whitespace-nowrap ${activeTab === "DA_SVOLGERE" ? 'bg-orange-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
        >
          Svolti SENZA Esito (Da Svolgere) ({daSvolgere.length})
        </button>
        <button 
          onClick={() => setActiveTab("SVOLTI")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition whitespace-nowrap ${activeTab === "SVOLTI" ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
        >
          Svolti CON Esito ({svolti.length})
        </button>
        <button 
          onClick={() => setActiveTab("FUTURI")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition whitespace-nowrap ${activeTab === "FUTURI" ? 'bg-teal-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
        >
          In Agenda (Futuri / Oggi) ({futuri.length})
        </button>
      </div>

      <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">"""

new_tabs = """      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        
        {/* Menu Laterale */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab("DA_SVOLGERE")}
            className={`w-full text-left px-4 py-4 rounded-xl border transition flex flex-col ${activeTab === "DA_SVOLGERE" ? 'bg-orange-600/20 border-orange-500 text-orange-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
          >
            <span className="font-bold text-lg mb-1">Da Svolgere</span>
            <span className="text-xs opacity-80">Svolti SENZA Esito ({daSvolgere.length})</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("SVOLTI")}
            className={`w-full text-left px-4 py-4 rounded-xl border transition flex flex-col ${activeTab === "SVOLTI" ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
          >
            <span className="font-bold text-lg mb-1">Svolti</span>
            <span className="text-xs opacity-80">Svolti CON Esito ({svolti.length})</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("FUTURI")}
            className={`w-full text-left px-4 py-4 rounded-xl border transition flex flex-col ${activeTab === "FUTURI" ? 'bg-teal-600/20 border-teal-500 text-teal-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
          >
            <span className="font-bold text-lg mb-1">In Agenda</span>
            <span className="text-xs opacity-80">Futuri / Oggi ({futuri.length})</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">"""
        
code = code.replace(old_tabs, new_tabs)

# Remove max-w-4xl from the list so it takes full width
code = code.replace('className="space-y-4 max-w-4xl mx-auto"', 'className="space-y-4 w-full"')

# Close the new flex wrapper at the end
code = code.replace('    </div>\n  );\n}', '      </div>\n    </div>\n    </div>\n  );\n}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
