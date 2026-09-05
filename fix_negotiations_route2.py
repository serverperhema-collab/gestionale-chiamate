import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\operator\\negotiations\\route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_include = """        operator: { select: { id: true, name: true } }"""
good_include = """        currentOperator: { select: { id: true, name: true } }"""

content = content.replace(bad_include, good_include)

bad_map = """      contact: st.contact,
      operator: st.operator,"""
good_map = """      contact: st.contact,
      operator: st.currentOperator,"""

content = content.replace(bad_map, good_map)

# Also fix the array spread typing error by forcing type:
bad_assign = """    mappedNegotiations = [...mappedNegotiations, ...mappedSTs].sort((a, b) =>"""
good_assign = """    mappedNegotiations = [...mappedNegotiations, ...mappedSTs] as any;
    mappedNegotiations.sort((a, b) =>"""

content = content.replace(bad_assign, good_assign)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)