# Pi Research Agent MCP Server

MCP (Model Context Protocol) server для автономного исследования. Позволяет другим агентам вызывать research agent для глубокого исследования тем.

## Установка

```bash
npm install @earendil-works/pi-research-agent
```

## Настройка

### Переменные окружения

Создайте `.env` файл в корне проекта:

```env
TAVILY_API_KEY=***
OPENROUTER_API_KEY=***
LLM_MODEL=minimax/minimax-m3
```

### Подключение к MCP клиенту

#### Claude Desktop

Добавьте в `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) или `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

Добавьте в `.cursor/mcp.json` в корне проекта:

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

#### Другие MCP клиенты

Любой MCP-совместимый клиент может подключиться к серверу через stdio:

```bash
node /path/to/pi-research/packages/research-agent/dist/mcp-cli.js
```

## Доступные инструменты

### `research`

Выполняет глубокое автономное исследование темы. Агент ищет в интернете, читает источники, сохраняет находки и генерирует подробный отчёт с цитатами.

**Параметры:**
- `topic` (string, required): Тема для исследования
- `maxTurns` (number, optional, default: 15): Максимальное количество ходов исследования
- `format` (string, optional, default: "markdown"): Формат отчёта ("markdown", "json", "bullet")

**Пример использования:**
```json
{
  "topic": "Квантовые вычисления 2026",
  "maxTurns": 10,
  "format": "markdown"
}
```

**Возвращает:**
- Полный отчёт с executive summary, ключевыми находками, цитатами источников
- Список собранных заметок с уровнем уверенности (high/medium/low)
- Метаданные: количество ходов, количество заметок

### `quick_search`

Быстрый поиск в интернете без полного research flow. Полезен для быстрого поиска информации.

**Параметры:**
- `query` (string, required): Поисковый запрос
- `maxResults` (number, optional, default: 10): Максимальное количество результатов

**Пример использования:**
```json
{
  "query": "последние разработки в квантовых вычислениях",
  "maxResults": 5
}
```

**Возвращает:**
- Список результатов поиска с заголовками, URL и сниппетами

### `read_url`

Извлекает контент из URL. Полезен для чтения конкретных статей или страниц.

**Параметры:**
- `url` (string, required): URL для чтения
- `maxLength` (number, optional, default: 10000): Максимальное количество символов для извлечения

**Пример использования:**
```json
{
  "url": "https://example.com/article",
  "maxLength": 5000
}
```

**Возвращает:**
- Извлечённый текст со страницы

## Программное использование

```typescript
import { createResearchMcpServer } from "@earendil-works/pi-research-agent";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = createResearchMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Как это работает

1. **Инициализация**: MCP клиент подключается к серверу через stdio
2. **Вызов инструмента**: Клиент вызывает `research`, `quick_search` или `read_url`
3. **Выполнение**: 
   - `research`: Создаёт ResearchAgent, выполняет полное исследование (поиск → чтение → сохранение → синтез)
   - `quick_search`: Выполняет быстрый поиск через Tavily API
   - `read_url`: Извлекает контент из URL
4. **Результат**: Возвращает структурированный результат через MCP protocol

## Примеры использования

### Исследование с Claude

```
User: Исследуй последние разработки в области квантовых вычислений

Claude: [вызывает research tool]
- Ищет в интернете
- Читает 5-10 источников
- Сохраняет ключевые находки
- Генерирует отчёт на 2000+ слов
- Возвращает результат с цитатами
```

### Быстрый поиск с Cursor

```
User: @research-agent Найди информацию о Rust async runtime

Cursor: [вызывает quick_search tool]
- Возвращает 10 результатов поиска
- Пользователь может выбрать URL для глубокого чтения
```

### Чтение конкретной статьи

```
User: Прочитай эту статью: https://example.com/article

Agent: [вызывает read_url tool]
- Извлекает текст статьи
- Возвращает контент для анализа
```

## Ограничения

- **Tavily API**: Бесплатный план — 1000 запросов/месяц
- **Время выполнения**: Полное исследование может занять 2-5 минут
- **Контекст**: Отчёты могут быть очень длинными (5000-10000 слов)

## Troubleshooting

### "TAVILY_API_KEY environment variable is not set"

Убедитесь что переменные окружения установлены:
```bash
export TAVILY_API_KEY=***
export OPENROUTER_API_KEY=***
```

Или добавьте их в `.env` файл.

### MCP server не отвечает

Проверьте что:
1. Node.js версия >= 22.19.0
2. Все зависимости установлены: `npm install`
3. Пакет собран: `npm run build`

### Ошибки типов TypeScript

MCP SDK использует Zod для валидации схем. Если возникают ошибки типов, используйте `as any` для схем (как в текущей реализации).

## Лицензия

MIT
