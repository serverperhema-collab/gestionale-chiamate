const q = "Ristorante La Pergola Roma telefono";
const https = require('https');

async function test() {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
        }
    });
    const html = await res.text();
    if (html.includes('captcha') || html.includes('bot')) {
        console.log("BLOCCATO DA DUCKDUCKGO");
        return;
    }
    const { load } = require('cheerio');
    const $ = load(html);
    const testoSnippet = $('.result__snippet').text();
    console.log("Snippet:", testoSnippet.substring(0, 500));
    
    // Improved regex
    const regex = /(?:\+39|0039)?\s*([03]\d{1,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4})/g;
    const matches = testoSnippet.match(regex);
    if (matches) {
        console.log("Trovati:", matches);
    }
}
test();
