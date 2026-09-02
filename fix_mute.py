import sys

path = 'src/components/TLAlertProvider.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = 'if (!isMuted) {'
replacement = 'const currentlyMuted = localStorage.getItem("tl_alerts_muted") === "true";\n            if (!currentlyMuted) {'

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
