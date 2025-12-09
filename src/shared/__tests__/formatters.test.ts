import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatBytes,
  formatNumber,
  formatPercentage,
  getFileIcon,
  getFileName,
  getDirectory,
  formatKindName,
  formatEventCount,
} from '../formatters';

describe('formatDuration', () => {
  it('should format sub-microsecond values', () => {
    expect(formatDuration(0.0001)).toBe('<0.001ms');
    expect(formatDuration(0.0009)).toBe('<0.001ms');
  });

  it('should format microseconds', () => {
    expect(formatDuration(0.001)).toBe('1.00µs');
    expect(formatDuration(0.5)).toBe('500.00µs');
    expect(formatDuration(0.999)).toBe('999.00µs');
  });

  it('should format milliseconds', () => {
    expect(formatDuration(1)).toBe('1.00ms');
    expect(formatDuration(100)).toBe('100.00ms');
    expect(formatDuration(999.99)).toBe('999.99ms');
  });

  it('should format seconds', () => {
    expect(formatDuration(1000)).toBe('1.00s');
    expect(formatDuration(5500)).toBe('5.50s');
    expect(formatDuration(59999)).toBe('60.00s');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(60000)).toBe('1m 0.0s');
    expect(formatDuration(90000)).toBe('1m 30.0s');
    expect(formatDuration(125000)).toBe('2m 5.0s');
  });
});

describe('formatBytes', () => {
  it('should format 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('should format bytes', () => {
    expect(formatBytes(100)).toBe('100 Bytes');
    expect(formatBytes(1023)).toBe('1023 Bytes');
  });

  it('should format kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1572864)).toBe('1.5 MB');
  });

  it('should format gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
    expect(formatBytes(1610612736)).toBe('1.5 GB');
  });
});

describe('formatNumber', () => {
  it('should format numbers with locale separators', () => {
    // Note: locale formatting depends on environment
    expect(formatNumber(1000)).toMatch(/1[,.]?000/);
    expect(formatNumber(1000000)).toMatch(/1[,.]?000[,.]?000/);
  });

  it('should format small numbers', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
  });
});

describe('formatPercentage', () => {
  it('should format percentage correctly', () => {
    expect(formatPercentage(50, 100)).toBe('50.0%');
    expect(formatPercentage(25, 100)).toBe('25.0%');
    expect(formatPercentage(1, 3)).toBe('33.3%');
  });

  it('should handle 0 total', () => {
    expect(formatPercentage(50, 0)).toBe('0%');
  });

  it('should handle 100%', () => {
    expect(formatPercentage(100, 100)).toBe('100.0%');
  });

  it('should handle small percentages', () => {
    expect(formatPercentage(1, 1000)).toBe('0.1%');
  });
});

describe('getFileIcon', () => {
  it('should return correct icon for TypeScript files', () => {
    expect(getFileIcon('file.ts')).toBe('📘');
  });

  it('should return correct icon for TSX files', () => {
    expect(getFileIcon('component.tsx')).toBe('⚛️');
  });

  it('should return correct icon for JavaScript files', () => {
    expect(getFileIcon('script.js')).toBe('📒');
  });

  it('should return correct icon for JSX files', () => {
    expect(getFileIcon('component.jsx')).toBe('⚛️');
  });

  it('should return correct icon for JSON files', () => {
    expect(getFileIcon('config.json')).toBe('📋');
  });

  it('should return correct icon for CSS files', () => {
    expect(getFileIcon('styles.css')).toBe('🎨');
  });

  it('should return correct icon for SCSS files', () => {
    expect(getFileIcon('styles.scss')).toBe('🎨');
  });

  it('should return correct icon for HTML files', () => {
    expect(getFileIcon('index.html')).toBe('🌐');
  });

  it('should return correct icon for Markdown files', () => {
    expect(getFileIcon('README.md')).toBe('📝');
  });

  it('should return default icon for unknown extensions', () => {
    expect(getFileIcon('file.xyz')).toBe('📄');
  });

  it('should handle files in nested paths', () => {
    expect(getFileIcon('src/components/Button.tsx')).toBe('⚛️');
  });
});

describe('getFileName', () => {
  it('should extract file name from path', () => {
    expect(getFileName('src/components/Button.tsx')).toBe('Button.tsx');
  });

  it('should handle simple file name', () => {
    expect(getFileName('file.ts')).toBe('file.ts');
  });

  it('should handle deeply nested path', () => {
    expect(getFileName('a/b/c/d/e/file.ts')).toBe('file.ts');
  });
});

describe('getDirectory', () => {
  it('should extract directory from path', () => {
    expect(getDirectory('src/components/Button.tsx')).toBe('src/components');
  });

  it('should return empty string for simple file name', () => {
    expect(getDirectory('file.ts')).toBe('');
  });

  it('should truncate long directory paths', () => {
    expect(getDirectory('a/b/c/d/file.ts')).toBe('.../c/d');
  });

  it('should handle two-level directory', () => {
    expect(getDirectory('src/file.ts')).toBe('src');
  });
});

describe('formatKindName', () => {
  it('should abbreviate Expression', () => {
    expect(formatKindName('CallExpression')).toBe('CallExpr');
    expect(formatKindName('BinaryExpression')).toBe('BinaryExpr');
  });

  it('should abbreviate Statement', () => {
    expect(formatKindName('IfStatement')).toBe('IfStmt');
    expect(formatKindName('ReturnStatement')).toBe('ReturnStmt');
  });

  it('should abbreviate Declaration', () => {
    expect(formatKindName('FunctionDeclaration')).toBe('FunctionDecl');
    expect(formatKindName('VariableDeclaration')).toBe('VariableDecl');
  });

  it('should abbreviate Literal', () => {
    expect(formatKindName('StringLiteral')).toBe('StringLit');
    expect(formatKindName('NumericLiteral')).toBe('NumericLit');
  });

  it('should handle multiple abbreviations', () => {
    expect(formatKindName('ExpressionStatement')).toBe('ExprStmt');
  });

  it('should handle names without known suffixes', () => {
    expect(formatKindName('Identifier')).toBe('Identifier');
  });
});

describe('formatEventCount', () => {
  it('should format small numbers as-is', () => {
    expect(formatEventCount(0)).toBe('0');
    expect(formatEventCount(100)).toBe('100');
    expect(formatEventCount(999)).toBe('999');
  });

  it('should format thousands with K suffix', () => {
    expect(formatEventCount(1000)).toBe('1.0K');
    expect(formatEventCount(1500)).toBe('1.5K');
    expect(formatEventCount(10000)).toBe('10.0K');
    expect(formatEventCount(999999)).toBe('1000.0K');
  });

  it('should format millions with M suffix', () => {
    expect(formatEventCount(1000000)).toBe('1.0M');
    expect(formatEventCount(1500000)).toBe('1.5M');
    expect(formatEventCount(10000000)).toBe('10.0M');
  });
});
