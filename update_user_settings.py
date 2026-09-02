# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/users/[id]/settings/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """    const {
      alertSkipLock,
      alertNoAnswerLock,
      alertNotAvailableLock,
      alertModLock,"""

replacement = """    const {
      isTrusted,
      alertSkipLock,
      alertNoAnswerLock,
      alertNotAvailableLock,
      alertModLock,"""
code = code.replace(target, replacement)

target2 = """    await prisma.user.update({
      where: { id },
      data: {
        alertSkipLock,
        alertNoAnswerLock,
        alertNotAvailableLock,"""

replacement2 = """    await prisma.user.update({
      where: { id },
      data: {
        isTrusted,
        alertSkipLock,
        alertNoAnswerLock,
        alertNotAvailableLock,"""
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)