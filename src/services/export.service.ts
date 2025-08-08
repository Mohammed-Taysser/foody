import ExcelJS from 'exceljs';
import { Parser as CSVParser } from 'json2csv';
import puppeteer from 'puppeteer';

import { generatePDFTemplate } from '@/utils/html-template.utils';
import { ConflictError } from '@/utils/errors.utils';

interface PDFOptions {
  columnsToExclude?: string[];
  title?: string;
}

class ExportService {
  toCSV<T>(data: Array<T>) {
    const actualFields = data.length > 0 ? undefined : ['#'];

    const parser = new CSVParser<T>({
      fields: actualFields,
    });

    return parser.parse(data);
  }

  async toExcel<T>(data: Array<T>) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Export');

    if (data.length > 0) {
      worksheet.columns = Object.keys(data[0] as object).map((key) => ({
        header: key,
        key: key,
      }));

      worksheet.addRows(data);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async toPDF<T>(data: Array<T>, options: PDFOptions = {}) {
    const { columnsToExclude = [], title = 'Exported Data' } = options;

    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      const columns =
        data.length > 0
          ? Object.keys(data[0] as object).filter((key) => !columnsToExclude.includes(key))
          : []; // fallback for empty data

      const htmlTemplate = generatePDFTemplate(columns, data, title);

      await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw new ConflictError('Failed to generate PDF. Please try again later.' + error);
    }
  }
}

const exportService = new ExportService();
export default exportService;
