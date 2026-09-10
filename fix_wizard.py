with open('src/components/WizardCreaTrattativa.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('{flow === "IN_CORSO" && (', '{(flow === "IN_CORSO" || flow === "KO") && (')

with open('src/components/WizardCreaTrattativa.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
