import ExcelJS from 'exceljs';
import { Response } from 'express';

interface SuccessResponseParams<T> {
  response: Response;
  statusCode?: number;
  message?: string;
  data?: T;
}

interface PaginatedResponseParams<T> {
  response: Response;
  statusCode?: number;
  message?: string;
  data: T[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function sendSuccessResponse<T>(params: SuccessResponseParams<T>) {
  const { response, statusCode = 200, message, data } = params;

  return response.status(statusCode).json({
    success: true,
    message,
    data: {
      data,
    },
  });
}

function sendPaginatedResponse<T>(params: PaginatedResponseParams<T>) {
  const { response, statusCode = 200, message, data, metadata } = params;

  return response.status(statusCode).json({
    success: true,
    message,
    data: {
      data,
      metadata,
    },
  });
}

function sendPDFResponse(
  response: Response,
  pdfBuffer: Uint8Array<ArrayBufferLike>,
  filename: string
) {
  response.attachment(`${filename}.pdf`);
  response.type('application/pdf');
  response.setHeader('Content-Length', pdfBuffer.length.toString());

  response.send(pdfBuffer);
}

function sendCSVResponse(response: Response, csvString: string, filename: string) {
  response.attachment(`${filename}.csv`);
  response.type('text/csv');
  response.setHeader('Content-Length', Buffer.byteLength(csvString).toString());

  response.send(csvString);
}

function sendExcelResponse(response: Response, excelBuffer: ExcelJS.Buffer, filename: string) {
  response.attachment(`${filename}.xlsx`);
  response.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  response.setHeader('Content-Length', Buffer.byteLength(excelBuffer).toString());

  response.send(excelBuffer);
}

export {
  sendCSVResponse,
  sendExcelResponse,
  sendPaginatedResponse,
  sendPDFResponse,
  sendSuccessResponse,
};
