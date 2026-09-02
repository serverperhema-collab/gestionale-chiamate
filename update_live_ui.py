import sys

path = 'src/app/tl-dashboard/monitoring/live/LiveMonitorClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = """<th className="px-2 py-3 text-center text-rose-500">Cestino</th>"""
replacement1 = """<th className="px-2 py-3 text-center text-rose-500">Cestino</th>
                  <th className="px-2 py-3 text-center text-teal-400">Pulizie</th>"""
code = code.replace(target1, replacement1)

target2 = """<td className="px-2 py-3 text-center text-rose-500 font-medium">{op.trashRequest}</td>"""
replacement2 = """<td className="px-2 py-3 text-center text-rose-500 font-medium">{op.trashRequest}</td>
                    <td className="px-2 py-3 text-center text-teal-400 font-medium">{op.gestioneSeparata}</td>"""
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
