import { Response } from 'express';

interface SendResponseParams<T> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
}

function sendResponse<T>({ res, statusCode = 200, message, data }: SendResponseParams<T>) {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export default sendResponse;
