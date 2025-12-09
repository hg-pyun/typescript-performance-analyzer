# tpa - TypeScript Performance Analyzer

<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/d7e8ce13-7f59-49be-ae1a-447a1a6f32c6" />


Analyze TypeScript compiler performance by parsing `--generateTrace` output and generating interactive HTML reports.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

## Features

- **Streaming Parser**: Memory-efficient processing of large trace files using stream-json
- **Interactive Visualization**: Timeline and hotspot analysis by compilation phase
- **Per-file Analysis**: Breakdown of Parse, Bind, Check, and Emit time per file
- **Code Snippet Extraction**: View actual source code at slow locations
- **Terminal Summary**: Quick colorful summary output without HTML generation
- **One-step Analysis**: Generate trace and analyze in a single command
- **Self-contained HTML**: Offline-capable single-file report with no server required

<img width="1648" height="1289" alt="image" src="https://github.com/user-attachments/assets/85b387b7-0d52-4fb5-9a93-5f4ef3ba3405" />



## Requirements

- Node.js >= 18.0.0

## Installation

```bash
npm install -g typescript-performance-analyzer
```

Or run directly with npx:

```bash
npx typescript-performance-analyzer trace
```

## Quick Start

Run in your TypeScript project directory to generate trace and analyze:

```bash
tpa trace --open
```

Or specify a project path:

```bash
tpa trace ./my-project --open
```

## Commands

### `tpa trace` - One-step Analysis

Run trace generation and HTML report generation in a single command.

```bash
tpa trace [project-path] [options]
```

**Arguments:**

- `[project-path]`: Path to TypeScript project (containing tsconfig.json). Defaults to current directory (`.`)

**Options:**

| Option                 | Description                               | Default                   |
| ---------------------- | ----------------------------------------- | ------------------------- |
| `-o, --output <path>`  | Output HTML file path                     | `./tsc-report.html`       |
| `--open`               | Open report in browser after generation   | -                         |
| `--min-duration <ms>`  | Filter events shorter than threshold (ms) | `0.1`                     |
| `--top <n>`            | Number of hotspot files to show           | `20`                      |
| `-v, --verbose`        | Show detailed progress and tsc output     | -                         |
| `--snippet-length <n>` | Maximum code snippet length               | `200`                     |
| `--trace-dir <path>`   | Custom directory for trace output         | `.tsc-trace` (in project) |
| `--keep-trace`         | Keep trace files after analysis           | cleanup                   |
| `--tsc-args <args>`    | Additional arguments to pass to tsc       | -                         |

**Examples:**

```bash
# Analyze current directory
tpa trace --open

# Analyze specific project
tpa trace ./my-project --open

# Run with skipLibCheck
tpa trace --tsc-args "--skipLibCheck" --open

# Keep trace files after analysis
tpa trace --keep-trace -o analysis.html
```

### `tpa analyze` - Generate HTML Report

Generate HTML report from existing trace files.

```bash
tpa analyze <trace-dir> [options]
```

**Arguments:**

- `<trace-dir>`: Directory containing trace.json and types.json

**Options:**

| Option                 | Description                                   | Default             |
| ---------------------- | --------------------------------------------- | ------------------- |
| `-o, --output <path>`  | Output HTML file path                         | `./tsc-report.html` |
| `--open`               | Open report in browser after generation       | -                   |
| `--min-duration <ms>`  | Filter events shorter than threshold (ms)     | `0.1`               |
| `--top <n>`            | Number of hotspot files to show               | `20`                |
| `-p, --project <path>` | Project root path for code snippet extraction | -                   |
| `--snippet-length <n>` | Maximum code snippet length                   | `200`               |
| `-v, --verbose`        | Show detailed progress                        | -                   |

**Examples:**

```bash
# First, generate trace
tsc --generateTrace ./trace-log

# Run analysis
tpa analyze ./trace-log -o report.html --open

# Analyze with code snippets
tpa analyze ./trace-log -o report.html --project /path/to/project --open
```

### `tpa summary` - Terminal Summary

Show quick summary in terminal without generating HTML.

```bash
tpa summary <trace-dir> [options]
```

**Arguments:**

- `<trace-dir>`: Directory containing trace.json

**Options:**

| Option      | Description                     | Default |
| ----------- | ------------------------------- | ------- |
| `--top <n>` | Number of hotspot files to show | `10`    |

**Example Output:**

```
══════════════════════════════════════════════════
  TypeScript Compilation Summary
══════════════════════════════════════════════════

📊 Overview
   Total Duration: 56.69s
   Files Processed: 14,361
   Total Events: 46,011

⏱️  Phase Breakdown
   Parse    ░░░░░░░░░░░░░░░░░░░░░░░░░      1.72s (1.6%)
   Bind     ░░░░░░░░░░░░░░░░░░░░░░░░░      1.13s (1.1%)
   Check    █████████████████████░░░░   1m 31.0s (84.9%)
   Emit     ███░░░░░░░░░░░░░░░░░░░░░░     13.37s (12.5%)

🔥 Top 10 Slowest Files
    1.      1.07s  .../useColDefFactory.tsx
    2.   987.47ms  .../ImperativeDialogInstanceContent.tsx
    ...
```

## Understanding Compilation Phases

| Phase     | Description                                 |
| --------- | ------------------------------------------- |
| **Parse** | Lexing and parsing source files into ASTs   |
| **Bind**  | Binding declarations and setting up symbols |
| **Check** | Type checking (usually the slowest phase)   |
| **Emit**  | Generating JavaScript output files          |

## HTML Report Features

The generated HTML report includes:

- **Overview Statistics**: Total duration, files processed, event count
- **Hotspot Table**: Slowest files with phase breakdown and search/sort
- **Location Analysis**: Slow code locations with SyntaxKind and snippets
- **UI Features**: Dark/Light theme, collapsible sidebar, offline support

## License

MIT
