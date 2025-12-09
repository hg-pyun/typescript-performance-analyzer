import { useState, useEffect, useMemo } from 'react';
import type { ReportData, FileEvents } from '../parser/types';
import { HotspotTable } from './components/Summary/HotspotTable';
import { SlowLocationsPanel } from './components/Summary/SlowLocationsPanel';
import { formatDuration, formatNumber } from './utils/formatters';

type Theme = 'light' | 'dark';

interface AppProps {
  data: ReportData | null;
}

// Sun icon for light mode
const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

// Moon icon for dark mode
const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export default function App({ data }: AppProps) {
  const [selectedFile, setSelectedFile] = useState<FileEvents | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem(
      'sidebar-collapsed',
      JSON.stringify(isSidebarCollapsed)
    );
  }, [isSidebarCollapsed]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Memoize top files to avoid creating new array on every render
  // Must be called before any conditional returns to follow Rules of Hooks
  const topFiles = useMemo(
    () => data?.timeline.files.slice(0, 50) ?? [],
    [data?.timeline.files]
  );

  if (!data) {
    return (
      <div className="error-state">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <h1>Report data not available</h1>
          <p>
            The report data could not be loaded. Please regenerate the report.
          </p>
        </div>
      </div>
    );
  }

  const { metrics, timeline, metadata } = data;
  const generatedDate = new Date(metadata.generatedAt);

  return (
    <div className="app">
      {/* Header - Logo + Theme Toggle */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">📊</span>
            <div className="logo-text">
              <h1>TypeScript Performance</h1>
              <span className="logo-subtitle">Compilation Report</span>
            </div>
          </div>
          <div className="header-right">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Sub-header - Stats Left, Date Right */}
      <div className="sub-header">
        <div className="sub-header-content">
          <div className="sub-header-stats">
            <div className="sub-header-stat">
              <span className="sub-header-stat-value">
                {formatDuration(metrics.totalDuration)}
              </span>
              <span className="sub-header-stat-label">Total</span>
            </div>
            <div className="sub-header-stat">
              <span className="sub-header-stat-value">
                {formatNumber(metrics.totalFiles)}
              </span>
              <span className="sub-header-stat-label">Files</span>
            </div>
            <div className="sub-header-stat">
              <span className="sub-header-stat-value">
                {formatNumber(metrics.totalEvents)}
              </span>
              <span className="sub-header-stat-label">Events</span>
            </div>
          </div>
          <div className="sub-header-meta">
            <span className="meta-date">
              Generated: {generatedDate.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* App Body - Sidebar + Main */}
      <div className="app-body">
        {/* Left Sidebar */}
        <aside
          className={`sidebar-container ${isSidebarCollapsed ? 'collapsed' : ''}`}
        >
          <button
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={
              isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
            aria-expanded={!isSidebarCollapsed}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {isSidebarCollapsed ? (
            <div className="sidebar-collapsed-indicator">
              <span className="label">Slowest Files</span>
            </div>
          ) : (
            <div className="sidebar-content">
              <HotspotTable
                files={topFiles}
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
              />
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="main-content-area">
          {/* Details Section - SlowLocationsPanel */}
          {selectedFile && (
            <section className="details-section">
              <SlowLocationsPanel
                file={selectedFile}
                allEvents={timeline.events}
                onClose={() => setSelectedFile(null)}
              />
            </section>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <span className="footer-brand">
            TypeScript Performance Visualizer
          </span>
          <span className="footer-separator">•</span>
          <span className="footer-version">v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}
