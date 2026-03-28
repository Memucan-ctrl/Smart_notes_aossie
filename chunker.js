const fs = require('fs').promises;
const path = require('path');

class NoteChunker {
    constructor(minWords = 150, maxWords = 200) {
        this.minWords = minWords;
        this.maxWords = maxWords;
    }

    async loadNotes(notesDir) {
        try {
            const files = await fs.readdir(notesDir);
            const txtAndMdFiles = files.filter(file => 
                file.endsWith('.txt') || file.endsWith('.md')
            );
            
            const notes = [];
            for (const file of txtAndMdFiles) {
                const filePath = path.join(notesDir, file);
                const content = await fs.readFile(filePath, 'utf-8');
                notes.push({
                    source: file,
                    content: content
                });
            }
            
            return notes;
        } catch (error) {
            console.error('Error loading notes:', error.message);
            return [];
        }
    }

    chunkText(text, source) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const chunks = [];
        
        if (words.length === 0) {
            return chunks;
        }

        let start = 0;
        
        while (start < words.length) {
            let end = start + this.minWords;
            
            if (end >= words.length) {
                end = words.length;
            } else {
                end = Math.min(start + this.maxWords, words.length);
                
                if (end < words.length) {
                    let periodIndex = -1;
                    for (let i = end; i > Math.max(start + this.minWords, end - 20); i--) {
                        if (words[i - 1].endsWith('.') || words[i - 1].endsWith('!') || words[i - 1].endsWith('?')) {
                            periodIndex = i;
                            break;
                        }
                    }
                    if (periodIndex !== -1) {
                        end = periodIndex;
                    }
                }
            }

            const chunkWords = words.slice(start, end);
            const chunkText = chunkWords.join(' ');
            
            chunks.push({
                text: chunkText,
                source: source,
                wordCount: chunkWords.length
            });

            if (end === words.length) {
                break;
            }
            
            start = end;
        }
        
        return chunks;
    }

    async processNotes(notesDir) {
        const notes = await this.loadNotes(notesDir);
        const allChunks = [];
        
        for (const note of notes) {
            const chunks = this.chunkText(note.content, note.source);
            allChunks.push(...chunks);
        }
        
        return allChunks;
    }

    async saveChunks(chunks, dbPath) {
        const data = {
            chunks: chunks,
            metadata: {
                totalChunks: chunks.length,
                processedAt: new Date().toISOString()
            }
        };
        
        await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
        console.log(`Saved ${chunks.length} chunks to ${dbPath}`);
    }

    async loadChunks(dbPath) {
        try {
            const data = await fs.readFile(dbPath, 'utf-8');
            const parsed = JSON.parse(data);
            return parsed.chunks || [];
        } catch (error) {
            console.error('Error loading chunks:', error.message);
            return [];
        }
    }
}

module.exports = NoteChunker;
