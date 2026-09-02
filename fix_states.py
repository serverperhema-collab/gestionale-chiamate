# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/operator-terminal/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# I will just run a python regex to remove the FIRST occurrence of the states
code = code.replace("""  const [gestioneSeparataModalOpen, setGestioneSeparataModalOpen] = useState(false);
  const [gestioneSeparataNotes, setGestioneSeparataNotes] = useState("");""", "", 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)