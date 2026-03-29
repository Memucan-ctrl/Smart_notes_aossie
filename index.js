/**
 * Smart Notes MVP - Main Entry Point
 * A modular, offline-first RAG system for local notes
 */

const path = require('path');
const VaultStorage = require('./src/storage');
const Indexer = require('./src/indexing');
const Retriever = require('./src/retrieval');
const AIClient = require('./src/ai');
const VaultWatcher = require('./src/watcher');
const Server = require('./src/server');

class SmartNotes {
    constructor() {
        this.baseDir = path.join(__dirname);
        this.vaultPath = path.join(this.baseDir, 'vault');
        this.dbPath = path.join(this.baseDir, 'db.json');
        this.publicDir = path.join(this.baseDir, 'public');

        this.storage = new VaultStorage(this.vaultPath);
        this.indexer = new Indexer({ minWords: 150, maxWords: 200 });
        this.retriever = new Retriever({ topK: 3 });
        this.ai = new AIClient({ model: 'qwen2.5-coder:1.5b' });
        
        this.watcher = new VaultWatcher({
            vaultPath: this.vaultPath,
            onChange: (event, filename) => this.handleFileChange(event, filename)
        });

        this.server = new Server(
            {
                storage: this.storage,
                indexer: this.indexer,
                retriever: this.retriever,
                ai: this.ai,
                watcher: this.watcher
            },
            {
                port: process.env.PORT || 3000,
                publicDir: this.publicDir
            }
        );
    }

    /**
     * Handles file changes detected by the watcher
     * @param {string} event - Event type (added, modified, deleted)
     * @param {string} filename - Changed file name
     */
    async handleFileChange(event, filename) {
        console.log(`File ${event}: ${filename} - Reindexing...`);
        await this.reindex();
    }

    /**
     * Reindexes all notes from the vault
     */
    async reindex() {
        try {
            const notes = await this.storage.readAllNotes();
            const chunks = this.indexer.processNotes(notes);
            await this.indexer.saveChunks(chunks, this.dbPath);
            this.server.setChunks(chunks);
            console.log(`Reindexed ${chunks.length} chunks from ${notes.length} notes`);
        } catch (error) {
            console.error('Reindex error:', error);
        }
    }

    /**
     * Loads existing chunks from database
     */
    async loadChunks() {
        return await this.indexer.loadChunks(this.dbPath);
    }

    /**
     * Starts the Smart Notes application
     */
    async start() {
        console.log('═══════════════════════════════════════');
        console.log('        Smart Notes MVP - Starting');
        console.log('═══════════════════════════════════════\n');

        await this.storage.ensureVaultExists();

        const ollamaConnected = await this.ai.checkConnection();
        if (ollamaConnected) {
            console.log('✓ Ollama server is running');
        } else {
            console.warn('✗ Ollama server is not running');
            console.warn('  Start with: ollama serve\n');
        }

        let chunks = await this.loadChunks();
        
        if (chunks.length === 0) {
            console.log('No existing index found, creating initial index...');
            await this.reindex();
            chunks = await this.loadChunks();
        } else {
            console.log(`✓ Loaded ${chunks.length} chunks from database`);
        }

        this.server.setChunks(chunks);

        await this.server.start();

        console.log('\nEndpoints:');
        console.log('  GET  /              - Web interface');
        console.log('  POST /api/ask       - Ask questions');
        console.log('  GET  /api/health    - Server health');
        console.log('  GET  /api/sources   - List notes');
        console.log('  GET  /api/chunks    - View chunks');
        console.log('  POST /api/reindex   - Reindex notes');
        console.log('  GET  /api/notes     - List notes (detailed)');
        console.log('  POST /api/notes     - Create note');
        console.log('\nFile watching enabled for automatic reindexing\n');

        process.on('SIGINT', () => {
            console.log('\nShutting down...');
            this.server.stop();
            process.exit(0);
        });
    }
}

const app = new SmartNotes();
app.start().catch(error => {
    console.error('Failed to start Smart Notes:', error);
    process.exit(1);
});
