const cheerio = require('cheerio');

async function test() {
    const url = 'https://www.bing.com/search?q=' + encodeURIComponent('"Tenuta Tudini" Marino telefono');
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const text = $('#b_results').text();
    const regex = /(?:\+39|0039)?\s*([03]\d{1,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4})/g;
    const matches = text.match(regex);
    console.log(matches ? matches.slice(0, 5) : "Nessun match");
}

test();
