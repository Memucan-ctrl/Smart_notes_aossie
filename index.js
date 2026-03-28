const express = require('express');
const path = require('path');
const NoteChunker = require('./chunker');
const Retriever = require('./retriever');
const OllamaClient = require('./ollama');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NOTES_DIR = path.join(__dirname, 'notes');
const DB_PATH = path.join(__dirname, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.static(PUBLIC_DIR));

app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

const chunker = new NoteChunker(150, 200);
const retriever = new Retriever(3);
const ollama = new OllamaClient();

let chunks = [];

async function processNotes() {
    console.log('Processing notes...');
    try {
        chunks = await chunker.processNotes(NOTES_DIR);
        await chunker.saveChunks(chunks, DB_PATH);
        console.log(`Processed ${chunks.length} chunks from notes`);
    } catch (error) {
        console.error('Error processing notes:', error);
        chunks = await chunker.loadChunks(DB_PATH);
        if (chunks.length === 0) {
            console.error('No chunks found in db.json');
        }
    }
}

app.post('/ask', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || question.trim() === '') {
            return res.status(400).json({ 
                error: 'Question is required' 
            });
        }

        console.log(`\nReceived question: ${question}`);

        const relevantChunks = retriever.retrieve(question, chunks);

        if (relevantChunks.length === 0) {
            return res.json({
                answer: 'I don\'t know. No relevant information found in the notes.',
                sources: []
            });
        }

        console.log(`Found ${relevantChunks.length} relevant chunks`);

        const context = retriever.buildContext(relevantChunks);
        const answer = await ollama.generate(question, context);

        const sources = relevantChunks.map(chunk => chunk.source);

        console.log(`Answer: ${answer.substring(0, 100)}...`);

        res.json({
            answer: answer,
            sources: [...new Set(sources)]
        });

    } catch (error) {
        console.error('Error processing question:', error);
        res.status(500).json({ 
            error: error.message || 'Internal server error' 
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        chunksLoaded: chunks.length 
    });
});

app.get('/sources', (req, res) => {
    const sources = [...new Set(chunks.map(c => c.source))];
    res.json({ sources });
});

app.get('/chunks', (req, res) => {
    res.json({ 
        total: chunks.length,
        chunks: chunks 
    });
});

app.post('/reindex', async (req, res) => {
    try {
        await processNotes();
        res.json({ 
            message: 'Notes reindexed successfully',
            chunksLoaded: chunks.length 
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
});

async function startServer() {
    console.log('Smart Notes MVP - Starting...\n');
    
    const isOllamaRunning = await ollama.checkConnection();
    if (isOllamaRunning) {
        console.log('Ollama server is running');
    } else {
        console.warn('Ollama server is not running. Questions will fail until Ollama is started.');
        console.warn('Start Ollama with: ollama serve\n');
    }

    await processNotes();

    app.listen(PORT, () => {
        console.log(`\nServer running at http://localhost:${PORT}`);
        console.log('\nEndpoints:');
        console.log('  POST /ask       - Ask a question about your notes');
        console.log('  GET  /health     - Check server health');
        console.log('  GET  /sources    - List all note sources');
        console.log('  GET  /chunks     - View all chunks');
        console.log('  POST /reindex    - Reprocess notes\n');
    });
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
