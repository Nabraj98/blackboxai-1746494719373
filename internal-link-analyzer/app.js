const express = require('express');
const path = require('path');
const crawler = require('./utils/crawler');
const analyzer = require('./utils/analyzer');
const postAnalysis = require('./utils/postAnalysis');
const exportCsv = require('./utils/exportCsv');

const app = express();
const port = 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.render('index', { results: null, error: null });
});

app.post('/analyze', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            throw new Error('URL is required');
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            throw new Error('Invalid URL format. Please include http:// or https://');
        }

        console.log(`Starting analysis for: ${url}`);

        // Crawl the website
        const pages = await crawler.crawl(url);
        console.log(`Crawled ${pages.length} pages`);
        
        // Analyze content and find linking opportunities
        const analysis = await analyzer.analyze(pages);
        console.log('Content analysis completed');
        
        // Perform post-analysis
        const results = await postAnalysis.process(analysis);
        console.log('Post-analysis completed');

        res.render('index', { results, error: null });
    } catch (error) {
        console.error('Analysis error:', error);
        res.render('index', { results: null, error: error.message });
    }
});

app.get('/export-csv', async (req, res) => {
    try {
        const results = req.query.data ? JSON.parse(req.query.data) : [];
        const csv = await exportCsv.generate(results);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=internal-links-report.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).send('Error generating CSV');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
