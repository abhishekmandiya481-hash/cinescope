const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeWikipedia() {
    try {
        const url = 'https://en.wikipedia.org/wiki/2024_in_film';
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        
        // Wikipedia Tables often have class "wikitable"
        const titles = [];
        $('.wikitable').first().find('tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length > 0) {
                // Usually the first or second column is the title
                // In "2024 in film", there's often a "Highest-grossing films" table at the top
                const title = $(cells[1]).text().trim();
                if (title && !title.match(/^\d+$/)) {
                    titles.push(title);
                }
            }
        });
        
        console.log("Found Titles:", titles.slice(0, 10));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

scrapeWikipedia();
