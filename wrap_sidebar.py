import sys

path = 'src/app/tl-dashboard/quotes/QuotesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# We need to wrap the Sidebar in {!externalTab && ( ... )}
# Let's find where Sidebar starts and where it ends
sidebar_start = code.find('{/* Sidebar */}')
if sidebar_start != -1:
    sidebar_end = code.find('{/* Main Content */}')
    sidebar_code = code[sidebar_start:sidebar_end]
    if '{!externalTab && (' not in sidebar_code:
        # It's not wrapped yet.
        # Ensure we wrap the whole div
        new_sidebar_code = '{!externalTab && (\n' + sidebar_code + ')}\n'
        code = code[:sidebar_start] + new_sidebar_code + code[sidebar_end:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
