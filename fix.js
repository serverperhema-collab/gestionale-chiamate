const fs = require('fs');

const run = () => {
    // 1. Fix API imports
    const apiDirs = ['events', 'planner', 'queries', 'stats', ''];
    apiDirs.forEach(dir => {
        const path = `src/app/api/scrape/v2/jobs/[jobId]${dir ? '/' + dir : ''}/route.ts`;
        if (fs.existsSync(path)) {
            let content = fs.readFileSync(path, 'utf8');
            content = content.replace(/import \{ prisma \} from ['"]C:\/Users\/maggi\/\.gemini\/antigravity\/scratch\/gestionale_estrazioni\/src\/lib\/prisma['"];/g, "import { prisma } from '@/lib/prisma';");
            fs.writeFileSync(path, content);
        }
    });

    // 2. Fix findUnique placeId to findFirst placeId in src/app/api/scrape/route.ts
    const scrapeRoutePath = 'src/app/api/scrape/route.ts';
    if (fs.existsSync(scrapeRoutePath)) {
        let content = fs.readFileSync(scrapeRoutePath, 'utf8');
        content = content.replace(/findUnique\(\{\s*where:\s*\{\s*placeId:\s*(.*?)\s*\}\s*\}\)/g, "findFirst({ where: { placeId: $1 } })");
        content = content.replace(/findUnique\(\{\s*where:\s*\{\s*placeId\s*\}\s*\}\)/g, "findFirst({ where: { placeId } })");
        
        // Fix ContactCreate missing sourceId
        content = content.replace(/placeId: (.*?),(\s*)name:/g, "placeId: $1,$2source: 'GOOGLE',$2sourceId: $1,$2name:");
        
        fs.writeFileSync(scrapeRoutePath, content);
    }

    // 3. Fix extraction/route.ts
    const extractRoutePath = 'src/app/api/extraction/route.ts';
    if (fs.existsSync(extractRoutePath)) {
        let content = fs.readFileSync(extractRoutePath, 'utf8');
        content = content.replace(/placeId:\s*(.*?),\s*name:/g, "placeId: $1, source: 'OSM', sourceId: $1, name:");
        fs.writeFileSync(extractRoutePath, content);
    }
    
    // 4. Fix appointments/create/route.ts
    const apptCreatePath = 'src/app/api/tl/appointments/create/route.ts';
    if (fs.existsSync(apptCreatePath)) {
        let content = fs.readFileSync(apptCreatePath, 'utf8');
        content = content.replace(/placeId:\s*(.*?),\s*name:/g, "placeId: $1, source: 'MANUAL', sourceId: $1, name:");
        fs.writeFileSync(apptCreatePath, content);
    }

    // 5. Fix live-monitor routes (CallOutcome vs REVIEW_REQUEST)
    const monitorPaths = ['src/app/api/tl/live-monitor/report/route.ts', 'src/app/api/tl/live-monitor/route.ts'];
    monitorPaths.forEach(path => {
        if (fs.existsSync(path)) {
            let content = fs.readFileSync(path, 'utf8');
            content = content.replace(/outcome === 'REVIEW_REQUEST'/g, "outcome === ('REVIEW_REQUEST' as any)");
            content = content.replace(/details:\s*a\.details/g, ""); // Remove details mapping as it doesn't exist
            fs.writeFileSync(path, content);
        }
    });

    // 6. Fix operator-terminal/page.tsx
    const opTermPath = 'src/app/operator-terminal/page.tsx';
    if (fs.existsSync(opTermPath)) {
        let content = fs.readFileSync(opTermPath, 'utf8');
        content = content.replace(/onClick=\{fetchNextContact\}/g, "onClick={() => fetchNextContact()}");
        fs.writeFileSync(opTermPath, content);
    }
    
    console.log('Fixes applied.');
};

run();
