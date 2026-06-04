# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Pi Research Agent
- Autonomous research workflow with web search and source analysis
- Four built-in tools: `web_search`, `read_url`, `save_note`, `synthesize_report`
- CLI interface with TUI and print modes
- Programmatic API via `ResearchAgent` class
- MCP (Model Context Protocol) server with three tools: `research`, `quick_search`, `read_url`
- Skills system for customizing research behavior via `~/.pi/skills/research/`
- Automatic `.env` file loading for API keys
- Configurable max turns, output formats (markdown, JSON, bullet)
- Automatic report saving to `./research-output/<timestamp>-<topic>/`
- Three confidence levels for notes: high, medium, low
- Retry logic for `read_url` with alternative User-Agent
- Fallback report generation when notes are insufficient
- Examples for basic usage, custom models, custom skills, and MCP client
