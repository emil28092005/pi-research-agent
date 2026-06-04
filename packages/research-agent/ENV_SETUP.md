# Environment Variables Setup

## Quick Start

1. **Copy the example file:**
   ```bash
   cp packages/research-agent/.env.example packages/research-agent/.env
   ```

2. **Edit with your API keys:**
   ```bash
   nano packages/research-agent/.env
   ```

3. **Add your keys:**
   ```env
   TAVILY_API_KEY=***
   OPENROUTER_API_KEY=***
   LLM_MODEL=minimax/minimax-m3
   ```

4. **Run the agent:**
   ```bash
   node packages/research-agent/dist/cli.js "your research topic"
   ```

## How It Works

The research agent automatically loads environment variables from `.env` files in this order:

1. `./.env` (current working directory)
2. `./packages/research-agent/.env`

**Important:**
- Environment variables (set via `export`) take precedence over `.env` file values
- The `.env` file is in `.gitignore` and will not be committed
- You can also use Node.js 22+ built-in support: `node --env-file=.env ...`

## Alternative: Export Variables

You can also set variables directly in your shell:

```bash
export TAVILY_API_KEY=***
export OPENROUTER_API_KEY=***
export LLM_MODEL=openai/gpt-4o

node packages/research-agent/dist/cli.js "your topic"
```

## Getting API Keys

### Tavily API Key
1. Go to https://tavily.com/
2. Sign up for an account
3. Get your API key from the dashboard
4. Free tier: 1000 searches/month

### OpenRouter API Key
1. Go to https://openrouter.ai/
2. Sign up for an account
3. Add credits to your account
4. Create an API key in settings
5. Pay-per-use pricing for various models

## Supported Models

Default: `minimax/minimax-m3`

Other popular options:
- `openai/gpt-4o`
- `anthropic/claude-3.5-sonnet`
- `google/gemini-pro-1.5`
- `meta-llama/llama-3.1-70b-instruct`

See all available models at https://openrouter.ai/models
