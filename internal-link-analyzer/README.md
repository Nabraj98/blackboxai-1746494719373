# Internal Link Analyzer

A Node.js web application that helps users find internal linking opportunities on their website. The tool crawls web pages, analyzes content, and suggests relevant internal links to improve site structure and SEO.

## Features

- 🔍 Crawls internal pages (limited to same domain)
- 📝 Extracts content from `<p>`, `<h1-h6>`, and main article body
- 🔗 Finds potential interlinking opportunities
- 📊 Performs semantic analysis to detect related topics
- 🎯 Prioritizes suggestions by content similarity and page importance
- 🔍 Detects orphan pages and pages with low outbound links
- 📈 Shows page authority scores
- 📑 Exports detailed CSV reports

## Tech Stack

- Backend: Node.js + Express
- Frontend: EJS + Tailwind CSS
- Web Crawling: axios + cheerio
- Content Analysis: natural (NLP)
- CSV Export: json2csv

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
node app.js
```

2. Open your browser and visit:
```
http://localhost:8000
```

3. Enter a website URL to analyze
4. View the results in three tabs:
   - Link Suggestions
   - Orphan Pages
   - Page Authority
5. Export results to CSV for detailed analysis

## Limitations

- Maximum 50 pages crawled per analysis (for demo purposes)
- Respects robots.txt and crawl delays
- Only analyzes pages within the same domain
- Requires proper URL formatting (including protocol)

## Analysis Features

### Link Suggestions
- Shows source page, target page, and suggested anchor text
- Provides similarity scores and common keywords
- Highlights orphan pages and pages with low outbound links

### Orphan Pages
- Lists pages with no incoming internal links
- Shows outbound link count for each page
- Helps identify isolated content

### Page Authority
- Calculates authority scores based on internal link structure
- Shows incoming and outgoing link counts
- Identifies important pages for link distribution

## CSV Export

The exported CSV report includes:
- All link suggestions with scores and metadata
- Complete list of orphan pages
- Pages with low outbound links
- Page authority scores and metrics

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC
