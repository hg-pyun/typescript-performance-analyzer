import { useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FileEvents, ProcessedEvent } from '../../../parser/types';
import { PHASE_COLORS, getCategoryColor } from '../../utils/colors';
import { formatDuration } from '../../utils/formatters';

interface TimelineChartProps {
  files: FileEvents[];
  totalDuration: number;
  zoomLevel: number;
  selectedFile: FileEvents | null;
  onFileSelect: (file: FileEvents) => void;
}

interface TooltipData {
  event: ProcessedEvent;
  x: number;
  y: number;
}

export function TimelineChart({
  files,
  totalDuration,
  zoomLevel,
  selectedFile,
  onFileSelect,
}: TimelineChartProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Virtual scrolling for large file lists
  const virtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Calculate the scaled width
  const baseWidth = 800;
  const scaledWidth = baseWidth * zoomLevel;

  // Time scale: pixels per millisecond
  const timeScale = totalDuration > 0 ? scaledWidth / totalDuration : 1;

  // Handle mouse enter on event
  const handleEventMouseEnter = useCallback(
    (e: React.MouseEvent, event: ProcessedEvent) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTooltip({
        event,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    },
    []
  );

  const handleEventMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (files.length === 0) {
    return (
      <div
        className="timeline-viewport"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: 'var(--text-muted)' }}>
          No files to display. Try adjusting your search filter.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="timeline-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <span>Timeline ({formatDuration(totalDuration)} total)</span>
          <div className="legend">
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: PHASE_COLORS.parse }}
              />
              <span>Parse</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: PHASE_COLORS.bind }}
              />
              <span>Bind</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: PHASE_COLORS.check }}
              />
              <span>Check</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: PHASE_COLORS.emit }}
              />
              <span>Emit</span>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={parentRef}
        className="timeline-viewport"
        style={{ overflowY: 'auto', overflowX: 'auto' }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: scaledWidth + 220,
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const file = files[virtualRow.index];
            const isSelected = selectedFile?.filePath === file.filePath;

            return (
              <div
                key={file.filePath}
                className="timeline-row"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: 32,
                  transform: `translateY(${virtualRow.start}px)`,
                  backgroundColor: isSelected
                    ? 'var(--bg-secondary)'
                    : undefined,
                }}
                onClick={() => onFileSelect(file)}
              >
                <div className="timeline-file-name" title={file.filePath}>
                  {file.shortPath}
                </div>
                <div
                  className="timeline-bars"
                  style={{ width: scaledWidth, marginLeft: '1rem' }}
                >
                  {file.events.map((event) => {
                    const left = event.startTime * timeScale;
                    const width = Math.max(event.duration * timeScale, 2);

                    return (
                      <div
                        key={event.id}
                        className="timeline-event"
                        style={{
                          left: `${left}px`,
                          width: `${width}px`,
                          backgroundColor: getCategoryColor(event.category),
                        }}
                        onMouseEnter={(e) => handleEventMouseEnter(e, event)}
                        onMouseLeave={handleEventMouseLeave}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="tooltip-title">{tooltip.event.name}</div>
          <div className="tooltip-content">
            Duration: {formatDuration(tooltip.event.duration)}
            <br />
            Category: {tooltip.event.category}
            {tooltip.event.filePath && (
              <>
                <br />
                File: {tooltip.event.filePath.split('/').pop()}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
