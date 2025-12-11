import { useState } from 'react';
import type { PhaseInfo } from '../../../parser/types';
import { formatDuration } from '../../../shared/formatters';
import { PHASE_COLORS } from '../../../shared/constants';

interface PhaseBreakdownProps {
  phases: PhaseInfo;
}

export function PhaseBreakdown({ phases }: PhaseBreakdownProps) {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  const totalTime =
    phases.parse.totalTime +
    phases.bind.totalTime +
    phases.check.totalTime +
    phases.emit.totalTime;

  const phaseData = [
    { name: 'Parse', key: 'parse' as const, time: phases.parse.totalTime },
    { name: 'Bind', key: 'bind' as const, time: phases.bind.totalTime },
    { name: 'Check', key: 'check' as const, time: phases.check.totalTime },
    { name: 'Emit', key: 'emit' as const, time: phases.emit.totalTime },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Phase Breakdown</h2>
        <div className="legend">
          {phaseData.map((phase) => (
            <div
              key={phase.key}
              className={`legend-item ${hoveredPhase === phase.key ? 'active' : ''}`}
              onMouseEnter={() => setHoveredPhase(phase.key)}
              onMouseLeave={() => setHoveredPhase(null)}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="legend-color"
                style={{ backgroundColor: PHASE_COLORS[phase.key] }}
              />
              <span>{phase.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Combined horizontal bar */}
      <div className="combined-phase-bar">
        {phaseData.map((phase) => {
          const percentage = totalTime > 0 ? (phase.time / totalTime) * 100 : 0;
          return (
            <div
              key={phase.key}
              className={`combined-segment ${hoveredPhase === phase.key ? 'highlighted' : ''}`}
              style={{
                width: `${percentage}%`,
                backgroundColor: PHASE_COLORS[phase.key],
              }}
              onMouseEnter={() => setHoveredPhase(phase.key)}
              onMouseLeave={() => setHoveredPhase(null)}
            >
              {percentage > 12 && (
                <span className="segment-label">{phase.name}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed bars */}
      <div className="phase-bars">
        {phaseData.map((phase) => {
          const percentage = totalTime > 0 ? (phase.time / totalTime) * 100 : 0;
          const isHighlighted = hoveredPhase === phase.key;

          return (
            <div
              key={phase.key}
              className={`phase-bar-item ${isHighlighted ? 'highlighted' : ''}`}
              onMouseEnter={() => setHoveredPhase(phase.key)}
              onMouseLeave={() => setHoveredPhase(null)}
            >
              <div className="phase-label-section">
                <div
                  className="phase-indicator"
                  style={{ backgroundColor: PHASE_COLORS[phase.key] }}
                />
                <span className="phase-name">{phase.name}</span>
              </div>

              <div className="phase-bar-container">
                <div
                  className="phase-bar-fill"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: PHASE_COLORS[phase.key],
                  }}
                />
              </div>

              <div className="phase-value-section">
                <span className="phase-duration">
                  {formatDuration(phase.time)}
                </span>
                <span className="phase-percentage">
                  ({percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
