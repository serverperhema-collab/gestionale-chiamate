import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('<>\n          {/* Filters */}', '<div className="flex-1 flex flex-col overflow-hidden">\n          {/* Filters */}')
code = code.replace('            </>\n          )}', '            </div>\n          )}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
