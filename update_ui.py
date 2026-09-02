import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. State for Date Filter
state_target = 'const [selectedCommerciale, setSelectedCommerciale] = useState("");'
state_replacement = 'const [selectedCommerciale, setSelectedCommerciale] = useState("");\n  const [dateFilter, setDateFilter] = useState("ALL");\n  const [customStart, setCustomStart] = useState("");\n  const [customEnd, setCustomEnd] = useState("");'
code = code.replace(state_target, state_replacement)

# 2. Modify fetchData to include dates
fetch_target = 'const url = selectedCommerciale ? `/api/tl/outcomes?commercialeId=${selectedCommerciale}` : `/api/tl/outcomes`;'
fetch_replacement = """    let url = `/api/tl/outcomes?`;
    if (selectedCommerciale) url += `commercialeId=${selectedCommerciale}&`;
    
    if (dateFilter === "WEEK") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      url += `startDate=${d.toISOString()}&`;
    } else if (dateFilter === "MONTH") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      url += `startDate=${d.toISOString()}&`;
    } else if (dateFilter === "CUSTOM" && customStart) {
      url += `startDate=${new Date(customStart).toISOString()}&`;
      if (customEnd) url += `endDate=${new Date(customEnd).toISOString()}&`;
    }"""
code = code.replace(fetch_target, fetch_replacement)

# 3. Add useEffect to refetch when dateFilter or custom dates change
use_effect_target = 'useEffect(() => {\n    fetchData();\n  }, [selectedCommerciale]);'
use_effect_replacement = 'useEffect(() => {\n    if (dateFilter !== "CUSTOM" || (dateFilter === "CUSTOM" && customStart && customEnd)) {\n      fetchData();\n    }\n  }, [selectedCommerciale, dateFilter, customStart, customEnd]);'
code = code.replace(use_effect_target, use_effect_replacement)

# 4. Add the UI in the header
ui_target = """        <div className="flex justify-between items-center bg-gray-900 border-b border-gray-800 p-4 shrink-0">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select 
              value={selectedCommerciale} 
              onChange={(e) => setSelectedCommerciale(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition text-sm"
            >
              <option value="">Tutti i Commerciali</option>
              {commerciali.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aggiorna
          </button>
        </div>"""

ui_replacement = """        <div className="flex justify-between items-center bg-gray-900 border-b border-gray-800 p-4 shrink-0 flex-wrap gap-4">
          <div className="flex items-center space-x-4 flex-wrap gap-y-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select 
              value={selectedCommerciale} 
              onChange={(e) => setSelectedCommerciale(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition text-sm"
            >
              <option value="">Tutti i Commerciali</option>
              {commerciali.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition text-sm"
            >
              <option value="ALL">Sempre</option>
              <option value="WEEK">Ultima Settimana</option>
              <option value="MONTH">Ultimo Mese</option>
              <option value="CUSTOM">Intervallo Personalizzato</option>
            </select>

            {dateFilter === "CUSTOM" && (
              <div className="flex items-center space-x-2">
                <input 
                  type="date" 
                  value={customStart} 
                  onChange={(e) => setCustomStart(e.target.value)} 
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none" 
                />
                <span className="text-gray-400">a</span>
                <input 
                  type="date" 
                  value={customEnd} 
                  onChange={(e) => setCustomEnd(e.target.value)} 
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none" 
                />
              </div>
            )}
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-sm disabled:opacity-50 ml-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aggiorna
          </button>
        </div>"""

code = code.replace(ui_target, ui_replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
