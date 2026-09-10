with open('src/app/api/users/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
    const url = new URL(req.url);
    const roleParam = url.searchParams.get('role');
    const whereClause = roleParam ? { role: roleParam as any, isActive: true } : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
"""
content = content.replace(
    'const users = await prisma.user.findMany({\n      orderBy: { createdAt: "desc" },',
    replacement
)

with open('src/app/api/users/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
