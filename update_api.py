import sys

path = 'src/app/api/tl/outcomes/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """    let whereClause: any = {
      status: { notIn: ["CANCELLED"] }
    };"""

replacement = """    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    let whereClause: any = {
      status: { notIn: ["CANCELLED"] }
    };
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) {
        const ed = new Date(endDate);
        ed.setUTCHours(23, 59, 59, 999);
        whereClause.date.lte = ed;
      }
    }"""
    
code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
