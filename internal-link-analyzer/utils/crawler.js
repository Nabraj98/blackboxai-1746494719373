const axios = require('axios');
const cheerio = require('cheerio');
const URL = require('url').URL;

class Crawler {
    constructor() {
        this.visited = new Set();
        this.pages = new Map();
        this.maxPages = 50; // Limit for demo purposes
    }

    async crawl(startUrl) {
        try {
            // Normalize and validate URL
            const baseUrl = new URL(startUrl);
            console.log(`Starting crawl at: ${baseUrl.href}`);
            
            await this.crawlPage(baseUrl.href, baseUrl);
            
            return Array.from(this.pages.values());
        } catch (error) {
            console.error('Crawl error:', error);
            throw new Error(`Failed to crawl website: ${error.message}`);
        }
    }

    async crawlPage(url, baseUrl) {
        if (this.visited.has(url) || this.visited.size >= this.maxPages) {
            return;
        }

        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            this.visited.add(url);

            // Extract structured content map: headings (H1-H3) with associated paragraphs
            const contentMap = this.extractContentMap($);

            const content = {
                url: url,
                title: $('title').text().trim(),
                contentMap: contentMap,
                links: this.extractLinks($),
                outboundLinks: 0,
                inboundLinks: 0
            };

            this.pages.set(url, content);

            // Find and crawl internal links
            const links = this.extractLinks($);
            for (const link of links) {
                try {
                    const absoluteUrl = new URL(link, baseUrl);
                    if (absoluteUrl.hostname === baseUrl.hostname && 
                        !this.visited.has(absoluteUrl.href) &&
                        this.visited.size < this.maxPages) {
                        await this.crawlPage(absoluteUrl.href, baseUrl);
                    }
                } catch (e) {
                    console.warn(`Invalid URL: ${link}`);
                }
            }
        } catch (error) {
            console.warn(`Failed to crawl ${url}:`, error.message);
        }
    }

    extractContentMap($) {
        // Extract H1-H3 headings and associate paragraphs under each heading
        const contentMap = [];
        let currentSection = { heading: null, paragraphs: [] };

        // Select all H1-H3 and paragraphs in document order
        $('h1, h2, h3, p').each((_, el) => {
            if (['h1', 'h2', 'h3'].includes(el.name)) {
                // Push previous section if exists
                if (currentSection.heading || currentSection.paragraphs.length > 0) {
                    contentMap.push(currentSection);
                }
                // Start new section
                currentSection = {
                    heading: {
                        level: el.name,
                        text: $(el).text().trim()
                    },
                    paragraphs: []
                };
            } else if (el.name === 'p') {
                const text = $(el).text().trim();
                if (text) {
                    currentSection.paragraphs.push(text);
                }
            }
        });

        // Push last section
        if (currentSection.heading || currentSection.paragraphs.length > 0) {
            contentMap.push(currentSection);
        }

        return contentMap;
    }

    extractParagraphs($) {
        const paragraphs = [];
        $('p').each((_, el) => {
            const text = $(el).text().trim();
            if (text) {
                paragraphs.push(text);
            }
        });
        return paragraphs;
    }

    extractLinks($) {
        const links = new Set();
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                links.add(href);
            }
        });
        return Array.from(links);
    }
}

module.exports = new Crawler();
