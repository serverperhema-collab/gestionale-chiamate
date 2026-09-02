import sys

path = 'src/components/ContactDetailModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace log.details rendering
target = '{log.details && <p className="text-gray-400 text-xs italic">{log.details}</p>}'

replacement = """{log.details && (
                          <p className="text-gray-400 text-xs italic">
                            {log.details
                              .replace(/sull'appuntamento\\s+c[a-z0-9]+\\b/i, "sull'appuntamento")
                              .replace(/all'appuntamento\\s+c[a-z0-9]+\\b/i, "all'appuntamento")
                              .replace(/ID:\\s*c[a-z0-9]+\\b/g, "")
                              .replace(/\\s+c[a-z0-9]{20,}\\b/g, "")}
                          </p>
                        )}"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
