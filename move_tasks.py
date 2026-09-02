import sys

path = 'src/app/tl-dashboard/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

task_widget = """        <div className="mb-8">
          <div className="h-64">
            <TlTasksWidget />
          </div>
        </div>"""

code = code.replace(task_widget, '')

target = """          </Link>

        </div>"""

code = code.replace(target, target + '\n\n' + task_widget)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
