const fs = require('fs');

const run = () => {
    const files = ['events/route.ts', 'planner/route.ts', 'queries/route.ts', 'stats/route.ts'];
    files.forEach(f => { 
        const p = 'src/app/api/scrape/v2/jobs/[jobId]/' + f; 
        if(fs.existsSync(p)) {
            let c = fs.readFileSync(p, 'utf8'); 
            c = c.replace(/import prisma from ['"].*?prisma['"];/g, "import { prisma } from '@/lib/prisma';"); 
            fs.writeFileSync(p, c); 
        }
    });
    
    // queries implicit any
    const q = 'src/app/api/scrape/v2/jobs/[jobId]/queries/route.ts';
    if(fs.existsSync(q)) {
        let c = fs.readFileSync(q, 'utf8'); 
        c = c.replace(/\(item\) =>/g, "(item: any) =>"); 
        fs.writeFileSync(q, c); 
    }
}
run();
