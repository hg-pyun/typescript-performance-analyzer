interface TimelineControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  fileCount: number;
  totalFileCount: number;
}

export function TimelineControls({
  searchQuery,
  onSearchChange,
  zoomLevel,
  onZoomChange,
  fileCount,
  totalFileCount,
}: TimelineControlsProps) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoomLevel * 1.5, 10));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoomLevel / 1.5, 0.5));
  };

  const handleZoomReset = () => {
    onZoomChange(1);
  };

  return (
    <div className="timeline-controls">
      <input
        type="text"
        className="search-input"
        placeholder="Search files..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {fileCount === totalFileCount
          ? `${fileCount.toLocaleString()} files`
          : `${fileCount.toLocaleString()} / ${totalFileCount.toLocaleString()} files`}
      </div>

      <div style={{ flex: 1 }} />

      <div className="zoom-controls">
        <button className="zoom-btn" onClick={handleZoomOut} title="Zoom out">
          −
        </button>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            minWidth: '50px',
            textAlign: 'center',
          }}
        >
          {Math.round(zoomLevel * 100)}%
        </span>
        <button className="zoom-btn" onClick={handleZoomIn} title="Zoom in">
          +
        </button>
        <button
          className="zoom-btn"
          onClick={handleZoomReset}
          title="Reset zoom"
        >
          ⟲
        </button>
      </div>
    </div>
  );
}
