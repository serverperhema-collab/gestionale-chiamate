import sys

path = 'src/components/OutcomeModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = 'if (!notes.trim()) { toast.error("Le note sono obbligatorie."); return; }'
repl1 = 'if (!notes.trim() && outcomeFinal !== "VENDUTO") { toast.error("Le note sono obbligatorie."); return; }'
code = code.replace(target1, repl1)

target2 = '''            {isSvolto !== null && (
              <div className="border-t border-gray-700 pt-6">
                <label className="block text-sm font-bold text-gray-300 mb-2">Resoconto / Note (obbligatorie) *</label>
                <textarea required value={notes} onChange={e => setNotes(e.target.value)}'''
repl2 = '''            {isSvolto !== null && (
              <div className="border-t border-gray-700 pt-6">
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  {outcomeFinal === "VENDUTO" ? "Note (opzionali)" : "Resoconto / Note (obbligatorie) *"}
                </label>
                <textarea required={outcomeFinal !== "VENDUTO"} value={notes} onChange={e => setNotes(e.target.value)}'''
code = code.replace(target2, repl2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")