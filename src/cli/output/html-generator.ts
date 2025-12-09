import { writeFile, readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { ReportData } from '../../parser/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Generate standalone HTML report with embedded data
 */
export async function generateHtmlReport(
  data: ReportData,
  outputPath: string
): Promise<void> {
  const templatePath = join(__dirname, '..', '..', 'web', 'index.html');

  let template: string;
  try {
    template = await readFile(templatePath, 'utf-8');
  } catch {
    throw new Error(
      `HTML template not found at ${templatePath}. Run "npm run build" first to build the visualization.`
    );
  }

  // Inject the data
  const html = injectData(template, data);

  // Write to output
  await writeFile(outputPath, html, 'utf-8');
}

/**
 * Inject report data into HTML template
 */
function injectData(html: string, data: ReportData): string {
  // Look for the data placeholder and replace it
  const dataPlaceholder = /<script id="__REPORT_DATA__"[^>]*>.*?<\/script>/s;

  if (dataPlaceholder.test(html)) {
    return html.replace(
      dataPlaceholder,
      `<script id="__REPORT_DATA__" type="application/json">${JSON.stringify(data)}</script>`
    );
  }

  // If no placeholder found, inject before closing body tag
  const dataScript = `<script id="__REPORT_DATA__" type="application/json">${JSON.stringify(data)}</script>`;
  return html.replace('</body>', `${dataScript}\n</body>`);
}
