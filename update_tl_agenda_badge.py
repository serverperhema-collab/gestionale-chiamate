import sys

path = 'src/app/tl-dashboard/appointments/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = '''  const getStatusBadge = (appt: any) => {
    if (appt.status === "CANCELLED") return <span className="bg-orange-900/50 text-orange-400 border border-orange-700/50 text-[10px] px-1.5 py-0.5 rounded">Annullato</span>;
    if (appt.isDeroga && !appt.isApproved) return <span className="bg-red-900/50 text-red-400 border border-red-700/50 text-[10px] px-1.5 py-0.5 rounded">Da Assegnare</span>;
    if (appt.status === "PENDING") return <span className="bg-yellow-900/50 text-yellow-400 border border-yellow-700/50 text-[10px] px-1.5 py-0.5 rounded">In Attesa</span>;
    if (appt.status === "CONFIRMED") return <span className="bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 text-[10px] px-1.5 py-0.5 rounded">Confermato</span>;
    if (appt.status === "DONE" || appt.status === "NOT_CONFIRMED") return <span className="bg-gray-800 text-gray-400 border border-gray-600 text-[10px] px-1.5 py-0.5 rounded">Passato</span>;
    return null;
  };'''

repl = '''  const getStatusBadge = (appt: any) => {
    if (appt.status === "CANCELLED") return <span className="bg-orange-900/50 text-orange-400 border border-orange-700/50 text-[10px] px-1.5 py-0.5 rounded">Annullato</span>;
    if (appt.isDeroga && !appt.isApproved) return <span className="bg-red-900/50 text-red-400 border border-red-700/50 text-[10px] px-1.5 py-0.5 rounded flex items-center"><Crown className="w-2.5 h-2.5 mr-1" /> Deroga (Da Assegnare)</span>;
    if (appt.isDeroga && appt.isApproved) return <span className="bg-amber-900/50 text-amber-400 border border-amber-500/50 text-[10px] px-1.5 py-0.5 rounded flex items-center shadow-lg shadow-amber-900/50"><Crown className="w-2.5 h-2.5 mr-1" /> Deroga Approvata</span>;
    if (appt.status === "PENDING") return <span className="bg-yellow-900/50 text-yellow-400 border border-yellow-700/50 text-[10px] px-1.5 py-0.5 rounded">In Attesa</span>;
    if (appt.status === "CONFIRMED") return <span className="bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 text-[10px] px-1.5 py-0.5 rounded">Confermato</span>;
    if (appt.status === "DONE" || appt.status === "NOT_CONFIRMED") return <span className="bg-gray-800 text-gray-400 border border-gray-600 text-[10px] px-1.5 py-0.5 rounded">Passato</span>;
    return null;
  };'''
code = code.replace(target, repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")