# Contributing to tpa

This document provides information for developers who want to contribute to or maintain this project.

## Development Setup

```bash
# Install dependencies
npm install

# Run dev server (for web visualization development)
npm run dev

# Build all (web + CLI)
npm run build

# Build CLI only
npm run build:cli

# Preview built web
npm run preview

# Run tests
npm test              # Watch mode
npm run test:run      # Single run

# Code quality
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
```

## Project Structure

```
src/
├── analyzer/                  # Analysis logic
│   ├── index.ts                  # Main analyzer entry
│   ├── metrics-calculator.ts     # Metrics computation
│   └── timeline-builder.ts       # Timeline data builder
│
├── cli/                       # CLI application
│   ├── index.ts                  # CLI entry point
│   ├── commands/
│   │   ├── analyze.ts            # HTML report generation command
│   │   ├── summary.ts            # Terminal summary command
│   │   └── trace.ts              # One-step analysis command
│   ├── output/
│   │   └── html-generator.ts     # HTML report generator
│   └── utils/
│       └── spinner.ts            # Progress spinner
│
├── parser/                    # Trace file parsing
│   ├── index.ts                  # Parser entry point
│   ├── trace-parser.ts           # Streaming JSON parser
│   ├── event-processor.ts        # Event processing
│   ├── file-aggregator.ts        # File-level aggregation
│   ├── location-aggregator.ts    # Location-level aggregation
│   ├── snippet-extractor.ts      # Code snippet extraction
│   └── types.ts                  # Type definitions
│
├── shared/                    # Shared code between CLI and Web
│   ├── index.ts                  # Central export point
│   ├── constants.ts              # Shared constants and types
│   ├── formatters.ts             # Common formatting utilities
│   ├── cli-formatters.ts         # CLI-specific formatters
│   ├── utils.ts                  # General utility functions
│   ├── algorithms.ts             # Algorithm implementations
│   └── __tests__/                # Unit tests
│       ├── utils.test.ts
│       ├── formatters.test.ts
│       ├── algorithms.test.ts
│       ├── constants.test.ts
│       └── cli-formatters.test.ts
│
└── visualization/             # React web app
    ├── App.tsx                   # Main app component
    ├── main.tsx                  # React entry point
    ├── components/
    │   ├── Summary/
    │   │   ├── HotspotTable.tsx     # Hotspot files table
    │   │   ├── SlowLocationsPanel.tsx # Slow locations panel
    │   │   ├── OverviewStats.tsx     # Overview statistics
    │   │   └── PhaseBreakdown.tsx    # Phase breakdown chart
    │   └── Timeline/
    │       ├── TimelineChart.tsx     # Timeline chart
    │       └── TimelineControls.tsx  # Timeline controls
    └── utils/
        ├── colors.ts                # Color utilities
        └── formatters.ts            # Number/time formatters
```

## Architecture Overview

### Data Flow

```
trace.json → Parser → Analyzer → Visualization
                ↓
           File/Location
           Aggregation
```

1. **Parser** (`src/parser/`): Streams and parses trace.json files
2. **Analyzer** (`src/analyzer/`): Computes metrics and builds timeline data
3. **CLI** (`src/cli/`): Command-line interface and HTML generation
4. **Visualization** (`src/visualization/`): React-based interactive report

### Key Components

#### Parser Module

- `trace-parser.ts`: Uses stream-json for memory-efficient parsing of large files
- `event-processor.ts`: Processes raw trace events into structured data
- `file-aggregator.ts`: Aggregates events by file path
- `location-aggregator.ts`: Aggregates events by code location
- `snippet-extractor.ts`: Extracts source code snippets from files

#### Analyzer Module

- `metrics-calculator.ts`: Calculates performance metrics (duration, percentages)
- `timeline-builder.ts`: Builds timeline data for visualization

#### CLI Module

