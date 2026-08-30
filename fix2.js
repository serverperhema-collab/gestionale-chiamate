const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const run = () => {
    // 1. Fix absolute API imports
    walkDir('src/app/api', (filePath) => {
        if (filePath.endsWith('.ts')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let updated = content.replace(/import\s+\{\s*prisma\s*\}\s+from\s+['"].*?gestionale_estrazioni[\\\/]src[\\\/]lib[\\\/]prisma['"]/g, "import { prisma } from '@/lib/prisma'");
            if (updated !== content) {
                fs.writeFileSync(filePath, updated);
            }
        }
    });

    // 2. Fix src/app/api/scrape/route.ts
    const scrapeRoutePath = 'src/app/api/scrape/route.ts';
    if (fs.existsSync(scrapeRoutePath)) {
        let content = fs.readFileSync(scrapeRoutePath, 'utf8');
        // Revert any weird duplicates
        content = content.replace(/placeId:\s*l\.place_id,\s*source:\s*'GOOGLE',\s*sourceId:\s*l\.place_id,\s*source:\s*'GOOGLE',\s*sourceId:\s*l\.place_id/g, "placeId: l.place_id, source: 'GOOGLE', sourceId: l.place_id");
        // Fix line 362, 363 duplicate properties
        content = content.replace(/source:\s*'GOOGLE',\s*sourceId:\s*l\.place_id,\s*source:\s*'GOOGLE',\s*sourceId:\s*l\.place_id,/g, "source: 'GOOGLE', sourceId: l.place_id,");
        
        // Fix line 457 ContactCreateInput
        content = content.replace(/placeId:\s*place\.place_id,\s*name:/g, "placeId: place.place_id, source: 'GOOGLE', sourceId: place.place_id, name:");
        // Ensure no multiple sources
        content = content.replace(/(source:\s*'GOOGLE',\s*sourceId:\s*place\.place_id,\s*)+/g, "source: 'GOOGLE', sourceId: place.place_id, ");

        fs.writeFileSync(scrapeRoutePath, content);
    }
    
    // 3. Fix contacts/manual/route.ts
    const manualRoutePath = 'src/app/api/contacts/manual/route.ts';
    if (fs.existsSync(manualRoutePath)) {
        let content = fs.readFileSync(manualRoutePath, 'utf8');
        content = content.replace(/placeId:\s*id,\s*name:/g, "placeId: id, source: 'MANUAL', sourceId: id, name:");
        fs.writeFileSync(manualRoutePath, content);
    }

    // 4. next.config.ts eslint
    const nextConfigPath = 'next.config.ts';
    if (fs.existsSync(nextConfigPath)) {
        let content = fs.readFileSync(nextConfigPath, 'utf8');
        content = content.replace(/eslint:\s*\{[^}]*\}/g, ""); // Just remove eslint block
        fs.writeFileSync(nextConfigPath, content);
    }
};

run();
