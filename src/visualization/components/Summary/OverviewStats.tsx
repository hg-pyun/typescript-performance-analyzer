import type { CompilationMetrics } from '../../../parser/types';
import { formatDuration, formatEventCount } from '../../utils/formatters';

interface OverviewStatsProps {
  metrics: CompilationMetrics;
}

export function OverviewStats({ metrics }: OverviewStatsProps) {
  return (
    <div className="card overview-stats-card">
      <div className="card-header">
        <h2 className="card-title">Overview</h2>
      </div>
      <div className="stats-grid">
        {/* Total Time - Hero stat */}
        <div className="stat-card hero">
          <div className="stat-icon-container">
            <span>⏱️</span>
          </div>
          <div className="stat-content">
            <div className="stat-value gradient-text">
              {formatDuration(metrics.totalDuration)}
            </div>
            <div className="stat-label">Total Compilation Time</div>
          </div>
        </div>

        {/* Files stat */}
        <div className="stat-card">
          <div className="stat-icon-container files">
            <span>📁</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {metrics.totalFiles.toLocaleString()}
            </div>
            <div className="stat-label">Files Processed</div>
          </div>
        </div>

        {/* Events stat */}
        <div className="stat-card">
          <div className="stat-icon-container events">
            <span>⚡</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {formatEventCount(metrics.totalEvents)}
            </div>
            <div className="stat-label">Total Events</div>
          </div>
        </div>
      </div>
    </div>
  );
}
