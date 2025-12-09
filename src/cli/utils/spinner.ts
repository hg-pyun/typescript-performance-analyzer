import chalk from 'chalk';

/**
 * Simple spinner replacement for CJS compatibility
 */
export interface Spinner {
  start(text?: string): void;
  stop(): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  text: string;
}

export function createSpinner(): Spinner {
  let currentText = '';
  let intervalId: NodeJS.Timeout | null = null;
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;

  function clearLine() {
    process.stdout.write('\r\x1b[K');
  }

  return {
    get text() {
      return currentText;
    },
    set text(value: string) {
      currentText = value;
    },
    start(text?: string) {
      if (text) currentText = text;
      if (intervalId) return;

      intervalId = setInterval(() => {
        clearLine();
        process.stdout.write(
          chalk.cyan(frames[frameIndex]) + ' ' + currentText
        );
        frameIndex = (frameIndex + 1) % frames.length;
      }, 80);
    },
    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        clearLine();
      }
    },
    succeed(text?: string) {
      this.stop();
      console.log(chalk.green('✓') + ' ' + (text || currentText));
    },
    fail(text?: string) {
      this.stop();
      console.log(chalk.red('✗') + ' ' + (text || currentText));
    },
  };
}
