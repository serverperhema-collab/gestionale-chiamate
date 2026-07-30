const fs = require('fs');
const path = require('path');

async function run() {
    const dataPath = path.join(__dirname, 'src/data/lazio_caps.json');
    const outPath = path.join(__dirname, 'src/data/lazio_coords.json');
    const lazioData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Controlliamo se esiste già lazio_coords.json
    let coordsDict = {};
    if (fs.existsSync(outPath)) {
        try {
            coordsDict = JSON.parse(fs.readFileSync(outPath, 'utf8'));
        } catch(e) {}
    }

    // Estrarre TUTTI i CAP del Lazio
    let lazioCaps = [];
    lazioData.forEach(d => {
        d.cap.forEach(c => lazioCaps.push(c));
    });

    console.log(`Trovati ${lazioCaps.length} CAP in tutto il Lazio. Inizio Geocoding...`);

    for (let i = 0; i < lazioCaps.length; i++) {
        const c = lazioCaps[i];
        if (coordsDict[c]) continue; // skip already fetched

        try {
            const url = `https://nominatim.openstreetmap.org/search?postalcode=${c}&country=Italy&format=json`;
            const res = await fetch(url, { headers: { 'User-Agent': 'DataScraper-Pro/1.0' }});
            const json = await res.json();
            if (json && json.length > 0) {
                coordsDict[c] = { lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) };
                console.log(`Geocoded ${c}: ${json[0].lat}, ${json[0].lon}`);
            } else {
                console.log(`No coords for ${c}`);
                // fallback approssimativo (Centro del Lazio / Roma)
                coordsDict[c] = { lat: 41.9028, lon: 12.4964 };
            }
            // Save incrementally
            fs.writeFileSync(outPath, JSON.stringify(coordsDict, null, 2));
            // Rate limit di Nominatim: 1 secondo
            await new Promise(r => setTimeout(r, 1100));
        } catch (err) {
            console.error(`Error geocoding ${c}:`, err.message);
        }
    }
    console.log("Geocoding completato per tutto il Lazio!");
}
run();
