import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """        {/* Menu Laterale */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab("DA_SVOLGERE")}"""

replacement = """        {/* Menu Laterale */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          <span className="text-sm font-bold text-white uppercase tracking-wider mb-1 block px-1">Area Appuntamenti</span>
          <button 
            onClick={() => setActiveTab("DA_SVOLGERE")}"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
