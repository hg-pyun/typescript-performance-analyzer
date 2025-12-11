import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { access, mkdir, rm, readFile, stat } from 'fs/promises';
import { spawn, execSync } from 'child_process';
import chalk from 'chalk';
import { createSpinner, type Spinner } from '../utils/spinner.js';
import { analyzeCommand } from './analyze.js';
import { formatBytes } from '../../shared/formatters.js';

type PackageManager = 'npm' | 'yarn' | 'yarn-pnp' | 'pnpm';

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

    // Step 2: Detect package manager and find tsc
    spinner.start('Detecting package manager...');
    const packageManager = await detectPackageManager(resolvedProject);
    spinner.succeed(`Package manager detected: ${packageManager}`);

    // Step 3: Run tsc with --generateTrace
    spinner.start('Running TypeScript compiler with --generateTrace...');

    const tscCommand = await getTscCommand(resolvedProject, packageManager);
    // Use relative path for tsconfig to ensure extends resolution works correctly
    // especially in monorepo/yarn pnp environments where node_modules paths differ
    const tscArgs = [
      '-p',
      'tsconfig.json',
      '--generateTrace',
      traceDir,
      '--noEmit',
    ];

    // Add any additional tsc arguments
    if (options.tscArgs) {
      tscArgs.push(...options.tscArgs.split(' ').filter(Boolean));
    }

    if (options.verbose) {
      console.log(
        chalk.gray(`\n  ${tscCommand.command} ${[...tscCommand.prefixArgs, ...tscArgs].join(' ')}\n`)
      );
    }

    await runTsc(tscCommand, tscArgs, resolvedProject, traceDir, spinner, options.verbose);

    // Show final file sizes
    const traceFile = join(traceDir, 'trace.json');
    const typesFile = join(traceDir, 'types.json');
    const [traceStats, typesStats] = await Promise.all([
      stat(traceFile).catch(() => null),
      stat(typesFile).catch(() => null),
    ]);
    const sizeParts: string[] = [];
    if (traceStats) sizeParts.push(`trace: ${formatBytes(traceStats.size)}`);
    if (typesStats) sizeParts.push(`types: ${formatBytes(typesStats.size)}`);
    const sizeInfo = sizeParts.length > 0 ? ` (${sizeParts.join(', ')})` : '';
    spinner.succeed(`TypeScript compilation completed${sizeInfo}`);

    // Step 3: Verify trace was generated
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

interface TscCommand {
  command: string;
  prefixArgs: string[];
}

/**
 * Detect the package manager used in the project
 * Searches both project path and monorepo root for lock files
 */
async function detectPackageManager(projectPath: string): Promise<PackageManager> {
  // Get potential monorepo root to check there too
  const monorepoRoot = await findMonorepoRoot(projectPath);
  const pathsToCheck = [projectPath];
  if (monorepoRoot && monorepoRoot !== projectPath) {
    pathsToCheck.push(monorepoRoot);
  }

  for (const checkPath of pathsToCheck) {
    // Check for Yarn PnP first (.pnp.cjs or .pnp.js)
    const pnpCjs = join(checkPath, '.pnp.cjs');
    const pnpJs = join(checkPath, '.pnp.js');

    try {
      await access(pnpCjs);
      return 'yarn-pnp';
    } catch {
      // Continue checking
    }

    try {
      await access(pnpJs);
      return 'yarn-pnp';
    } catch {
      // Continue checking
    }

    // Check for yarn.lock
    const yarnLock = join(checkPath, 'yarn.lock');
    try {
      await access(yarnLock);
      // Check if it's Yarn Berry (v2+) by looking for .yarnrc.yml
      const yarnrcYml = join(checkPath, '.yarnrc.yml');
      try {
        await access(yarnrcYml);
        const content = await readFile(yarnrcYml, 'utf-8');
        // Check if nodeLinker is set to node-modules (not PnP)
        if (content.includes('nodeLinker: node-modules') || content.includes('nodeLinker: "node-modules"')) {
          return 'yarn';
        }
        // Yarn Berry with PnP (or pnpm linker)
        if (content.includes('nodeLinker: pnp') || !content.includes('nodeLinker:')) {
          return 'yarn-pnp';
        }
        return 'yarn';
      } catch {
        // No .yarnrc.yml means Yarn Classic (v1)
        return 'yarn';
      }
    } catch {
      // Continue checking
    }

    // Check for pnpm-lock.yaml
    const pnpmLock = join(checkPath, 'pnpm-lock.yaml');
    try {
      await access(pnpmLock);
      return 'pnpm';
    } catch {
      // Continue checking
    }
  }

  // Default to npm
  return 'npm';
}

/**
 * Find monorepo root by looking for workspace configuration files
 */
async function findMonorepoRoot(projectPath: string): Promise<string | null> {
  let currentPath = resolve(projectPath);
  let previousPath = '';

  // Traverse up to filesystem root
  while (currentPath !== previousPath) {
    // Check for various monorepo indicators
    const indicators = [
      join(currentPath, 'pnpm-workspace.yaml'),
      join(currentPath, 'lerna.json'),
    ];

    // Check package.json for workspaces field
    const packageJsonPath = join(currentPath, 'package.json');
    try {
      await access(packageJsonPath);
      const content = await readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      if (pkg.workspaces) {
        return currentPath;
      }
    } catch {
      // Continue
    }

    for (const indicator of indicators) {
      try {
        await access(indicator);
        return currentPath;
      } catch {
        // Continue
      }
    }

    previousPath = currentPath;
    currentPath = dirname(currentPath);
  }

  return null;
}

