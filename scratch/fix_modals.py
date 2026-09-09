import re

# 1. Fix hidden contacts (add the missing component)
with open("src/app/tl-dashboard/settings/hidden-contacts/page.tsx", "r", encoding="utf-8") as f:
    hc = f.read()

# Make sure TrattativaTimeline is actually imported and then add the JSX
if "{timelineTrattativaId && (" not in hc or "TrattativaTimeline" not in hc.split("return (")[1]:
    hc = hc.replace(
        "      {/* Finestrella Custom Conferma Sblocco */}",
        "      {/* Trattativa Modal */}\n      {timelineTrattativaId && (\n        <TrattativaTimeline \n          trattativaId={timelineTrattativaId}\n          onClose={() => setTimelineTrattativaId(null)}\n        />\n      )}\n\n      {/* Finestrella Custom Conferma Sblocco */}"
    )
    with open("src/app/tl-dashboard/settings/hidden-contacts/page.tsx", "w", encoding="utf-8") as f:
        f.write(hc)

# 2. Fix Database Contatti (change viewTimeline to setTimelineTrattativaId and keep Storico)
with open("src/app/tl-dashboard/settings/contacts/page.tsx", "r", encoding="utf-8") as f:
    db_c = f.read()

old_btn = """                      {c.trattativa ? (
                          <button
                            onClick={() => viewTimeline(c)}
                            className="inline-flex items-center px-3 py-1.5 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 rounded border border-emerald-800/50 transition whitespace-nowrap"
                          >
                            <History className="w-4 h-4 mr-1.5" />
                            Visualizza Trattativa
                          </button>
                        )"""

new_btn = """                      {c.trattativa ? (
                          <>
                            <button
                              onClick={() => viewTimeline(c)}
                              className="inline-flex items-center px-2 py-1.5 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 rounded border border-emerald-800/50 transition whitespace-nowrap"
                              title="Visualizza Storico Log"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTimelineTrattativaId(c.trattativa.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-purple-900/20 hover:bg-purple-900/40 text-purple-400 rounded border border-purple-800/50 transition whitespace-nowrap"
                            >
                              <Handshake className="w-4 h-4 mr-1.5" />
                              Scheda Trattativa
                            </button>
                          </>
                        )"""

if "Handshake" not in db_c:
    db_c = db_c.replace("import { Database, Search, Filter", "import { Handshake, Database, Search, Filter")

db_c = db_c.replace(old_btn, new_btn)

with open("src/app/tl-dashboard/settings/contacts/page.tsx", "w", encoding="utf-8") as f:
    f.write(db_c)

print("Done")
