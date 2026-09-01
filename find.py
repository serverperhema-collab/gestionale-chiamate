import os, re
actions = set()
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            try:
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    content = f.read()
                    matches = re.findall(r'action:\s*\"([A-Z_]+)\"', content)
                    actions.update(matches)
            except: pass
print(list(actions))
