# MCP Integration Architecture

## Обзор

Pi Research Agent теперь поддерживает MCP (Model Context Protocol), что позволяет другим AI агентам вызывать его для глубокого исследования тем.

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Client (Claude, Cursor, etc.)         │
│                                                              │
│  - Claude Desktop                                           │
│  - Cursor                                                   │
│  - Custom agents                                            │
│  - Any MCP-compatible client                                │
└────────────────────────┬────────────────────────────────────┘
                         │ stdio (JSON-RPC)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Pi Research Agent MCP Server                    │
│                                                              │
│  Tools:                                                      │
│  ├─ research(topic, maxTurns, format)                       │
│  │   └─ Full autonomous research with report generation     │
│  │                                                          │
│  ├─ quick_search(query, maxResults)                         │
│  │   └─ Fast web search via Tavily API                      │
│  │                                                          │
│  └─ read_url(url, maxLength)                                │
│      └─ Extract content from web pages                      │
└─────────────────────────────────────────────────────────────┘
```

## Компоненты

### 1. MCP Server (`src/mcp-server.ts`)

Создаёт MCP server с тремя tools:

```typescript
export function createResearchMcpServer(): McpServer {
  const server = new McpServer({
    name: "pi-research-agent",
    version: VERSION,
  });

  server.registerTool("research", { ... });
  server.registerTool("quick_search", { ... });
  server.registerTool("read_url", { ... });

  return server;
}
```

### 2. MCP CLI (`src/mcp-cli.ts`)

Entry point для запуска MCP server:

```typescript
#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadEnvFile } from "./utils/env.ts";
import { createResearchMcpServer } from "./mcp-server.ts";

loadEnvFile();

const server = createResearchMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 3. Research Agent (`src/agent.ts`)

Основной research agent который:
- Создаёт Pi Agent с research tools
- Выполняет автономное исследование
- Генерирует отчёт
- Сохраняет результаты на диск (опционально)

## Flow

### Research Tool Flow

```
1. Client вызывает research(topic, maxTurns, format)
   ↓
2. MCP server создаёт ResearchAgent
   ↓
3. ResearchAgent.prompt(topic)
   ↓
4. Agent loop:
   - web_search(query) → Tavily API
   - read_url(url) → fetch content
   - save_note(topic, finding, source, confidence)
   - synthesize_report(topic, format)
   ↓
5. Agent генерирует финальный отчёт
   ↓
6. MCP server возвращает:
   {
     content: [{
       type: "text",
       text: "# Research Report\n\n..."
     }]
   }
```

### Quick Search Flow

```
1. Client вызывает quick_search(query, maxResults)
   ↓
2. MCP server вызывает tavilySearch(query, options)
   ↓
3. Форматирует результаты
   ↓
4. Возвращает список результатов
```

### Read URL Flow

```
1. Client вызывает read_url(url, maxLength)
   ↓
2. MCP server вызывает fetchAndExtract(url, maxLength)
   ↓
3. Извлекает текст из HTML
   ↓
4. Возвращает контент
```

## Конфигурация

### Переменные окружения

```env
TAVILY_API_KEY=***      # Required for web search
OPENROUTER_API_KEY=***  # Required for LLM
LLM_MODEL=minimax/minimax-m3  # Optional, default model
```

### MCP Client Configuration

#### Claude Desktop

```json
{
  "mcpServers": {
    "research-agent": {
      "command": "node",
      "args": ["/path/to/pi-research/packages/research-agent/dist/mcp-cli.js"],
      "env": {
        "TAVILY_API_KEY": "***",
        "OPENROUTER_API_KEY": "***"
      }
    }
  }
}
```

#### Cursor

```json
{
  "mcpServers": {
    "research-agent": {
      "command": "node",
      "args": ["./node_modules/@earendil-works/pi-research-agent/dist/mcp-cli.js"]
    }
  }
}
```

## Использование

### Из Claude Desktop

```
User: Исследуй последние разработки в квантовых вычислениях

Claude: [вызывает research tool]
- Ищет в интернете (5-10 запросов)
- Читает источники (5-10 URL)
- Сохраняет заметки (10-20 notes)
- Генерирует отчёт (2000-5000 слов)
- Возвращает результат с цитатами
```

### Из Cursor

```
User: @research-agent Найди информацию о Rust async

Cursor: [вызывает quick_search tool]
- Возвращает 10 результатов поиска
- Пользователь может выбрать URL для глубокого чтения через read_url
```

### Программно (TypeScript)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["./dist/mcp-cli.js"],
});

const client = new Client({
  name: "my-agent",
  version: "1.0.0",
});

await client.connect(transport);

const result = await client.callTool({
  name: "research",
  arguments: {
    topic: "Quantum computing 2026",
    maxTurns: 10,
    format: "markdown",
  },
});

console.log(result.content[0].text);
```

## Преимущества MCP Integration

1. **Переиспользование**: Один research agent для всех клиентов
2. **Стандартизация**: MCP protocol обеспечивает совместимость
3. **Масштабируемость**: Легко добавить новые tools
4. **Изоляция**: Research agent работает в отдельном процессе
5. **Безопасность**: API keys изолированы в MCP server

## Ограничения

1. **Latency**: Полное исследование занимает 2-5 минут
2. **Context size**: Отчёты могут быть очень длинными
3. **Cost**: Tavily API и LLM API имеют стоимость
4. **Rate limits**: Tavily free tier — 1000 запросов/месяц

## Будущие улучшения

1. **Streaming**: Добавить поддержку streaming для длинных исследований
2. **Progress**: Добавить progress notifications через MCP
3. **Caching**: Кэшировать результаты поиска
4. **Batch**: Поддержка batch research (несколько тем одновременно)
5. **Custom skills**: Позволить клиентам передавать custom skills

## Тестирование

### Ручное тестирование

```bash
# Initialize
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/mcp-cli.js

# List tools
(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'; echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}') | node dist/mcp-cli.js

# Call tool
(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'; echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"quick_search","arguments":{"query":"test","maxResults":5}}}') | node dist/mcp-cli.js
```

### Автоматическое тестирование

См. `examples/mcp-client.ts` для примера programmatic client.

## Ссылки

- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Pi Research Agent](./README.md)
- [MCP Server Documentation](./MCP_SERVER.md)
