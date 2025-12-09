import { useMemo, useState, useEffect, useRef } from 'react';
import type {
  FileEvents,
  ProcessedEvent,
  CodeLocation,
} from '../../../parser/types';
import {
  formatDuration,
  getFileIcon,
  formatKindName,
} from '../../utils/formatters';
import { extractLocationsFromFile } from '../../../parser/location-aggregator';
import { getKindGradient } from '../../utils/colors';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

interface SlowLocationsPanelProps {
  file: FileEvents;
  allEvents: ProcessedEvent[];
  onClose: () => void;
}

export function SlowLocationsPanel({
  file,
  allEvents,
  onClose,
}: SlowLocationsPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Extract slow locations for this file
  const locationDetails = useMemo(() => {
    const fileEvents = allEvents.filter((e) => e.filePath === file.filePath);
    return extractLocationsFromFile(fileEvents, file.filePath, file.shortPath);
  }, [file, allEvents]);

  // Sort locations by duration (descending)
  const sortedLocations = useMemo(() => {
    return [...locationDetails.locations]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 30);
  }, [locationDetails.locations]);

  return (
    <div className="card slow-locations-panel">
      {/* Header - Simplified */}
      <div className="panel-header simple">
        <div className="panel-file-path">
          <span className="panel-icon">{getFileIcon(file.shortPath)}</span>
          <span className="file-path-text">{file.shortPath}</span>
        </div>
        <button
          className="close-button simple"
          onClick={onClose}
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      {/* Locations List */}
      <div className="locations-list">
        {sortedLocations.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No position data available for this file.</p>
            <span className="empty-hint">
              Type checking events may not have position info.
            </span>
          </div>
        ) : (
          sortedLocations.map((loc, index) => (
            <LocationCard
              key={`${loc.pos}:${loc.end}:${index}`}
              location={loc}
              isExpanded={expandedIndex === index}
              onToggle={() =>
                setExpandedIndex(expandedIndex === index ? null : index)
              }
            />
          ))
        )}
      </div>

      {locationDetails.locations.length > 30 && (
        <div className="locations-footer">
          Showing top 30 of {locationDetails.locations.length} locations
        </div>
      )}
    </div>
  );
}

interface LocationCardProps {
  location: CodeLocation;
  isExpanded: boolean;
  onToggle: () => void;
}

function LocationCard({ location, isExpanded, onToggle }: LocationCardProps) {
  return (
    <div className={`location-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="location-header simple" onClick={onToggle}>
        <code className="line-badge">
          {location.lineNumber
            ? `Line ${location.lineNumber}`
            : `pos ${location.pos}`}
        </code>
        <span
          className="type-badge"
          style={{ background: getKindGradient(location.kindName) }}
          title={`SyntaxKind: ${location.kind}`}
        >
          {formatKindName(location.kindName)}
        </span>
        <span className="duration-badge">
          {formatDuration(location.duration)}
        </span>
      </div>

      {/* Expandable Code Section */}
      {isExpanded && location.codeSnippet && (
        <div className="code-section">
          <EnhancedCodeDisplay
            code={location.codeSnippet}
            lineNumber={location.lineNumber}
          />
        </div>
      )}
    </div>
  );
}

interface EnhancedCodeDisplayProps {
  code: string;
  lineNumber?: number;
}

function EnhancedCodeDisplay({ code, lineNumber }: EnhancedCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API might not be available
    }
  };

  const lines = code.split('\n');
  const startLine = lineNumber || 1;

  return (
    <div className="enhanced-code-display">
      <div className="code-header">
        <span className="code-language">TypeScript</span>
        <button
          className="copy-button"
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="14"
              height="14"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="14"
              height="14"
            >
              <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
              <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
            </svg>
          )}
        </button>
      </div>
      <div className="code-content">
        <div className="line-numbers">
          {lines.map((_, i) => (
            <span key={i} className="line-number">
              {startLine + i}
            </span>
          ))}
        </div>
        <pre className="code-text">
          <code ref={codeRef} className="language-tsx">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
