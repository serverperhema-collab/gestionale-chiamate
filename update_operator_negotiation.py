import sys

path = 'src/app/api/contacts/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add the fetch for existing negotiation
find_neg = """    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });"""

find_neg_new = """    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    let existingNegotiation = null;
    if (body.outcome && body.outcome !== "SKIP") {
      existingNegotiation = await prisma.negotiation.findFirst({
        where: { contactId: id, operatorId: userId, isAbandoned: false }
      });
    }"""

code = code.replace(find_neg, find_neg_new)

# Replace the creation logic
old_neg_logic = """      } else if (outcome === "NEGOTIATION") {
        contactUpdateData.hiddenUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 anno
        transaction.push(prisma.negotiation.create({
          data: {
            contactId: id,
            operatorId: userId,
            reason: notes,
            recallDate: new Date(recallDate),
            isApproved: true // Auto-approved recall
          }
        }));"""

new_neg_logic = """      } else if (outcome === "NEGOTIATION") {
        contactUpdateData.hiddenUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 anno
        
        if (existingNegotiation) {
          transaction.push(prisma.negotiation.update({
            where: { id: existingNegotiation.id },
            data: {
              recallDate: new Date(recallDate),
              reason: existingNegotiation.reason + "\\n---\\nAggiornamento (" + new Date().toLocaleString("it-IT") + "): " + notes
            }
          }));
        } else {
          transaction.push(prisma.negotiation.create({
            data: {
              contactId: id,
              operatorId: userId,
              reason: notes,
              recallDate: new Date(recallDate),
              isApproved: true // Auto-approved recall
            }
          }));
        }"""

code = code.replace(old_neg_logic, new_neg_logic)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
