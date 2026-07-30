const q = process.argv[2] || '"Ristorante Roma" "Via Roma 1" telefono';

async function test() {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    const html = await res.text();
    // Regex for Italian phone numbers (landlines starting with 0, mobiles starting with 3, optional +39)
    const regex = /(?:(?:\+|00)39\s?)?([03]\d{1,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,3})/g;
    const matches = html.match(regex);
    if (matches) {
        // Pulisci e tieni solo i numeri con lunghezza tra 8 e 12
        const valid = matches.map(m => m.trim()).filter(m => {
            const digits = m.replace(/\D/g, '');
            return digits.length >= 8 && digits.length <= 13;
        });
        console.log("Trovati:", [...new Set(valid)]);
    } else {
        console.log("Nessun numero trovato.");
    }
}
test();
