class Retriever {
    constructor() {
        this.topK = 3;
    }

    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    calculateScore(chunk, queryWords) {
        const chunkWords = this.tokenize(chunk.text);
        const chunkWordSet = new Set(chunkWords);
        
        let score = 0;
        for (const queryWord of queryWords) {
            if (chunkWordSet.has(queryWord)) {
                score++;
            }
        }
        
        const uniqueMatches = queryWords.filter(word => chunkWordSet.has(word)).length;
        score = uniqueMatches / queryWords.length;
        
        return score;
    }

    retrieve(query, chunks) {
        if (!query || query.trim() === '') {
            return [];
        }

        const queryWords = this.tokenize(query);
        
        if (queryWords.length === 0) {
            return [];
        }

        const scoredChunks = chunks.map(chunk => ({
            ...chunk,
            score: this.calculateScore(chunk, queryWords)
        }));

        scoredChunks.sort((a, b) => b.score - a.score);

        const topChunks = scoredChunks.slice(0, this.topK);
        
        return topChunks.filter(chunk => chunk.score > 0);
    }

    buildContext(chunks) {
        if (chunks.length === 0) {
            return '';
        }

        const contexts = chunks.map(chunk => 
            `[Source: ${chunk.source}]\n${chunk.text}`
        );
        
        return contexts.join('\n\n---\n\n');
    }
}

module.exports = Retriever;
