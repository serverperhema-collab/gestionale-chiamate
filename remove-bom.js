const fs = require('fs');
['src/app/api/tl/fix-logs/route.ts', 'src/app/api/tl/live-monitor/route.ts'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1); // Remove BOM
    }
    fs.writeFileSync(file, content, 'utf8');
});
