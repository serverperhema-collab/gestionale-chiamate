import sys

path = 'src/app/tl-dashboard/settings/contacts/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Remove from top
bad_state = """  const [showHistModal, setShowHistModal] = useState(false);
  const [histContact, setHistContact] = useState<any>(null);"""
code = code.replace(bad_state, "")

# Add inside function
code = code.replace(
    '  const [contacts, setContacts] = useState<any[]>([]);',
    '  const [contacts, setContacts] = useState<any[]>([]);\n  const [showHistModal, setShowHistModal] = useState(false);\n  const [histContact, setHistContact] = useState<any>(null);'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
