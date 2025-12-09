/**
 * Shared formatting utilities
 * Consolidated from multiple files to eliminate code duplication
 */

/**
 * Format milliseconds to human-readable duration
 * Handles microseconds, milliseconds, seconds, and minutes
 */
export function formatDuration(ms: number): string {
  if (ms < 0.001) {
    return '<0.001ms';
  }
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}µs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format a number with locale-specific separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

/**
 * Get file icon based on extension
 */
export function getFileIcon(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const icons: Record<string, string> = {
    ts: '📘',
    tsx: '⚛️',
    js: '📒',
    jsx: '⚛️',
    json: '📋',
    css: '🎨',
    scss: '🎨',
    html: '🌐',
    md: '📝',
    default: '📄',
  };
  return icons[ext || 'default'] || icons.default;
}

/**
 * Extract file name from path
 */
export function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

/**
 * Extract directory from path
 */
export function getDirectory(path: string): string {
  const parts = path.split('/');
  parts.pop();
  if (parts.length === 0) return '';
  if (parts.length > 2) {
    return `.../${parts.slice(-2).join('/')}`;
  }
  return parts.join('/');
}

/**
 * Format kind name for display (shorter version)
 */
export function formatKindName(kindName: string): string {
  return kindName
    .replace('Expression', 'Expr')
    .replace('Statement', 'Stmt')
    .replace('Declaration', 'Decl')
    .replace('Literal', 'Lit')
    .trim();
}

/**
 * Format event count with abbreviation
 */
export function formatEventCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}
