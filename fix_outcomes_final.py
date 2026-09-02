import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the broken end first
code = code.replace('        </div>\n            </div>\n          )}\n      </div>\n    </div>\n    </div>\n  );\n}', '        </div>\n      </div>\n    </div>\n  );\n}')

# Find where Main Content starts
main_idx = code.find('{/* Main Content */}')
before_main = code[:main_idx]
after_main = code[main_idx:]

# We want to wrap after_main (excluding the closing tags of the layout) in the ternary
# after_main starts with:
# {/* Main Content */}
# <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">
# ...

# Let's replace the opening div of main content
after_main = after_main.replace('<div className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">', '<div className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">\n{(activeTab === "QUOTES_REQUESTS" || activeTab === "QUOTES_RECEIVED") ? (\n  <QuotesClient externalTab={activeTab === "QUOTES_REQUESTS" ? "REQUESTS" : "RECEIVED"} />\n) : (\n  <div className="flex-1 flex flex-col overflow-hidden">', 1)

# Now we need to close it at the bottom.
# The bottom currently looks like:
#        </div>
#      </div>
#    </div>
#  );
#}
# The first </div> closes the flex-1 flex flex-col overflow-hidden we just opened.
# The second </div> closes the flex-1 bg-gray-900 rounded-2xl...
# So we need to insert `)}` before the second </div>.

end_str = '        </div>\n      </div>\n    </div>\n  );\n}'
new_end_str = '        </div>\n      </div>\n      )}\n      </div>\n    </div>\n  );\n}'

after_main = after_main.replace(end_str, new_end_str)

with open(path, 'w', encoding='utf-8') as f:
    f.write(before_main + after_main)
