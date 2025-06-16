type ErrorMiddlewareDetails = string | object | object[];

interface ErrorMiddlewareResponse {
  success: boolean;
  message: string;
  details?: ErrorMiddlewareDetails;
  stack?: string;
  path?: string;
  method?: string;
}
