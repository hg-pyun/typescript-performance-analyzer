import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/main.css';
import type { ReportData } from '../parser/types';

// Get report data from injected script
function getReportData(): ReportData | null {
  const dataEl = document.getElementById('__REPORT_DATA__');
  if (!dataEl?.textContent) return null;

  try {
    const data = JSON.parse(dataEl.textContent);
    if (data.placeholder) return null;
    return data as ReportData;
  } catch {
    return null;
  }
}

async function loadData(): Promise<ReportData | null> {
  // Try embedded data first
  const embeddedData = getReportData();
  if (embeddedData) return embeddedData;

  // In dev mode, try loading sample data
  if (import.meta.env.DEV) {
    try {
      const sampleData = await import('./sample-data.json');
      return sampleData.default as ReportData;
    } catch {
      return null;
    }
  }

  return null;
}

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);

  loadData().then((data) => {
    root.render(
      <React.StrictMode>
        <App data={data} />
      </React.StrictMode>
    );
  });
}
