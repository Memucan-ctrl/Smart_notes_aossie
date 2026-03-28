# Smart Notes MVP

A local-first AI prototype that allows users to ask questions about their notes using a Retrieval-Augmented Generation (RAG) pipeline powered by Ollama.

## Prerequisites

- Node.js (v14 or higher)
- Ollama installed and running
- Ollama model: `qwen:1.5b`

## Setup

1. **Install Ollama**
   Download and install Ollama from https://ollama.ai

2. **Pull the model**
   ```bash
   ollama pull qwen:1.5b
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Add your notes**
   Place `.txt` or `.md` files in the `notes/` directory

5. **Start Ollama server** (in a separate terminal)
   ```bash
   ollama serve
   ```

6. **Start the application**
   ```bash
   npm start
   ```

## API Endpoints

### POST /ask
Ask a question about your notes.

**Request:**
```json
{
  "question": "What is Node.js?"
}
```

**Response:**
```json
{
  "answer": "Node.js is a runtime environment...",
  "sources": ["nodejs-notes.md", "project-ideas.md"]
}
```

### GET /health
Check server health and loaded chunks.

### GET /sources
List all note sources.

### GET /chunks
View all processed chunks.

### POST /reindex
Reprocess notes from the `notes/` directory.

## Example Usage

```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the key features of JavaScript?"}'
```

## Project Structure

```
smart-notes-mvp/
├── notes/              # Your .txt or .md note files
│   ├── javascript-notes.md
│   ├── nodejs-notes.md
│   └── project-ideas.md
├── index.js           # Main Express server
├── chunker.js         # Splits notes into chunks
├── retriever.js       # Keyword-based retrieval
├── ollama.js          # Ollama API client
├── db.json            # Processed chunks storage
├── package.json       # Dependencies
└── README.md          # This file
```

## How It Works

1. **Processing**: Notes are read from the `notes/` folder and split into 150-200 word chunks
2. **Storage**: Chunks are stored in `db.json` with metadata
3. **Retrieval**: When you ask a question, the system scores each chunk by keyword matching
4. **Generation**: Top 3 relevant chunks are sent to Ollama with a RAG prompt
5. **Response**: Ollama generates an answer based only on the provided context

## Troubleshooting

**Ollama connection refused:**
- Make sure Ollama is running with `ollama serve`

**No relevant chunks found:**
- Ensure your notes directory contains relevant content
- Try rephrasing your question

**Empty answer:**
- The model couldn't find relevant information in the context
- Add more notes or rephrase the question
