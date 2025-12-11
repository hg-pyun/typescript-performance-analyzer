import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FileEvents } from '../../../parser/types';
import {
  formatDuration,
  getFileIcon,
  getFileName,
  getDirectory,
} from '../../../shared/formatters';

interface HotspotTableProps {
  files: FileEvents[];
  onFileSelect: (file: FileEvents) => void;
  selectedFile: FileEvents | null;
}

type SortKey = 'total' | 'parse' | 'bind' | 'check';

export function HotspotTable({
  files,
  onFileSelect,
  selectedFile,
}: HotspotTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('total');
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.shortPath.toLowerCase().includes(query) ||
          f.filePath.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'parse':
          return b.parseTime - a.parseTime;
        case 'bind':
          return b.bindTime - a.bindTime;
        case 'check':
          return b.checkTime - a.checkTime;
        default:
          return b.totalTime - a.totalTime;
      }
    });

    return result;
  }, [files, searchQuery, sortBy]);

  // Virtual scrolling for large file lists
  const virtualizer = useVirtualizer({
    count: filteredFiles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  return (
    <div className="hotspot-table-wrapper">
      {/* Compact header with search and sort */}
      <div className="hotspot-header-compact">
        <div className="search-wrapper">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Filter files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="hotspot-search"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="sort-select-compact"
        >
          <option value="total">Total</option>
          <option value="check">Check</option>
          <option value="parse">Parse</option>
          <option value="bind">Bind</option>
        </select>
        <span className="file-count-badge">{filteredFiles.length}</span>
      </div>

      {/* File list with virtual scrolling */}
      <div className="file-list-container" ref={parentRef}>
        {filteredFiles.length === 0 ? (
          <div className="empty-state-compact">
            {searchQuery ? 'No files match your search' : 'No files to display'}
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const file = filteredFiles[virtualRow.index];
              return (
                <div
                  key={file.filePath}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <FileRow
                    file={file}
                    isSelected={selectedFile?.filePath === file.filePath}
                    onSelect={() => onFileSelect(file)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface FileRowProps {
  file: FileEvents;
  isSelected: boolean;
  onSelect: () => void;
}

function FileRow({ file, isSelected, onSelect }: FileRowProps) {
  return (
    <div
      className={`file-row ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <span className="file-icon">{getFileIcon(file.shortPath)}</span>
      <div className="file-name-container">
        <span className="file-name" title={file.filePath}>
          {getFileName(file.shortPath)}
        </span>
        <span className="file-path-dim">{getDirectory(file.shortPath)}</span>
      </div>
      <span className="file-duration">{formatDuration(file.totalTime)}</span>
    </div>
  );
}
