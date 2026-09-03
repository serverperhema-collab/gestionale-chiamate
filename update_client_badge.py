import sys

path = 'src/app/commercial-app/CommercialeAgendaClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = '''{appt.isPhoneAppt && <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-500/50 inline-flex items-center"><PhoneCall className="w-3 h-3 mr-1" /> Telefonico</span>}
                        {appt.isSecondAppt && <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-900/50 text-teal-300 px-2 py-0.5 rounded border border-teal-500/50 inline-flex items-center"><RefreshCw className="w-3 h-3 mr-1" /> 2° App</span>}'''
repl = '''{appt.isPhoneAppt && <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-500/50 inline-flex items-center"><PhoneCall className="w-3 h-3 mr-1" /> Telefonico</span>}
                        {appt.isSecondAppt && <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-900/50 text-teal-300 px-2 py-0.5 rounded border border-teal-500/50 inline-flex items-center"><RefreshCw className="w-3 h-3 mr-1" /> 2° App</span>}
                        {appt.isDeroga && <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded border border-amber-500/50 inline-flex items-center">Deroga</span>}'''
code = code.replace(target, repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")