import re

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

bad = 'if (c.hiddenUntil && new Date(c.hiddenUntil) > new Date()) return <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs font-semibold">Nascosto (In Trattativa)</span>;'

good = """if (c.hiddenUntil && new Date(c.hiddenUntil) > new Date()) {
      if (c.trattativa) {
        return <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs font-semibold">Nascosto (In Trattativa)</span>;
      }
      let reason = "Bloccato (Temporaneo)";
      if (c.callLogs && c.callLogs.length > 0) {
        const out = c.callLogs[0].outcome;
        if (out === "NO_ANSWER") reason = "Bloccato (Non Risponde)";
        else if (out === "NOT_AVAILABLE") reason = "Bloccato (Non Disponibile)";
        else if (out === "NON_INTERESSATO") reason = "Bloccato (Non Interessato)";
        else if (out === "NO_INFO") reason = "Bloccato (Non Reperibile)";
      }
      return <span className="px-2 py-1 bg-gray-800 text-orange-400 border border-orange-500/20 rounded text-xs font-semibold">{reason}</span>;
    }"""

c = c.replace(bad, good)

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
