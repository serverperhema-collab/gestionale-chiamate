import re

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

bad = """                      <button
                        onClick={() => openAssignModal(c)}
                        className="inline-flex items-center px-3 py-1.5 bg-purple-900/30 hover:bg-purple-800/50 text-purple-400 rounded border border-purple-800/50 transition"
                      >
                        <ArrowRightCircle className="w-4 h-4 mr-1.5" />
                        Delega
                      </button>
                      {c.trattativa ? (
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
                        ) : ("""

good = """                      <button
                        onClick={() => openAssignModal(c)}
                        className="inline-flex items-center px-3 py-1.5 bg-purple-900/30 hover:bg-purple-800/50 text-purple-400 rounded border border-purple-800/50 transition"
                      >
                        <ArrowRightCircle className="w-4 h-4 mr-1.5" />
                        Delega
                      </button>

                      <button
                        onClick={() => viewTimeline(c)}
                        className="inline-flex items-center px-2 py-1.5 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 rounded border border-emerald-800/50 transition whitespace-nowrap"
                        title="Visualizza Storico Log"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      {c.trattativa ? (
                          <button
                            onClick={() => setTimelineTrattativaId(c.trattativa.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-amber-900/30 hover:bg-amber-800/50 text-amber-400 rounded border border-amber-500/50 transition whitespace-nowrap"
                          >
                            <Handshake className="w-4 h-4 mr-1.5" />
                            Scheda Trattativa
                          </button>
                        ) : ("""

c = c.replace(bad, good)

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
