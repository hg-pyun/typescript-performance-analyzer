import { Command } from 'commander';
import { analyzeCommand } from './commands/analyze.js';
import { summaryCommand } from './commands/summary.js';
import { traceCommand } from './commands/trace.js';

const program = new Command();

program
  .name('tpa')
  .description('TypeScript compilation performance analyzer and visualizer')
  .version('0.1.0');

program
  .command('analyze')
  .description('Analyze trace files and generate HTML visualization report')
  .argument('<trace-dir>', 'Directory containing trace.json and types.json')
  .option('-o, --output <path>', 'Output HTML file path', './tsc-report.html')
  .option('--open', 'Open report in browser after generation')
  .option(
    '--min-duration <ms>',
    'Filter events shorter than threshold (ms)',
    '0.1'
  )
  .option('--top <n>', 'Number of hotspot files to show', '20')
  .option('-v, --verbose', 'Show detailed progress')
  .option(
    '-p, --project <path>',
    'Original project root path for code snippet extraction'
  )
  .option('--snippet-length <n>', 'Maximum code snippet length', '200')
  .action(analyzeCommand);

program
  .command('summary')
  .description('Show quick summary in terminal without generating HTML')
  .argument('<trace-dir>', 'Directory containing trace.json')
  .option('--top <n>', 'Number of hotspot files to show', '10')
  .action(summaryCommand);

program
  .command('trace')
  .description('Generate trace from TypeScript project and analyze in one step')
  .argument(
    '<project-path>',
    'Path to TypeScript project (containing tsconfig.json)'
  )
  .option('-o, --output <path>', 'Output HTML file path', './tsc-report.html')
  .option('--open', 'Open report in browser after generation')
  .option(
    '--min-duration <ms>',
    'Filter events shorter than threshold (ms)',
    '0.1'
  )
  .option('--top <n>', 'Number of hotspot files to show', '20')
  .option('-v, --verbose', 'Show detailed progress and tsc output')
  .option('--snippet-length <n>', 'Maximum code snippet length', '200')
  .option(
    '--trace-dir <path>',
    'Custom directory for trace output (default: .tsc-trace in project)'
  )
  .option('--keep-trace', 'Keep trace files after analysis (default: cleanup)')
  .option(
    '--tsc-args <args>',
    'Additional arguments to pass to tsc (e.g., "--skipLibCheck")'
  )
  .action(traceCommand);

program.parse();
