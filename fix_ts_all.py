import sys

def fix_appointments():
    path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\tl\\appointments\\route.ts'
    with open(path, 'r', encoding='utf-8') as f: content = f.read()
    
    bad = """        trattativa: {
          include: {
            contact: { select: { id: true, name: true, cap: true, address: true } },
            operator: { select: { id: true, name: true } },
            commerciale: { select: { id: true, name: true } }
          }
        },"""
    good = """        trattativa: {
          include: {
            contact: { select: { id: true, name: true, cap: true, address: true } },
            currentOperator: { select: { id: true, name: true } },
            currentCommerciale: { select: { id: true, name: true } }
          }
        },"""
    content = content.replace(bad, good)
    content = content.replace("operator: appt.trattativa.operator", "operator: appt.trattativa.currentOperator")
    content = content.replace("appt.trattativa.commerciale", "appt.trattativa.currentCommerciale")
    with open(path, 'w', encoding='utf-8') as f: f.write(content)

def fix_quotes():
    path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\tl\\quotes\\route.ts'
    with open(path, 'r', encoding='utf-8') as f: content = f.read()
    
    content = content.replace('where: { fileType: "PREVENTIVO" },', 'where: { type: "PREVENTIVO" },')
    
    bad_include = """             include: {
               contact: true,
               commerciale: { select: { id: true, name: true } },
               operator: { select: { id: true, name: true } }
             }"""
    good_include = """             include: {
               contact: true,
               currentCommerciale: { select: { id: true, name: true } },
               currentOperator: { select: { id: true, name: true } }
             }"""
    content = content.replace(bad_include, good_include)
    
    bad_include2 = """         include: {
           contact: true,
           operator: { select: { id: true, name: true } },
           commerciale: { select: { id: true, name: true } }
         },"""
    good_include2 = """         include: {
           contact: true,
           currentOperator: { select: { id: true, name: true } },
           currentCommerciale: { select: { id: true, name: true } }
         },"""
    content = content.replace(bad_include2, good_include2)
    
    content = content.replace("att.trattativa.commerciale", "att.trattativa.currentCommerciale")
    content = content.replace("att.trattativa.operator", "att.trattativa.currentOperator")
    content = content.replace("commerciale: st.commerciale", "commerciale: st.currentCommerciale")
    content = content.replace("operator: st.operator", "operator: st.currentOperator")
    with open(path, 'w', encoding='utf-8') as f: f.write(content)

def fix_reviews():
    path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\tl\\reviews\\route.ts'
    with open(path, 'r', encoding='utf-8') as f: content = f.read()
    
    bad_include = """      include: {
        contact: { select: { name: true, cap: true, originalPhone: true, address: true } },
        operator: { select: { name: true } },
        commerciale: { select: { name: true } }
      }"""
    good_include = """      include: {
        contact: { select: { name: true, cap: true, originalPhone: true, address: true } },
        currentOperator: { select: { name: true } },
        currentCommerciale: { select: { name: true } }
      }"""
    content = content.replace(bad_include, good_include)
    
    content = content.replace("st.contact?.name", "st.contact?.name") # Keep contact
    content = content.replace("st.commerciale?.name", "st.currentCommerciale?.name")
    content = content.replace("st.operator?.name", "st.currentOperator?.name")
    with open(path, 'w', encoding='utf-8') as f: f.write(content)

def fix_trattativa_service():
    path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\lib\\services\\TrattativaService.ts'
    with open(path, 'r', encoding='utf-8') as f: content = f.read()
    
    content = content.replace("&& userRole !== Role.ADMIN", "")
    content = content.replace("fileType: \"PREVENTIVO\"", "type: \"PREVENTIVO\", filename: \"preventivo.pdf\", uploadedById: userId")
    with open(path, 'w', encoding='utf-8') as f: f.write(content)

fix_appointments()
fix_quotes()
fix_reviews()
fix_trattativa_service()