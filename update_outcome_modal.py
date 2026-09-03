# -*- coding: utf-8 -*-
import sys

path = 'src/components/OutcomeModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """{["VENDUTO", "NON_VENDUTO", "RIPENSARCI", "FOLLOWUP", "KO"].map(out => (
                        <button
                          key={out}
                          type="button"
                          onClick={() => setOutcomeFinal(out as any)}
                          className={`p-2 rounded border text-sm font-bold transition-all ${
                            outcomeFinal === out 
                              ? (out === "VENDUTO" ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' : out === "KO" ? 'bg-red-900/50 border-red-500 text-red-400' : 'bg-blue-900/50 border-blue-500 text-blue-400')
                              : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {out.replace("_", " ")}
                        </button>
                      ))}"""

replacement = """{[
                        { val: "VENDUTO", label: "VENDUTO" },
                        { val: "NON_VENDUTO", label: "NON VENDUTO" },
                        { val: "STANDBY", label: "STANDBY" },
                        { val: "FOLLOWUP", label: "TRATTATIVA IN CORSO" },
                        { val: "KO", label: "KO" }
                      ].map(out => (
                        <button
                          key={out.val}
                          type="button"
                          onClick={() => setOutcomeFinal(out.val as any)}
                          className={`p-2 rounded border text-sm font-bold transition-all ${
                            outcomeFinal === out.val 
                              ? (out.val === "VENDUTO" ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' : out.val === "KO" ? 'bg-red-900/50 border-red-500 text-red-400' : 'bg-blue-900/50 border-blue-500 text-blue-400')
                              : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {out.label}
                        </button>
                      ))}"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)