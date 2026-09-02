import sys
import re

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add onChangeStatus function inside component
func_code = """  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tl/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success("Stato aggiornato!");
        fetchData();
      } else {
        toast.error("Errore aggiornamento");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };"""

code = code.replace('  const [editModalAppt, setEditModalAppt] = useState<any | null>(null);', '  const [editModalAppt, setEditModalAppt] = useState<any | null>(null);\n' + func_code)

# Replace the status badge with a select dropdown
badge_regex = r'<span className="bg-gray-800 text-gray-400 border border-gray-700 text-xs px-2 py-0\.5 rounded font-bold uppercase tracking-wider">\s*\{appt\.status\}\s*</span>'
select_code = """<select 
                                  value={appt.status} 
                                  onChange={(e) => updateAppointmentStatus(appt.id, e.target.value)}
                                  className="bg-gray-800 text-gray-300 border border-gray-600 hover:border-gray-500 cursor-pointer text-xs px-2 py-1 rounded font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                                >
                                  <option value="PENDING">IN ATTESA</option>
                                  <option value="CONFIRMED">CONFERMATO</option>
                                  <option value="DONE">SVOLTO</option>
                                  <option value="CANCELED">ANNULLATO</option>
                                </select>"""
code = re.sub(badge_regex, select_code, code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
