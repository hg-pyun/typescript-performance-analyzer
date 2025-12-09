import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, join } from 'path';

export interface SnippetCache {
  [filePath: string]: {
    content: string;
    lineOffsets: number[];
  };
}

export interface ExtractedSnippet {
  code: string;
  lineNumber: number;
  columnNumber: number;
  truncated: boolean;
}

/**
 * Extracts code snippets from source files using byte offsets.
 * Caches file contents for efficient repeated access.
 */
export class SnippetExtractor {
  private cache: SnippetCache = {};
  private projectRoot: string;
  private maxSnippetLength: number;
  private pathMappings: Map<string, string> = new Map();

  constructor(projectRoot: string, maxSnippetLength = 200) {
    this.projectRoot = resolve(projectRoot);
    this.maxSnippetLength = maxSnippetLength;
  }

  /**
   * Calculate line and column number from byte offset
   */
  private calculateLineColumn(
    lineOffsets: number[],
    pos: number
  ): { line: number; column: number } {
    let line = 1;
    for (let i = 0; i < lineOffsets.length; i++) {
      if (lineOffsets[i] > pos) {
        line = i;
        break;
      }
      line = i + 1;
    }
    const lineStart = line > 1 ? lineOffsets[line - 1] : 0;
    return { line, column: pos - lineStart + 1 };
  }

  /**
   * Load file content and calculate line offsets
   */
  private async loadFile(filePath: string): Promise<{
    content: string;
    lineOffsets: number[];
  } | null> {
    // Check cache
    if (this.cache[filePath]) {
      return this.cache[filePath];
    }

    // Resolve path
    const resolvedPath = this.resolveFilePath(filePath);
    if (!resolvedPath || !existsSync(resolvedPath)) {
      return null;
    }

    try {
      const content = await readFile(resolvedPath, 'utf-8');
      const lineOffsets: number[] = [0];

      // Calculate line start positions
      for (let i = 0; i < content.length; i++) {
        if (content[i] === '\n') {
          lineOffsets.push(i + 1);
        }
      }

      this.cache[filePath] = { content, lineOffsets };
      return this.cache[filePath];
    } catch {
      return null;
    }
  }

  /**
   * Resolve trace file path to actual file path
   */
  private resolveFilePath(tracePath: string): string | null {
    // Check cached mapping
    if (this.pathMappings.has(tracePath)) {
      return this.pathMappings.get(tracePath)!;
    }

    // Try absolute path
    if (existsSync(tracePath)) {
      this.pathMappings.set(tracePath, tracePath);
      return tracePath;
    }

    // Try relative to project root
    const projectPath = join(this.projectRoot, tracePath);
    if (existsSync(projectPath)) {
      this.pathMappings.set(tracePath, projectPath);
      return projectPath;
    }

    // Try matching partial path (for node_modules, etc.)
    const pathParts = tracePath.split(/[/\\]/);
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const partialPath = join(this.projectRoot, ...pathParts.slice(i));
      if (existsSync(partialPath)) {
        this.pathMappings.set(tracePath, partialPath);
        return partialPath;
      }
    }

    // Try extracting from common patterns like /Users/.../project/src/...
    const srcIndex = tracePath.indexOf('/src/');
    if (srcIndex !== -1) {
      const relativePath = tracePath.substring(srcIndex + 1);
      const srcPath = join(this.projectRoot, relativePath);
      if (existsSync(srcPath)) {
        this.pathMappings.set(tracePath, srcPath);
        return srcPath;
      }
    }

    return null;
  }

  /**
   * Extract code snippet from file using byte offsets
   */
  async extractSnippet(
    filePath: string,
    pos: number,
    end: number
  ): Promise<ExtractedSnippet | null> {
    const fileData = await this.loadFile(filePath);
    if (!fileData) {
      return null;
    }

    const { content, lineOffsets } = fileData;

    // Validate range
    if (pos < 0 || end > content.length || pos >= end) {
      return null;
    }

    // Extract code
    let code = content.slice(pos, end);
    let truncated = false;

    // Apply length limit
    if (code.length > this.maxSnippetLength) {
      code = code.slice(0, this.maxSnippetLength) + '...';
      truncated = true;
    }

    // Calculate line/column
    const { line, column } = this.calculateLineColumn(lineOffsets, pos);

    return {
      code: code.trim(),
      lineNumber: line,
      columnNumber: column,
      truncated,
    };
  }

  /**
   * Batch extract snippets for multiple locations (memory efficient)
   */
  async extractBatch(
    locations: Array<{ filePath: string; pos: number; end: number }>
  ): Promise<Map<string, ExtractedSnippet | null>> {
    const results = new Map<string, ExtractedSnippet | null>();

    // Group by file for efficient processing
    const byFile = new Map<
      string,
      Array<{ pos: number; end: number; key: string }>
    >();

    for (const loc of locations) {
      const key = `${loc.filePath}:${loc.pos}:${loc.end}`;
      if (!byFile.has(loc.filePath)) {
        byFile.set(loc.filePath, []);
      }
      byFile.get(loc.filePath)!.push({ pos: loc.pos, end: loc.end, key });
    }

    // Process by file
    for (const [filePath, locs] of byFile) {
      for (const loc of locs) {
        const snippet = await this.extractSnippet(filePath, loc.pos, loc.end);
        results.set(loc.key, snippet);
      }
      // Clear cache for memory management when processing many files
      if (byFile.size > 10) {
        delete this.cache[filePath];
      }
    }

    return results;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache = {};
    this.pathMappings.clear();
  }

  /**
   * Get project root path
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }
}
