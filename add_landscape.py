import sys

path = 'src/app/tl-dashboard/monitoring/attendance/AttendanceClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

if '<style>{"@media print' not in code:
    code = code.replace('<div className="min-h-screen bg-gray-950 p-6">', '<div className="min-h-screen bg-gray-950 p-6">\n      <style>{`@media print { @page { size: landscape; } }`}</style>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
