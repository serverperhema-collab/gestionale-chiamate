import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

end_str = '        </div>\n      </div>\n      )}\n      </div>\n    </div>\n  );\n}'
new_end_str = '        </div>\n      </div>\n      )}\n      </div>\n    </div>\n    </div>\n  );\n}'

code = code.replace(end_str, new_end_str)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
