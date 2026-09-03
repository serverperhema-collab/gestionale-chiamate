# -*- coding: utf-8 -*-
import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = """className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${deleteAction === 'RESTORE' ? 'bg-indigo-900/20 border-indigo-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}""""
replacement1 = """className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${deleteAction === 'RESTORE' ? 'bg-indigo-900/20 border-indigo-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}"""
code = code.replace(target1, replacement1)

target2 = """className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${deleteAction === 'BLOCK' ? 'bg-orange-900/20 border-orange-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}""""
replacement2 = """className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${deleteAction === 'BLOCK' ? 'bg-orange-900/20 border-orange-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}"""
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)