# -*- coding: utf-8 -*-
import sys

path = 'src/components/OutcomeModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target_outcome_state = """  const [outcomeFinal, setOutcomeFinal] = useState<"VENDUTO" | "NON_VENDUTO" | "RIPENSARCI" | "FOLLOWUP" | "KO" | "">("");"""
replacement_outcome_state = """  const [outcomeFinal, setOutcomeFinal] = useState<"VENDUTO" | "NON_VENDUTO" | "RIPENSARCI" | "STANDBY" | "FOLLOWUP" | "KO" | "">("");"""
code = code.replace(target_outcome_state, replacement_outcome_state)

target_target_state = """  const [nextActionTarget, setNextActionTarget] = useState<"COMMERCIALE" | "OPERATORE" | "">("");"""
replacement_target_state = """  const [nextActionTarget, setNextActionTarget] = useState<"COMMERCIALE" | "OPERATORE" | "TEAM_LEADER" | "">("");"""
code = code.replace(target_target_state, replacement_target_state)

target_btn_grid = """                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { val: "VENDUTO", label: "Venduto" },
                    { val: "NON_VENDUTO", label: "Non Venduto" },
                    { val: "RIPENSARCI", label: "Vuole Ripensarci" },
                    { val: "KO", label: "KO Definitivo" },
                  ].map(opt => ("""
replacement_btn_grid = """                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { val: "VENDUTO", label: "Venduto" },
                    { val: "NON_VENDUTO", label: "Non Venduto" },
                    { val: "RIPENSARCI", label: "Vuole Ripensarci" },
                    { val: "STANDBY", label: "Standby" },
                    { val: "KO", label: "KO Definitivo" },
                  ].map(opt => ("""
code = code.replace(target_btn_grid, replacement_btn_grid)

target_target_btns = """                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNextActionTarget("COMMERCIALE")}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg border transition ${nextActionTarget === "COMMERCIALE" ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
                        >
                          A Me (Commerciale)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNextActionTarget("OPERATORE")}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg border transition ${nextActionTarget === "OPERATORE" ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
                        >
                          All'Operatore
                        </button>
                      </div>"""
replacement_target_btns = """                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNextActionTarget("COMMERCIALE")}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${nextActionTarget === "COMMERCIALE" ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
                        >
                          A Me
                        </button>
                        <button
                          type="button"
                          onClick={() => setNextActionTarget("OPERATORE")}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${nextActionTarget === "OPERATORE" ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
                        >
                          Operatore
                        </button>
                        <button
                          type="button"
                          onClick={() => setNextActionTarget("TEAM_LEADER")}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${nextActionTarget === "TEAM_LEADER" ? 'bg-red-600 text-white border-red-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
                        >
                          Team Leader
                        </button>
                      </div>"""
code = code.replace(target_target_btns, replacement_target_btns)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)