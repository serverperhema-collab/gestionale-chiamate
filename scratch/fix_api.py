import re

with open('src/app/api/tl/contacts/all/route.ts', 'r', encoding='utf-8') as f:
    c = f.read()

bad_api = """    if (status) {
      if (status === "ASSIGNED") {
        where.assignedToId = { not: null };
      } else if (status === "FREE") {
        where.assignedToId = null;
        where.isKo = false;
        where.OR = [
          { hiddenUntil: null },
          { hiddenUntil: { lt: new Date() } }
        ];
      } else if (status === "KO") {
        where.isKo = true;
      } else if (status === "HIDDEN") {
        where.hiddenUntil = { gt: new Date() };
      }
    }"""

good_api = """    if (status) {
      if (status === "ASSIGNED") {
        where.assignedToId = { not: null };
      } else if (status === "FREE") {
        where.assignedToId = null;
        where.isKo = false;
        where.blacklisted = false;
        where.OR = [
          { hiddenUntil: null },
          { hiddenUntil: { lt: new Date() } }
        ];
      } else if (status === "KO") {
        where.isKo = true;
      } else if (status === "HIDDEN") {
        where.hiddenUntil = { gt: new Date() };
      } else if (status === "CESTINO") {
        where.blacklisted = true;
      }
    } else {
      where.blacklisted = false;
    }"""

c = c.replace(bad_api, good_api)

with open('src/app/api/tl/contacts/all/route.ts', 'w', encoding='utf-8') as f:
    f.write(c)

print('Fixed API')
