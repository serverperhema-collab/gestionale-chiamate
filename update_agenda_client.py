# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/commercial-app/CommercialeAgendaClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add CONTRATTI_FIRMATI to TabType
target_tab_type = r'\| "TRATTATIVE_KO"\s*\| "STANDBY";'
replacement_tab_type = '''| "TRATTATIVE_KO"\n  | "STANDBY"\n  | "CONTRATTI_FIRMATI";'''
code = re.sub(target_tab_type, replacement_tab_type, code)

# Add contrattiFirmati filter
target_filter = r'  // 9. Appuntamenti in Standby\n  const standby = appointments.filter\(a => \{\n    const o = getLatestOutcome\(a\);\n    return o && o.outcomeFinal === "STANDBY";\n  \}\);'
replacement_filter = '''  // 9. Appuntamenti in Standby
  const standby = appointments.filter(a => {
    const o = getLatestOutcome(a);
    return o && o.outcomeFinal === "STANDBY";
  });

  // 10. Contratti Firmati
  const contrattiFirmati = appointments.filter(a => {
    const o = getLatestOutcome(a);
    return o && o.outcomeFinal === "VENDUTO"; // Mappato internamente su VENDUTO
  });'''
code = code.replace("  // 9. Appuntamenti in Standby\n  const standby = appointments.filter(a => {\n    const o = getLatestOutcome(a);\n    return o && o.outcomeFinal === \"STANDBY\";\n  });", replacement_filter)

# Add to getDisplayedAppts
target_switch = r'      case "STANDBY": return standby;\n      default: return \[\];'
replacement_switch = '''      case "STANDBY": return standby;\n      case "CONTRATTI_FIRMATI": return contrattiFirmati;\n      default: return [];'''
code = re.sub(target_switch, replacement_switch, code)

# Add to Sidebar
target_sidebar = r'          <TabButton id="TRATTATIVE_KO" label="Trattative KO" count=\{trattativeKO.length\} active=\{activeTab\} setActive=\{setActiveTab\} color="bg-red-600/20 text-red-400 border-red-500/50" />\n        </div>'
replacement_sidebar = '''          <TabButton id="TRATTATIVE_KO" label="Trattative KO" count={trattativeKO.length} active={activeTab} setActive={setActiveTab} color="bg-red-600/20 text-red-400 border-red-500/50" />
        </div>

        <div className="space-y-1 mt-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block px-2">Contratti</span>
          <TabButton id="CONTRATTI_FIRMATI" label="Contratti Firmati" count={contrattiFirmati.length} active={activeTab} setActive={setActiveTab} color="bg-emerald-600/20 text-emerald-400 border-emerald-500/50" />
        </div>'''
code = re.sub(target_sidebar, replacement_sidebar, code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")