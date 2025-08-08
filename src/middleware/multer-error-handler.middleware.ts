import { RequestHandler } from 'express';

const multerErrorHandler =
  (upload: RequestHandler): RequestHandler =>
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        return next(err); // Pass multer errors to global error handler
      }
      next();
    });
  };

export default multerErrorHandler;
