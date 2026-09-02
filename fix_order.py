import sys

path = 'src/app/api/contacts/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

bad_block = """    let existingNegotiation = null;
    if (body.outcome && body.outcome !== "SKIP") {
      existingNegotiation = await prisma.negotiation.findFirst({
        where: { contactId: id, operatorId: userId, isAbandoned: false }
      });
    }

    const body = await req.json();"""

fixed_block = """    const body = await req.json();
    
    let existingNegotiation = null;
    if (body.outcome && body.outcome !== "SKIP") {
      existingNegotiation = await prisma.negotiation.findFirst({
        where: { contactId: id, operatorId: userId, isAbandoned: false }
      });
    }"""

code = code.replace(bad_block, fixed_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
