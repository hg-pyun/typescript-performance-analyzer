import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import pkg from 'stream-json';
import StreamArray from 'stream-json/streamers/StreamArray.js';
import type { TraceEvent } from './types.js';
import { formatBytes } from '../shared/formatters.js';

const { parser } = pkg;
const streamArray = StreamArray.streamArray;

export interface ParseProgress {
  bytesRead: number;
  totalBytes: number;
  eventsCount: number;
  percentage: number;
}

export type ProgressCallback = (progress: ParseProgress) => void;

/**
 * Stream-parse trace.json file for memory efficiency
 */
export async function parseTraceFile(
  filePath: string,
  onProgress?: ProgressCallback
): Promise<TraceEvent[]> {
  const stats = await stat(filePath);
  const totalBytes = stats.size;
  const events: TraceEvent[] = [];
  let bytesRead = 0;
  let lastReportedPercentage = 0;

  return new Promise((resolve, reject) => {
    const readStream = createReadStream(filePath);
    const jsonParser = parser();
    const arrayStream = streamArray();

    readStream.on('data', (chunk) => {
      bytesRead += chunk.length;
      const percentage = Math.floor((bytesRead / totalBytes) * 100);

      if (onProgress && percentage > lastReportedPercentage) {
        lastReportedPercentage = percentage;
        onProgress({
          bytesRead,
          totalBytes,
          eventsCount: events.length,
          percentage,
        });
      }
    });

    const pipeline = readStream.pipe(jsonParser).pipe(arrayStream);

    pipeline.on('data', ({ value }: { value: TraceEvent }) => {
      events.push(value);
    });

    pipeline.on('end', () => {
      if (onProgress) {
        onProgress({
          bytesRead: totalBytes,
          totalBytes,
          eventsCount: events.length,
          percentage: 100,
        });
      }
      resolve(events);
    });

    pipeline.on('error', (err: Error) => {
      reject(new Error(`Failed to parse trace file: ${err.message}`));
    });

    readStream.on('error', (err: Error) => {
      reject(new Error(`Failed to read trace file: ${err.message}`));
    });
  });
}

/**
 * Generator-based streaming parser for very large files
 * Use when you need to process events one by one
 */
export async function* streamTraceEvents(
  filePath: string
): AsyncGenerator<TraceEvent, void, unknown> {
  const readStream = createReadStream(filePath);
  const jsonParser = parser();
  const arrayStream = streamArray();

  const pipeline = readStream.pipe(jsonParser).pipe(arrayStream);

  for await (const { value } of pipeline as AsyncIterable<{
    value: TraceEvent;
  }>) {
    yield value;
  }
}

/**
 * Get basic file info without parsing
 */
export async function getTraceFileInfo(filePath: string): Promise<{
  size: number;
  sizeFormatted: string;
}> {
  const stats = await stat(filePath);
  const size = stats.size;
  const sizeFormatted = formatBytes(size);
  return { size, sizeFormatted };
}