- `commands/trace.ts`: Runs `tsc --generateTrace` and analyzes in one step
- `commands/analyze.ts`: Generates HTML report from existing trace
- `commands/summary.ts`: Outputs terminal summary
- `output/html-generator.ts`: Generates self-contained HTML report

#### Shared Module

- `constants.ts`: Common constants and type definitions
- `formatters.ts`: Time and number formatting utilities
- `cli-formatters.ts`: CLI-specific output formatters
- `utils.ts`: General utility functions (path handling, etc.)
- `algorithms.ts`: Algorithm implementations (percentile calculation, etc.)

#### Visualization Module

- React SPA embedded in the HTML report
- Uses Recharts for charts
- TanStack Virtual for virtualized scrolling
- Prism.js for code syntax highlighting

## Tech Stack

### CLI

- **Commander.js**: CLI interface framework
- **Chalk**: Terminal color output
- **Ora**: Spinner display
- **cli-progress**: Progress bar display

### Parsing

- **stream-json**: Streaming JSON parser for large files

### Web Visualization

- **React**: UI framework
- **Recharts**: Chart library
- **TanStack Virtual**: Virtualized scrolling
- **Prism.js**: Code syntax highlighting

### Build

- **Vite**: Web build tool
- **TypeScript**: Type-safe development
- **vite-plugin-singlefile**: Single HTML file generation

### Testing & Code Quality

- **Vitest**: Unit testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Build Configuration

### TypeScript Configs

- `tsconfig.json`: Base config for web visualization
- `tsconfig.cli.json`: Config for CLI build (Node.js target)

### Vite Config

`vite.config.ts` uses `vite-plugin-singlefile` to bundle the entire React app into a single HTML file that can be embedded in the generated report.

## Adding New Features

### Adding a New CLI Command

1. Create a new file in `src/cli/commands/`
2. Export the command handler function
3. Register the command in `src/cli/index.ts`

```typescript
// src/cli/commands/my-command.ts
export async function myCommand(traceDir: string, options: Options) {
  // Implementation
}

// src/cli/index.ts
import { myCommand } from './commands/my-command.js';

program
  .command('my-command')
  .description('Description')
  .argument('<trace-dir>', 'Trace directory')
  .action(myCommand);
```

### Adding a New Visualization Component

1. Create component in `src/visualization/components/`
2. Import and use in `App.tsx`
3. Ensure it works with the data structure from `window.__TSC_PERF_DATA__`

### Modifying the Parser

When modifying the parser:

- Ensure streaming is maintained for large files
- Update types in `src/parser/types.ts`
- Update aggregators if data structure changes

## Testing Locally

```bash
# Build CLI
npm run build:cli

# Test with a trace directory
node ./dist/cli/index.js summary ./trace
node ./dist/cli/index.js analyze ./trace -o report.html --open

# Test one-step analysis
node ./dist/cli/index.js trace ./my-project --open
```

## Testing

Unit tests are located in `src/shared/__tests__/` directory.

```bash
# Run tests in watch mode
npm test

# Run tests once (for CI)
npm run test:run

# Run specific test file
npm test -- src/shared/__tests__/utils.test.ts
```

### Writing Tests

- Place test files in `__tests__/` directories next to the code being tested
- Use descriptive test names that explain expected behavior
- Test edge cases and error conditions

```typescript
// Example test structure
import { describe, it, expect } from 'vitest';
import { myFunction } from '../my-module.js';

describe('myFunction', () => {
  it('should handle normal input', () => {
    expect(myFunction('input')).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('default');
  });
});
```

## Code Style Guidelines

- Use TypeScript strict mode
- Prefer functional components for React
- Use async/await for asynchronous operations
- Keep functions small and focused
- Add JSDoc comments for public APIs
- Run `npm run format` before committing
- Ensure `npm run lint` passes without errors

## Release Process

1. Update version in `package.json`
2. Update CLI version in `src/cli/index.ts`
3. Build all: `npm run build`
4. Test CLI commands
5. Publish to npm: `npm publish`
