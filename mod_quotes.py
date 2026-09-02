import sys

path = 'src/app/tl-dashboard/quotes/QuotesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Make it accept props
code = code.replace('export default function QuotesClient() {\n  const [activeTab, setActiveTab] = useState<TabType>("REQUESTS");', 'export default function QuotesClient({ externalTab }: { externalTab?: "REQUESTS" | "RECEIVED" }) {\n  const [activeTab, setActiveTab] = useState<TabType>(externalTab || "REQUESTS");\n  useEffect(() => { if (externalTab) setActiveTab(externalTab); }, [externalTab]);')

# Remove the sidebar entirely if externalTab is provided
sidebar = """        {/* Sidebar */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <Link href="/tl-dashboard" className="text-gray-400 hover:text-white text-sm flex items-center mb-4 transition">
              ← Torna alla Dashboard
            </Link>
            <h2 className="text-xl font-bold text-white flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-400" />
              Gestione Preventivi
            </h2>
          </div>
          
          <div className="p-4 space-y-2 flex-1">
            <button 
              onClick={() => setActiveTab("REQUESTS")} 
              className={`w-full flex items-center px-4 py-3 rounded-lg transition font-medium ${activeTab === "REQUESTS" ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300 border border-transparent'}`}
            >
              <AlertCircle className="w-5 h-5 mr-3" /> Richieste in Attesa
            </button>
            <button 
              onClick={() => setActiveTab("RECEIVED")} 
              className={`w-full flex items-center px-4 py-3 rounded-lg transition font-medium ${activeTab === "RECEIVED" ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300 border border-transparent'}`}
            >
              <CheckCircle className="w-5 h-5 mr-3" /> Inviati dal Commerciale
            </button>
          </div>
        </div>"""

# Replace the outer h-screen div if it's embedded
code = code.replace('<div className="flex h-screen bg-gray-950">', '<div className={`flex bg-gray-950 ${externalTab ? "h-full" : "h-screen"}`}>')

code = code.replace(sidebar, '{!externalTab && (' + sidebar + ')}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
