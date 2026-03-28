const axios = require('axios');

class OllamaClient {
    constructor(baseUrl = 'http://localhost:11434') {
        this.baseUrl = baseUrl;
        this.model = 'qwen2.5-coder:1.5b';
        this.maxContextLength = 1500;
    }

    truncateContext(context) {
        if (context.length <= this.maxContextLength) {
            return context;
        }
        
        return context.substring(0, this.maxContextLength) + '...';
    }

    buildPrompt(context, question) {
        return `You are a helpful assistant.
Answer the question ONLY using the context below.
If the answer is not in the context, say 'I don't know'.

Context:
${context}

Question:
${question}

Answer:`;
    }

    async generate(question, context) {
        try {
            const truncatedContext = this.truncateContext(context);
            const prompt = this.buildPrompt(truncatedContext, question);
            
            const response = await axios.post(`${this.baseUrl}/api/generate`, {
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.3,
                    top_p: 0.9
                }
            }, {
                timeout: 120000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return response.data.response || 'No response generated';
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Ollama server is not running. Please start it with: ollama serve');
            }
            if (error.response) {
                throw new Error(`Ollama API error: ${error.response.status} - ${error.response.statusText}`);
            }
            throw new Error(`Failed to generate response: ${error.message}`);
        }
    }

    async checkConnection() {
        try {
            await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = OllamaClient;
