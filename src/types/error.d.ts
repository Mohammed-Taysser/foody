import { ZodIssue } from 'zod';

type ErrorMiddlewareDetails = string | ZodIssue[];

interface ErrorMiddlewareResponse {
  success: boolean;
  message: string;
  details?: ErrorMiddlewareDetails;
  stack?: string;
}
