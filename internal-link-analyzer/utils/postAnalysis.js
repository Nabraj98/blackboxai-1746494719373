class PostAnalyzer {
    async process(analysisResults) {
        try {
            // Build page graph
            const pageGraph = this.buildPageGraph(analysisResults);
            
            // Find orphan pages and pages with low outbound links
            const orphanPages = this.findOrphanPages(pageGraph);
            const lowOutboundPages = this.findLowOutboundPages(pageGraph);
            
            // Calculate page authority scores
            const authorityScores = this.calculateAuthorityScores(pageGraph);
            
            // Enhance results with additional insights
            const enhancedResults = this.enhanceResults(
                analysisResults,
                orphanPages,
                lowOutboundPages,
                authorityScores
            );

            return {
                suggestions: enhancedResults,
                orphanPages,
                lowOutboundPages,
                authorityScores
            };
        } catch (error) {
            console.error('Post-analysis error:', error);
            throw new Error('Failed to process post-analysis');
        }
    }

    buildPageGraph(analysisResults) {
        const graph = new Map();

        // Initialize graph with empty arrays for each page
        analysisResults.forEach(result => {
            if (!graph.has(result.sourcePage)) {
                graph.set(result.sourcePage, {
                    outbound: new Set(),
                    inbound: new Set(),
                    title: result.sourceTitle
                });
            }
            if (!graph.has(result.targetPage)) {
                graph.set(result.targetPage, {
                    outbound: new Set(),
                    inbound: new Set(),
                    title: result.targetTitle
                });
            }
        });

        // Add connections
        analysisResults.forEach(result => {
            graph.get(result.sourcePage).outbound.add(result.targetPage);
            graph.get(result.targetPage).inbound.add(result.sourcePage);
        });

        return graph;
    }

    findOrphanPages(pageGraph) {
        const orphans = [];
        
        pageGraph.forEach((data, url) => {
            if (data.inbound.size === 0) {
                orphans.push({
                    url,
                    title: data.title,
                    outboundCount: data.outbound.size
                });
            }
        });

        return orphans;
    }

    findLowOutboundPages(pageGraph) {
        const threshold = 3; // Pages with less than 3 outbound links are considered low
        const lowOutbound = [];

        pageGraph.forEach((data, url) => {
            if (data.outbound.size < threshold) {
                lowOutbound.push({
                    url,
                    title: data.title,
                    outboundCount: data.outbound.size,
                    inboundCount: data.inbound.size
                });
            }
        });

        return lowOutbound;
    }

    calculateAuthorityScores(pageGraph) {
        const scores = new Map();
        const dampingFactor = 0.85;
        const iterations = 20;

        // Initialize scores
        pageGraph.forEach((_, url) => {
            scores.set(url, 1 / pageGraph.size);
        });

        // Iterate to converge scores
        for (let i = 0; i < iterations; i++) {
            const newScores = new Map();

            pageGraph.forEach((data, url) => {
                let score = (1 - dampingFactor) / pageGraph.size;

                data.inbound.forEach(inboundUrl => {
                    const inboundPage = pageGraph.get(inboundUrl);
                    score += dampingFactor * (scores.get(inboundUrl) / inboundPage.outbound.size);
                });

                newScores.set(url, score);
            });

            scores.clear();
            newScores.forEach((score, url) => scores.set(url, score));
        }

        // Convert to array and sort by score
        return Array.from(scores.entries())
            .map(([url, score]) => ({
                url,
                title: pageGraph.get(url).title,
                score,
                inboundCount: pageGraph.get(url).inbound.size,
                outboundCount: pageGraph.get(url).outbound.size
            }))
            .sort((a, b) => b.score - a.score);
    }

    enhanceResults(analysisResults, orphanPages, lowOutboundPages, authorityScores) {
        const orphanSet = new Set(orphanPages.map(p => p.url));
        const lowOutboundSet = new Set(lowOutboundPages.map(p => p.url));
        const authorityMap = new Map(authorityScores.map(p => [p.url, p.score]));

        return analysisResults.map(result => ({
            ...result,
            sourceIsOrphan: orphanSet.has(result.sourcePage),
            targetIsOrphan: orphanSet.has(result.targetPage),
            sourceLowOutbound: lowOutboundSet.has(result.sourcePage),
            sourceAuthority: authorityMap.get(result.sourcePage),
            targetAuthority: authorityMap.get(result.targetPage),
            priority: this.calculatePriority(
                result,
                orphanSet,
                lowOutboundSet,
                authorityMap
            )
        }));
    }

    calculatePriority(result, orphanSet, lowOutboundSet, authorityMap) {
        let priority = result.score;

        // Boost priority for orphan pages
        if (orphanSet.has(result.targetPage)) {
            priority *= 1.5;
        }

        // Boost priority for low outbound pages
        if (lowOutboundSet.has(result.sourcePage)) {
            priority *= 1.2;
        }

        // Consider page authority
        const sourceAuth = authorityMap.get(result.sourcePage) || 0;
        const targetAuth = authorityMap.get(result.targetPage) || 0;
        priority *= (1 + sourceAuth + targetAuth) / 3;

        return priority;
    }
}

module.exports = new PostAnalyzer();
