import fs from 'fs';
import path from 'path';

import dayjsTZ from './dayjs.utils';

const fontPath = path.resolve(__dirname, '../../public/DINNextLTArabic.ttf');
const fontData = fs.readFileSync(fontPath).toString('base64');
const fontUrl = `data:font/truetype;base64,${fontData}`;

function generatePDFTemplate<T>(columns: string[], data: T[], title = 'Report'): string {
  // Header row
  const headerRow = columns.map((col) => `<th>${col}</th>`).join('');

  // Data rows
  const rows =
    data.length > 0
      ? data
          .map((row) => {
            return `<tr>${columns
              .map(
                (col) => `<td>
            <div>${(row as Record<string, unknown>)[col] || ''}</div>
          </td>`
              )
              .join('')}
        </tr>`;
          })
          .join('')
      : `<tr><td colspan="${columns.length}" style="text-align: center; font-weight: bold; padding: 10px;">No data available</td></tr>`;

  return `
    <html>
    <head>
      <style>
        @font-face {
          font-family: "DINNextLTArabic";
          src: url("${fontUrl}") format("truetype");
        }

        @page {
          margin: 5mm;
        }
          
        body {
          font-size: 8px;
          font-family: "DINNextLTArabic", sans-serif;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th,
        td {
          border: 1px solid #ccc;
          padding: 5px;
          text-align: left;
        }

        th {
          background-color: #f5f5f5;
          font-size: 8px;
        }

        tr:nth-child(even) {
          background-color: #f9f9f9;
        }

        td div {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
          font-size: 6px;
        }

        td {
          word-break: break-all;
        }

      </style>
    </head>
    <body>
      <div class="meta">
        Title: ${title}<br />
        Generated on: ${dayjsTZ().format('YYYY-MM-DD HH:mm:ss')}<br />
        Total rows: ${data.length}
      </div>
      <table>
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>
  `;
}

export { generatePDFTemplate };
