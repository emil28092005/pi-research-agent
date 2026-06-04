# Contributing to Pi Research Agent

Thank you for your interest in contributing to Pi Research Agent! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue on GitHub with:
- A clear, descriptive title
- Steps to reproduce the bug
- Expected vs actual behavior
- Your environment (Node.js version, OS, etc.)
- Relevant logs or error messages

### Suggesting Features

Feature requests are welcome! Please open an issue with:
- A clear description of the feature
- Use cases and motivation
- Any implementation ideas you have

### Submitting Pull Requests

1. **Fork the repository** and create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Make your changes** following the code style guidelines below

4. **Add tests** for new functionality

5. **Run the build and tests**:
   ```bash
   npm run build
   npm test
   ```

6. **Commit your changes** with a clear message:
   ```bash
   git commit -m "Add: brief description of your changes"
   ```

7. **Push to your fork** and submit a pull request

8. **Wait for review** - maintainers will review your PR and may request changes

## Development Setup

### Prerequisites

- Node.js >= 22.19.0
- npm or pnpm
- Git

### Project Structure

```
packages/research-agent/
├── src/
│   ├── agent.ts           # Main ResearchAgent class
│   ├── cli.ts             # CLI entry point
│   ├── mcp-cli.ts         # MCP server entry point
│   ├── mcp-server.ts      # MCP server implementation
│   ├── system-prompt.ts   # System prompt templates
│   ├── config.ts          # Configuration constants
│   ├── types.ts           # TypeScript type definitions
│   ├── tools/             # Built-in research tools
│   ├── utils/             # Utility functions
│   ├── skills/            # Skills system
│   └── modes/             # Output modes (TUI, print)
├── examples/              # Usage examples
├── package.json
└── tsconfig.build.json
```

### Code Style

- Use TypeScript with strict mode
- Follow the existing code conventions
- Use 4-space indentation (matches the rest of the monorepo)
- Use single quotes for strings
- Add JSDoc comments for public APIs
- Avoid `any` types when possible
- Use `import` statements (not `require`)

### Testing

- Write unit tests for new functions
- Write integration tests for new features
- Ensure all tests pass before submitting a PR
- Aim for good test coverage

### Commit Messages

Use clear, descriptive commit messages:
- `Add: new feature description`
- `Fix: bug description`
- `Update: change description`
- `Refactor: code improvement description`
- `Docs: documentation update`

## Adding New Tools

To add a new research tool:

1. Create a new file in `src/tools/`:
   ```typescript
   // src/tools/my-tool.ts
   import type { AgentTool } from "@earendil-works/pi-agent-core";
   import { Type, type Static } from "typebox";

   const mySchema = Type.Object({
     param: Type.String({ description: "Parameter description" }),
   });

   export type MyInput = Static<typeof mySchema>;

   export function createMyTool(): AgentTool<typeof mySchema, MyDetails> {
     return {
       name: "my_tool",
       label: "My Tool",
       description: "Tool description",
       parameters: mySchema,
       execute: async (toolCallId, params: MyInput) => {
         // Implementation
         return {
           content: [{ type: "text" as const, text: "result" }],
           details: {},
         };
       },
     };
   }
   ```

2. Register the tool in `src/tools/index.ts`

3. Add tests for the tool

4. Update documentation

## Adding MCP Tools

To add a new MCP tool:

1. Add the tool definition in `src/mcp-server.ts`:
   ```typescript
   server.registerTool(
     "my_tool",
     {
       description: "Tool description",
       inputSchema: {
         param: z.string().describe("Parameter description"),
       },
     },
     async (params: any) => {
       // Implementation
       return {
         content: [{ type: "text" as const, text: "result" }],
       };
     },
   );
   ```

2. Add tests

3. Update MCP_SERVER.md documentation

## Release Process

1. Update version in `package.json` following semver
2. Update `CHANGELOG.md` with changes
3. Create a git tag: `git tag v0.1.0`
4. Push tag: `git push origin v0.1.0`
5. GitHub Actions will publish to npm automatically

## Questions?

If you have questions, feel free to:
- Open an issue on GitHub
- Join our community chat
- Email the maintainers

Thank you for contributing! 🎉
