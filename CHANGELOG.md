# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.6] - 2026-08-19

### Added

- MCP Bundle (`.mcpb`) packaging for Claude Desktop one-click installation
- `build:mcpb` script to compile a standalone macOS binary and pack the bundle
- GitHub Release automation that attaches `.mcpb` assets on tagged releases
- MCP Bundle documentation in `README.md` and `README_ja.md`
- `CHANGELOG.md`

## [0.2.5] - 2026-08-18

### Added

- `find_and_open_note` tool to find matching notes by period, keyword, and tag, then open the most recently updated match in UpNote

## [0.2.4] - 2026-08-18

### Added

- `list_recent_notes`, `list_notes_this_week`, and `list_notes_this_month` tools for time-based note listing
- `find_notes` tool to combine period, keyword, and tag filters in one call
- Deep links in structured tool results where applicable

## [0.2.3] - 2026-08-18

### Changed

- Reorganized README around published package usage
- Replaced personal local paths in setup examples with generic placeholders

## [0.2.2] - 2026-08-18

### Added

- Initial read-only MCP server for local UpNote SQLite data
- `search_notes` and `get_note` tools
- `open_note`, `open_notebook`, and `create_note` tools using UpNote's official URL scheme
- `list_notebooks`, `list_tags`, and `search_by_tag` tools
- npm package publishing as `@bellx2/upnote-mcp`
- Trusted publishing workflow for npm releases
- macOS support with configurable `UPNOTE_DB` path
- Permission guidance for first-run MCP client prompts

### Fixed

- Simplified the published CLI entrypoint

[Unreleased]: https://github.com/bellx2/upnote-mcp/compare/v0.2.6...HEAD
[0.2.6]: https://github.com/bellx2/upnote-mcp/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/bellx2/upnote-mcp/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/bellx2/upnote-mcp/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/bellx2/upnote-mcp/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/bellx2/upnote-mcp/releases/tag/v0.2.2
