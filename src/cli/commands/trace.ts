import { join, resolve } from 'path';
import { access, mkdir, rm } from 'fs/promises';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { createSpinner } from '../utils/spinner.js';
import { analyzeCommand } from './analyze.js';

interface TraceOptions {
  output: string;
  open?: boolean;
  minDuration: string;
  top: string;
  verbose?: boolean;
  snippetLength?: string;
  traceDir?: string;
  keepTrace?: boolean;
  tscArgs?: string;
}

export async function traceCommand(
  projectPath: string,
  options: TraceOptions
): Promise<void> {
  const spinner = createSpinner();
  const resolvedProject = resolve(projectPath);

  // Determine trace output directory
  const traceDir = options.traceDir
    ? resolve(options.traceDir)
    : join(resolvedProject, '.tsc-trace');

  try {
    // Check if project path exists
    try {
      await access(resolvedProject);
    } catch {
      console.error(
        chalk.red(`Error: Project path not found: ${resolvedProject}`)
      );
      process.exit(1);
    }

    // Check for tsconfig.json
    const tsconfigPath = join(resolvedProject, 'tsconfig.json');
    try {
      await access(tsconfigPath);
    } catch {
      console.error(
        chalk.red(`Error: tsconfig.json not found in ${resolvedProject}`)
      );
      process.exit(1);
    }

    console.log(
      chalk.cyan('\n📊 TypeScript Performance Analyzer - Trace Mode\n')
    );
    console.log(chalk.gray(`Project: ${resolvedProject}`));
    console.log(chalk.gray(`Trace output: ${traceDir}`));
    console.log('');

    // Step 1: Create trace directory
    spinner.start('Creating trace directory...');
    await mkdir(traceDir, { recursive: true });
    spinner.succeed(`Trace directory ready: ${traceDir}`);

    // Step 2: Run tsc with --generateTrace
    spinner.start('Running TypeScript compiler with --generateTrace...');

    const tscPath = await findTsc(resolvedProject);
    const tscArgs = [
      '-p',
      tsconfigPath,
      '--generateTrace',
      traceDir,
      '--noEmit',
    ];

    // Add any additional tsc arguments
    if (options.tscArgs) {
      tscArgs.push(...options.tscArgs.split(' ').filter(Boolean));
    }

    if (options.verbose) {
      console.log(chalk.gray(`\n  ${tscPath} ${tscArgs.join(' ')}\n`));
    }

    await runTsc(tscPath, tscArgs, resolvedProject, options.verbose);
    spinner.succeed('TypeScript compilation completed with trace');

    // Step 3: Verify trace was generated
    const traceFile = join(traceDir, 'trace.json');
    try {
      await access(traceFile);
    } catch {
      console.error(
        chalk.red(`Error: trace.json was not generated in ${traceDir}`)
      );
      console.error(
        chalk.yellow('This might happen if the TypeScript version is too old.')
      );
      console.error(
        chalk.yellow('--generateTrace requires TypeScript 4.1 or later.')
      );
      process.exit(1);
    }

    console.log(chalk.gray('\nTrace files generated. Starting analysis...\n'));

    // Step 4: Run analysis
    await analyzeCommand(traceDir, {
      output: options.output,
      open: options.open,
      minDuration: options.minDuration,
      top: options.top,
      verbose: options.verbose,
      project: resolvedProject,
      snippetLength: options.snippetLength,
    });

    // Step 5: Cleanup trace directory if not keeping
    if (!options.keepTrace) {
      try {
        await rm(traceDir, { recursive: true, force: true });
        console.log(
          chalk.gray(
            `\nTrace files cleaned up. Use --keep-trace to preserve them.`
          )
        );
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    spinner.fail('Trace generation failed');
    console.error(chalk.red(`\nError: ${(error as Error).message}`));
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Find the tsc executable, preferring local node_modules
 */
async function findTsc(projectPath: string): Promise<string> {
  // Try local node_modules first
  const localTsc = join(projectPath, 'node_modules', '.bin', 'tsc');
  try {
    await access(localTsc);
    return localTsc;
  } catch {
    // Fall back to global tsc
    return 'tsc';
  }
}

/**
 * Run tsc and capture output
 */
function runTsc(
  tscPath: string,
  args: string[],
  cwd: string,
  verbose?: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(tscPath, args, {
      cwd,
      shell: true,
      stdio: verbose ? 'inherit' : 'pipe',
    });

    if (!verbose && proc.stderr) {
      proc.stderr.on('data', () => {
        // Capture stderr but don't store it - we only care about trace generation
      });
    }

    proc.on('error', (error) => {
      reject(new Error(`Failed to run tsc: ${error.message}`));
    });

    proc.on('close', (code) => {
      // TypeScript may return non-zero exit code for type errors,
      // but trace should still be generated
      if (code !== 0 && verbose) {
        console.warn(chalk.yellow(`\nTypeScript exited with code ${code}`));
        console.warn(
          chalk.yellow('Type errors may exist, but trace was generated.\n')
        );
      }
      resolve();
    });
  });
}
