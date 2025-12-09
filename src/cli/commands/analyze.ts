import { join, resolve } from 'path';
import { access } from 'fs/promises';
import chalk from 'chalk';
import { createSpinner } from '../utils/spinner.js';
import { parseTraceFile } from '../../parser/trace-parser.js';
import {
  processEvents,
  filterByDuration,
} from '../../parser/event-processor.js';
import { buildTimeline } from '../../analyzer/timeline-builder.js';
import { calculateMetrics } from '../../analyzer/metrics-calculator.js';
import { generateHtmlReport } from '../output/html-generator.js';
import { SnippetExtractor } from '../../parser/snippet-extractor.js';
import { formatDuration } from '../../shared/formatters.js';
import {
  formatPhase,
  calculateTotalPhaseTime,
} from '../../shared/cli-formatters.js';
import type { ReportData, ProcessedEvent } from '../../parser/types.js';

interface AnalyzeOptions {
  output: string;
  open?: boolean;
  minDuration: string;
  top: string;
  verbose?: boolean;
  project?: string;
  snippetLength?: string;
}

export async function analyzeCommand(
  traceDir: string,
  options: AnalyzeOptions
): Promise<void> {
  const spinner = createSpinner();

  try {
    // Resolve paths
    const tracePath = resolve(traceDir);
    const traceFile = join(tracePath, 'trace.json');
    const outputPath = resolve(options.output);
    const minDuration = parseFloat(options.minDuration);

    // Check if trace file exists
    try {
      await access(traceFile);
    } catch {
      console.error(chalk.red(`Error: trace.json not found in ${tracePath}`));
      process.exit(1);
    }

    console.log(chalk.cyan('\n📊 TypeScript Performance Analyzer\n'));
    console.log(chalk.gray(`Trace directory: ${tracePath}`));
    console.log(chalk.gray(`Output: ${outputPath}`));

    // Initialize snippet extractor if project path provided
    let snippetExtractor: SnippetExtractor | undefined;
    if (options.project) {
      const projectPath = resolve(options.project);
      const snippetLength = parseInt(options.snippetLength || '200', 10);

      try {
        await access(projectPath);
        snippetExtractor = new SnippetExtractor(projectPath, snippetLength);
        console.log(chalk.gray(`Project root: ${projectPath}`));
        console.log(chalk.gray('Code snippets will be extracted'));
      } catch {
        console.warn(
          chalk.yellow(`Warning: Project path not found: ${projectPath}`)
        );
        console.warn(chalk.yellow('Code snippets will not be available.'));
      }
    }
    console.log('');

    // Step 1: Parse trace file
    spinner.start('Parsing trace.json...');
    const rawEvents = await parseTraceFile(traceFile, (progress) => {
      if (options.verbose) {
        spinner.text = `Parsing trace.json... ${progress.percentage}% (${progress.eventsCount.toLocaleString()} events)`;
      }
    });
    spinner.succeed(`Parsed ${rawEvents.length.toLocaleString()} events`);

    // Step 2: Process events
    spinner.start('Processing events...');
    let events = processEvents(rawEvents);
    spinner.succeed(`Processed ${events.length.toLocaleString()} events`);

    // Step 3: Filter by minimum duration
    if (minDuration > 0) {
      spinner.start(`Filtering events (min duration: ${minDuration}ms)...`);
      const beforeCount = events.length;
      events = filterByDuration(events, minDuration);
      spinner.succeed(
        `Filtered to ${events.length.toLocaleString()} events (removed ${(beforeCount - events.length).toLocaleString()})`
      );
    }

    // Step 3.5: Extract code snippets if project path provided
    if (snippetExtractor) {
      spinner.start('Extracting code snippets...');
      events = await extractSnippetsForEvents(events, snippetExtractor);
      spinner.succeed('Code snippets extracted');
    }

    // Step 4: Build timeline
    spinner.start('Building timeline...');
    const timeline = buildTimeline(events);
    spinner.succeed(
      `Timeline built: ${timeline.files.length.toLocaleString()} files, ${timeline.totalDuration.toFixed(2)}ms total`
    );

    // Step 5: Calculate metrics
    spinner.start('Calculating metrics...');
    const metrics = calculateMetrics(timeline);
    spinner.succeed('Metrics calculated');

    // Step 6: Generate report data
    const reportData: ReportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        traceFile: traceFile,
        version: '0.1.0',
      },
      timeline,
      metrics,
    };

    // Step 7: Generate HTML
    spinner.start('Generating HTML report...');
    await generateHtmlReport(reportData, outputPath);
    spinner.succeed(`Report generated: ${outputPath}`);

    // Print summary
    console.log('\n' + chalk.green('✅ Analysis complete!\n'));
    printQuickSummary(metrics);

    // Open in browser if requested
    if (options.open) {
      console.log(chalk.gray('\nOpening report in browser...'));
      const { exec } = await import('child_process');
      const cmd =
        process.platform === 'darwin'
          ? 'open'
          : process.platform === 'win32'
            ? 'start'
            : 'xdg-open';
      exec(`${cmd} "${outputPath}"`);
    }
  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(chalk.red(`\nError: ${(error as Error).message}`));
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

function printQuickSummary(metrics: ReturnType<typeof calculateMetrics>): void {
  const phases = metrics.phases;
  const totalPhaseTime = calculateTotalPhaseTime(phases);

  console.log(chalk.bold('Summary:'));
  console.log(
    `  Total Duration: ${chalk.yellow(formatDuration(metrics.totalDuration))}`
  );
  console.log(`  Files: ${chalk.yellow(metrics.totalFiles.toLocaleString())}`);
  console.log(
    `  Events: ${chalk.yellow(metrics.totalEvents.toLocaleString())}`
  );
  console.log('');
  console.log(chalk.bold('Phase Breakdown:'));
  console.log(formatPhase('Parse', phases.parse.totalTime, totalPhaseTime));
  console.log(formatPhase('Bind', phases.bind.totalTime, totalPhaseTime));
  console.log(formatPhase('Check', phases.check.totalTime, totalPhaseTime));
  console.log(formatPhase('Emit', phases.emit.totalTime, totalPhaseTime));
}

/**
 * Extract code snippets for events that have position information
 */
async function extractSnippetsForEvents(
  events: ProcessedEvent[],
  snippetExtractor: SnippetExtractor
): Promise<ProcessedEvent[]> {
  // Collect locations that need snippet extraction
  const locationsToExtract: Array<{
    filePath: string;
    pos: number;
    end: number;
  }> = [];
  const eventIndices: number[] = [];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!event.args || !event.filePath) continue;

    const pos = event.args.pos as number | undefined;
    const end = event.args.end as number | undefined;

    if (pos !== undefined && end !== undefined) {
      locationsToExtract.push({
        filePath: event.filePath,
        pos,
        end,
      });
      eventIndices.push(i);
    }
  }

  // Batch extract snippets
  const snippets = await snippetExtractor.extractBatch(locationsToExtract);

  // Create new events array with snippets added to args
  const updatedEvents = [...events];

  for (let i = 0; i < eventIndices.length; i++) {
    const eventIndex = eventIndices[i];
    const loc = locationsToExtract[i];
    const key = `${loc.filePath}:${loc.pos}:${loc.end}`;
    const snippet = snippets.get(key);

    if (snippet) {
      const event = updatedEvents[eventIndex];
      updatedEvents[eventIndex] = {
        ...event,
        args: {
          ...event.args,
          codeSnippet: snippet.code,
          lineNumber: snippet.lineNumber,
          columnNumber: snippet.columnNumber,
        },
      };
    }
  }

  return updatedEvents;
}
