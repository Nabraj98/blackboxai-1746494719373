const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

class Analyzer {
    constructor() {
        this.tfidf = new TfIdf();
        this.stopWords = new Set([
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for',
            'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on',
            'that', 'the', 'to', 'was', 'were', 'will', 'with'
        ]);
    }

    async analyze(pages) {
        try {
            // Build TF-IDF matrix from hierarchical content map
            pages.forEach((page, index) => {
                const content = this.getPageContentFromMap(page.contentMap);
                this.tfidf.addDocument(content);
            });

            const results = [];
            
            // Analyze each page for linking opportunities using topic clusters
            pages.forEach((sourcePage, sourceIndex) => {
                const sourceTopics = this.extractTopics(sourcePage.contentMap);
                
                pages.forEach((targetPage, targetIndex) => {
                    if (sourceIndex === targetIndex) return;
                    
                    if (this.hasExistingLink(sourcePage, targetPage.url)) return;
                    
                    const similarity = this.calculateSimilarity(sourceIndex, targetIndex);
                    const targetTopics = this.extractTopics(targetPage.contentMap);
                    const commonTopics = this.findCommonTopics(sourceTopics, targetTopics);
                    
                    if (similarity > 0.1 && commonTopics.length > 0) {
                        results.push({
                            sourcePage: sourcePage.url,
                            sourceTitle: sourcePage.title,
                            targetPage: targetPage.url,
                            targetTitle: targetPage.title,
                            suggestedAnchor: this.getSuggestedAnchor(commonTopics, targetPage),
                            similarity: similarity,
                            commonTopics: commonTopics,
                            score: this.calculateScore(similarity, commonTopics.length)
                        });
                    }
                });
            });

            return results.sort((a, b) => b.score - a.score);
        } catch (error) {
            console.error('Analysis error:', error);
            throw new Error('Failed to analyze content');
        }
    }

    getPageContentFromMap(contentMap) {
        // Flatten content map to text for TF-IDF
        return contentMap.map(section => {
            const headingText = section.heading ? section.heading.text : '';
            const paragraphsText = section.paragraphs.join(' ');
            return (headingText + ' ' + paragraphsText).toLowerCase();
        }).join(' ');
    }

    extractTopics(contentMap) {
        // Extract main topics and subtopics as keywords from content map
        const topics = [];
        contentMap.forEach(section => {
            if (section.heading) {
                const headingKeywords = this.extractKeywords(section.heading.text);
                const paragraphKeywords = this.extractKeywords(section.paragraphs.join(' '));
                topics.push(...headingKeywords, ...paragraphKeywords);
            }
        });
        // Remove duplicates
        return [...new Set(topics)];
    }

    findCommonTopics(topics1, topics2) {
        const set1 = new Set(topics1);
        return topics2.filter(topic => set1.has(topic));
    }

    extractKeywords(text) {
        const tokens = tokenizer.tokenize(text);
        return tokens
            .filter(token => !this.stopWords.has(token.toLowerCase()))
            .filter(token => token.length > 2);
    }

    hasExistingLink(page, targetUrl) {
        return page.links.some(link => link === targetUrl);
    }

    calculateSimilarity(doc1Index, doc2Index) {
        let similarity = 0;
        this.tfidf.listTerms(doc1Index).forEach(item1 => {
            this.tfidf.listTerms(doc2Index).forEach(item2 => {
                if (item1.term === item2.term) {
                    similarity += (item1.tfidf * item2.tfidf);
                }
            });
        });
        return similarity;
    }

    getSuggestedAnchor(commonTopics, targetPage) {
        // Try to find relevant phrase from target page title matching common topics
        const titleWords = this.extractKeywords(targetPage.title);
        const titleMatch = titleWords.filter(word => commonTopics.includes(word));
        
        if (titleMatch.length > 0) {
            return titleMatch.join(' ');
        }
        
        // Fallback to common topics
        return commonTopics.slice(0, 3).join(' ');
    }

    calculateScore(similarity, topicOverlap) {
        return (similarity * 0.7) + (topicOverlap * 0.3);
    }
}

module.exports = new Analyzer();
