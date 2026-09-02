import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the end to have exactly 2 closing divs before );
# Let's just fix it manually from the bottom up

code = code.replace('      </div>\n      </div>\n    </div>\n    </div>\n  );\n}', '      </div>\n    </div>\n  );\n}')
with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
