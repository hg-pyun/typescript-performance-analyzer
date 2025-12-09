import { join, resolve } from 'path';
import { access } from 'fs/promises';
import chalk from 'chalk';
import { createSpinner } from '../utils/spinner.js';
import { parseTraceFile } from '../../parser/trace-parser.js';
import { processEvents } from '../../parser/event-processor.js';
import { buildTimeline } from '../../analyzer/timeline-builder.js';
import { calculateMetrics } from '../../analyzer/metrics-calculator.js';
import { formatDuration } from '../../shared/formatters.js';
import {
  printPhaseBar,
  calculateTotalPhaseTime,
} from '../../shared/cli-formatters.js';

interface SummaryOptions {
  top: string;
}

export async function summaryCommand(
  traceDir: string,
  options: SummaryOptions
): Promise<void> {
  const spinner = createSpinner();
  const topN = parseInt(options.top, 10);

  try {
    // Resolve paths
    const tracePath = resolve(traceDir);
    const traceFile = join(tracePath, 'trace.json');

    // Check if trace file exists
    try {
      await access(traceFile);
    } catch {
      console.error(chalk.red(`Error: trace.json not found in ${tracePath}`));
      process.exit(1);
    }

    // Parse and process
    spinner.start('Parsing trace.json...');
    const rawEvents = await parseTraceFile(traceFile);
    spinner.succeed(`Parsed ${rawEvents.length.toLocaleString()} events`);

    spinner.start('Processing...');
    const events = processEvents(rawEvents);
    const timeline = buildTimeline(events);
    const metrics = calculateMetrics(timeline);
    spinner.stop();

    // Print formatted summary
    console.log('\n' + chalk.cyan('═'.repeat(50)));
    console.log(chalk.bold.cyan('  TypeScript Compilation Summary'));
    console.log(chalk.cyan('═'.repeat(50)) + '\n');

    // Overall metrics
    console.log(chalk.bold('📊 Overview'));
    console.log(
      `   Total Duration: ${chalk.yellow(formatDuration(metrics.totalDuration))}`
    );
    console.log(
      `   Files Processed: ${chalk.yellow(metrics.totalFiles.toLocaleString())}`
    );
    console.log(
      `   Total Events: ${chalk.yellow(metrics.totalEvents.toLocaleString())}`
    );
    console.log('');

    // Phase breakdown
    const phases = metrics.phases;
    const totalPhaseTime = calculateTotalPhaseTime(phases);

    console.log(chalk.bold('⏱️  Phase Breakdown'));
    printPhaseBar('Parse', phases.parse.totalTime, totalPhaseTime, chalk.blue);
    printPhaseBar('Bind', phases.bind.totalTime, totalPhaseTime, chalk.green);
    printPhaseBar(
      'Check',
      phases.check.totalTime,
      totalPhaseTime,
      chalk.yellow
    );
    printPhaseBar('Emit', phases.emit.totalTime, totalPhaseTime, chalk.magenta);
    console.log('');

    // Hotspots
    console.log(chalk.bold(`🔥 Top ${topN} Slowest Files`));
    const hotspots = metrics.hotspots.slowestFiles.slice(0, topN);
    for (let i = 0; i < hotspots.length; i++) {
      const file = hotspots[i];
      const rank = chalk.gray(`${(i + 1).toString().padStart(2)}.`);
      const duration = chalk.yellow(formatDuration(file.duration).padStart(10));
      console.log(`   ${rank} ${duration}  ${chalk.white(file.shortPath)}`);
    }
    console.log('');

    // Type checking hotspots
    if (metrics.hotspots.slowestCheckFiles.length > 0) {
      console.log(chalk.bold('🔍 Slowest Type Checking'));
      const checkHotspots = metrics.hotspots.slowestCheckFiles.slice(0, 5);
      for (let i = 0; i < checkHotspots.length; i++) {
        const file = checkHotspots[i];
        const rank = chalk.gray(`${(i + 1).toString().padStart(2)}.`);
        const duration = chalk.yellow(
          formatDuration(file.duration).padStart(10)
        );
        console.log(`   ${rank} ${duration}  ${chalk.white(file.shortPath)}`);
      }
      console.log('');
    }

    console.log(
      chalk.gray('Run `tsc-perf analyze` to generate interactive HTML report.')
    );
    console.log('');
  } catch (error) {
    spinner.fail('Summary failed');
    console.error(chalk.red(`\nError: ${(error as Error).message}`));
    process.exit(1);
  }
}
