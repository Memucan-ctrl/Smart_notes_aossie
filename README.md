# Smart Notes MVP

A **modular, offline-first RAG system** for local notes powered by Ollama. Chat with your notes using AI - everything runs locally.

## Features

- **Vault-based Storage**: Store notes as `.md` files in the `vault/` folder
- **Rich Text Editor**: TipTap-powered editor with formatting toolbar
- **Auto-Indexing**: Automatic re-indexing when files change (chokidar)
- **RAG Pipeline**: Keyword retrieval + Ollama AI generation
- **Modular Architecture**: Clean separation for easy extension
- **Local-first**: No external APIs - runs entirely on your machine

## Project Structure

```
Smart notes/
├── index.js              # Main entry point
├── package.json          # Dependencies
├── build-editor.js       # TipTap bundle builder
├── db.json              # Indexed chunks (auto-generated)
├── src/
│   ├── storage/         # Vault operations (CRUD)
│   ├── indexing/        # Note chunking (150-200 words)
│   ├── retrieval/       # Keyword-based retrieval
│   ├── ai/             # Ollama integration
│   ├── watcher/        # File system watcher (chokidar)
│   └── server/          # Express API server
├── public/
│   ├── index.html      # Web interface
│   └── vendor/
│       └── editor.js   # Bundled TipTap editor
└── vault/              # Your notes (.md files)
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Editor (first time only)
```bash
npm run build-editor
```
Or: `node build-editor.js`

### 3. Start Ollama (if not running)
```bash
ollama serve
```

### 4. Start the Server
```bash
npm start
```

### 5. Open Browser
Navigate to: `http://localhost:3000`

## Usage

### Creating Notes
1. Click **+ New Note** in the Notes panel
2. Enter a filename (e.g., `my-notes.md`)
3. Use the toolbar to format text (Bold, Italic, Headings, Lists, etc.)
4. Click **Save**

### Asking Questions
1. Type your question in the chat input
2. Press Enter or click Send
3. The AI answers based on your notes
4. Sources are shown below the answer

### Editing/Deleting Notes
- Click **Edit** on any note to modify it
- Click **Del** to delete a note
- Auto-indexing updates the search index automatically

## API Endpoints

### Chat & Retrieval
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ask` | Ask a question about your notes |
| GET | `/api/health` | Server status and health check |

### Note Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | List all notes |
| GET | `/api/notes/:filename` | Read a specific note |
| POST | `/api/notes` | Create a new note |
| PUT | `/api/notes/:filename` | Update a note |
| DELETE | `/api/notes/:filename` | Delete a note |

### Indexing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sources` | List all note sources |
| GET | `/api/chunks` | View all indexed chunks |
| POST | `/api/reindex` | Manually trigger re-indexing |

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                         User Query                          │
│                     "What is Node.js?"                      │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      RETRIEVAL LAYER                        │
│  1. Tokenize query into keywords                           │
│  2. Score each chunk by keyword overlap                     │
│  3. Return top-3 most relevant chunks                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       AI LAYER (Ollama)                    │
│  Build prompt with retrieved context                        │
│  Send to qwen2.5-coder:1.5b model                          │
│  Return generated answer                                    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
                    Answer + Sources
```

## Architecture

### Storage Module (`src/storage/`)
- **Purpose**: CRUD operations for vault files
- **Methods**: `listNotes()`, `readNote()`, `writeNote()`, `deleteNote()`
- **Location**: `vault/` directory

### Indexing Module (`src/indexing/`)
- **Purpose**: Split notes into searchable chunks
- **Config**: 150-200 words per chunk
- **Output**: Stored in `db.json`

### Retrieval Module (`src/retrieval/`)
- **Purpose**: Find relevant chunks for queries
- **Method**: Keyword overlap scoring
- **Output**: Top-3 matching chunks

### AI Module (`src/ai/`)
- **Purpose**: Generate responses using Ollama
- **Model**: qwen2.5-coder:1.5b
- **Config**: Temperature=0.3, top_p=0.9

### Watcher Module (`src/watcher/`)
- **Purpose**: Monitor vault for changes
- **Library**: chokidar
- **Trigger**: Auto re-indexing on add/change/delete

### Server Module (`src/server/`)
- **Purpose**: Express REST API
- **Endpoints**: All API routes defined here

### Editor (`src/editor/`)
- **Purpose**: TipTap rich text editor
- **Build**: Bundled with esbuild to `public/vendor/editor.js`

## Editor Features

The TipTap editor supports:
- **Bold**, *Italic*, ~~Strikethrough~~
- Headings (H1, H2, H3)
- Bullet Lists & Numbered Lists
- Blockquotes
- Inline Code & Code Blocks
- Undo/Redo

## Future Extensions

This modular structure makes it easy to add:

1. **Vector Search**: Replace keyword retrieval with embeddings
2. **FAISS Integration**: Add similarity search at scale
3. **Multiple Models**: Support for different Ollama models
4. **Better Chunking**: Overlapping chunks, semantic splitting
5. **Caching**: Cache frequent queries
6. **Sync**: Cloud sync for vault files

## Troubleshooting

**Ollama not running:**
```bash
ollama serve
```

**Port already in use:**
```bash
# Find and kill the process on port 3000
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

**No notes found:**
- Add `.md` or `.txt` files to the `vault/` directory
- Call `POST /api/reindex` to trigger indexing

## License

MIT