/**
 * Get the tsc command based on the package manager
 */
async function getTscCommand(
  projectPath: string,
  packageManager: PackageManager
): Promise<TscCommand> {
  // For Yarn PnP, we MUST use yarn to run tsc for proper module resolution
  if (packageManager === 'yarn-pnp') {
    return {
      command: 'yarn',
      prefixArgs: ['tsc'],
    };
  }

  // For pnpm, prefer using pnpm exec for proper module resolution
  if (packageManager === 'pnpm') {
    // Check if tsc is available via pnpm
    try {
      execSync('pnpm exec tsc --version', { cwd: projectPath, stdio: 'pipe' });
      return {
        command: 'pnpm',
        prefixArgs: ['exec', 'tsc'],
      };
    } catch {
      // Fall through to direct tsc lookup
    }
  }

  // For yarn (classic), try yarn exec first for monorepo compatibility
  if (packageManager === 'yarn') {
    // Check for monorepo - if we're in a workspace, use yarn
    const monorepoRoot = await findMonorepoRoot(projectPath);
    if (monorepoRoot && monorepoRoot !== projectPath) {
      return {
        command: 'yarn',
        prefixArgs: ['tsc'],
      };
    }
  }

  // Try to find tsc directly
  const tscPath = await findTscBinary(projectPath);
  if (tscPath) {
    return {
      command: tscPath,
      prefixArgs: [],
    };
  }

  // Fallback based on package manager
  if (packageManager === 'yarn') {
    return {
      command: 'yarn',
      prefixArgs: ['tsc'],
    };
  }

  if (packageManager === 'pnpm') {
    return {
      command: 'pnpm',
      prefixArgs: ['exec', 'tsc'],
    };
  }

  // npm fallback - try npx
  return {
    command: 'npx',
    prefixArgs: ['tsc'],
  };
}

/**
 * Find the tsc binary directly
 * Searches: project's node_modules, monorepo root's node_modules, this package's node_modules
 */
async function findTscBinary(projectPath: string): Promise<string | null> {
  const candidates: string[] = [];

  // 1. Project's local node_modules
  candidates.push(join(projectPath, 'node_modules', '.bin', 'tsc'));

  // 2. Monorepo root's node_modules
  const monorepoRoot = await findMonorepoRoot(projectPath);
  if (monorepoRoot) {
    candidates.push(join(monorepoRoot, 'node_modules', '.bin', 'tsc'));
  }

  // 3. This package's bundled tsc
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packageRoot = join(__dirname, '..', '..', '..');
  candidates.push(join(packageRoot, 'node_modules', '.bin', 'tsc'));

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue to next candidate
    }
  }

  return null;
}

/**
 * Run tsc and capture output with progress monitoring
 */
function runTsc(
  tscCommand: TscCommand,
  args: string[],
  cwd: string,
  traceDir: string,
  spinner: Spinner,
  verbose?: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    const fullArgs = [...tscCommand.prefixArgs, ...args];
    const proc = spawn(tscCommand.command, fullArgs, {
      cwd,
      shell: true,
      stdio: verbose ? 'inherit' : 'pipe',
    });

    const traceFile = join(traceDir, 'trace.json');
    const typesFile = join(traceDir, 'types.json');
    const startTime = Date.now();
    let errorOutput = '';

    // Monitor trace file size for progress
    const progressInterval = setInterval(async () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

      try {
        const [traceStats, typesStats] = await Promise.all([
          stat(traceFile).catch(() => null),
          stat(typesFile).catch(() => null),
        ]);

        const parts: string[] = [];
        if (traceStats) {
          parts.push(`trace: ${formatBytes(traceStats.size)}`);
        }
        if (typesStats) {
          parts.push(`types: ${formatBytes(typesStats.size)}`);
        }

        if (parts.length > 0) {
          spinner.text = `Running TypeScript compiler... ${chalk.cyan(parts.join(', '))} (${timeStr})`;
        } else if (elapsed > 2) {
          spinner.text = `Running TypeScript compiler... (${timeStr})`;
        }
      } catch {
        if (elapsed > 2) {
          spinner.text = `Running TypeScript compiler... (${timeStr})`;
        }
      }
    }, 500);

    // Capture stderr for error reporting
    if (!verbose && proc.stderr) {
      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
    }

    proc.on('error', (error) => {
      clearInterval(progressInterval);
      reject(new Error(`Failed to run tsc: ${error.message}`));
    });

    proc.on('close', (code) => {
      clearInterval(progressInterval);

      // Exit code 127 means command not found - this is a fatal error
      if (code === 127) {
        reject(
          new Error(
            'TypeScript compiler (tsc) not found. Please install TypeScript in your project:\n  npm install typescript --save-dev'
          )
        );
        return;
      }

      // TypeScript may return non-zero exit code for type errors,
      // but trace should still be generated
      if (code !== 0) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.warn(chalk.yellow(`\nTypeScript exited with code ${code} (${elapsed}s)`));
        console.warn(
          chalk.yellow('Type errors may exist, but trace was generated.\n')
        );
        // Show last few lines of error output if not verbose
        if (!verbose && errorOutput) {
          const lines = errorOutput.trim().split('\n');
          const lastLines = lines.slice(-10);
          if (lines.length > 10) {
            console.warn(chalk.gray(`... (${lines.length - 10} more errors above)`));
          }
          console.warn(chalk.gray(lastLines.join('\n')));
        }
      }
      resolve();
    });
  });
}
