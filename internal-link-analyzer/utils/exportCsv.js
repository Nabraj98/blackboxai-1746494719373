const { Parser } = require('json2csv');

class CsvExporter {
    async generate(results) {
        try {
            const { suggestions, orphanPages, lowOutboundPages, authorityScores } = results;

            // Prepare data for CSV export
            const csvData = suggestions.map(result => ({
                'Source Page': result.sourcePage,
                'Source Title': result.sourceTitle,
                'Target Page': result.targetPage,
                'Target Title': result.targetTitle,
                'Suggested Anchor Text': result.suggestedAnchor,
                'Similarity Score': result.similarity.toFixed(3),
                'Common Keywords': result.commonKeywords.join(', '),
                'Priority Score': result.priority.toFixed(3),
                'Source is Orphan': result.sourceIsOrphan ? 'Yes' : 'No',
                'Target is Orphan': result.targetIsOrphan ? 'Yes' : 'No',
                'Source Low Outbound': result.sourceLowOutbound ? 'Yes' : 'No',
                'Source Authority': result.sourceAuthority.toFixed(3),
                'Target Authority': result.targetAuthority.toFixed(3)
            }));

            // Add summary sections
            const orphanSection = this.createOrphanSection(orphanPages);
            const lowOutboundSection = this.createLowOutboundSection(lowOutboundPages);
            const authoritySection = this.createAuthoritySection(authorityScores);

            // Combine all sections
            const allData = [
                ...csvData,
                { 'Source Page': '' }, // Empty row as separator
                ...orphanSection,
                { 'Source Page': '' }, // Empty row as separator
                ...lowOutboundSection,
                { 'Source Page': '' }, // Empty row as separator
                ...authoritySection
            ];

            // Define fields for CSV
            const fields = [
                'Source Page',
                'Source Title',
                'Target Page',
                'Target Title',
                'Suggested Anchor Text',
                'Similarity Score',
                'Common Keywords',
                'Priority Score',
                'Source is Orphan',
                'Target is Orphan',
                'Source Low Outbound',
                'Source Authority',
                'Target Authority'
            ];

            // Generate CSV
            const parser = new Parser({ fields });
            return parser.parse(allData);

        } catch (error) {
            console.error('CSV export error:', error);
            throw new Error('Failed to generate CSV export');
        }
    }

    createOrphanSection(orphanPages) {
        return [
            { 'Source Page': '=== ORPHAN PAGES ===' },
            ...orphanPages.map(page => ({
                'Source Page': page.url,
                'Source Title': page.title,
                'Target Page': `Outbound Links: ${page.outboundCount}`
            }))
        ];
    }

    createLowOutboundSection(lowOutboundPages) {
        return [
            { 'Source Page': '=== PAGES WITH LOW OUTBOUND LINKS ===' },
            ...lowOutboundPages.map(page => ({
                'Source Page': page.url,
                'Source Title': page.title,
                'Target Page': `Outbound: ${page.outboundCount}, Inbound: ${page.inboundCount}`
            }))
        ];
    }

    createAuthoritySection(authorityScores) {
        return [
            { 'Source Page': '=== PAGE AUTHORITY SCORES ===' },
            ...authorityScores.slice(0, 10).map(page => ({
                'Source Page': page.url,
                'Source Title': page.title,
                'Target Page': `Authority: ${page.score.toFixed(3)}, In: ${page.inboundCount}, Out: ${page.outboundCount}`
            }))
        ];
    }
}

module.exports = new CsvExporter();
