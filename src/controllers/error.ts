import { AppError } from '@/utils';
import express from 'express';
import mongoose from 'mongoose';

interface GlobalError extends Error {
  statusCode: number;
  status: string;
  kind: any;
  value: any;
  path: string;
  stringValue: string;
}

const globalErrorHandler = (
  err: GlobalError,
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env['NODE_ENV'] === 'DEVELOPMENT') {
    sendErrorDev(err, res);
  } else if (process.env['NODE_ENV'] === 'PRODUCTION') {
    let prodError = Object.assign(err);
    if (prodError.name === 'CastError') {
      (prodError as AppError) = handleCastErrorDB(
        prodError as mongoose.CastError
      );
    } else if (prodError.code === 11000) {
      (prodError as AppError) = handleDuplicateFieldsDB(prodError);
    } else if (prodError.name === 'ValidationError') {
      (prodError as AppError) = handleValidationError(prodError);
    } else if (prodError.name === 'JsonWebTokenError') {
      (prodError as AppError) = handleJWTError(prodError);
    } else if (prodError.name === 'TokenExpiredError') {
      (prodError as AppError) = handleJWTExpired(prodError);
    } else if (prodError.name === 'NotBeforeError') {
      (prodError as AppError) = handleInvalidReqTime(prodError);
    }
    sendErrorProd(prodError, res);
  }
  next();
};

const sendErrorDev = (err: AppError, res: express.Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err: GlobalError | AppError, res: express.Response) => {
  if (!(err instanceof AppError)) {
    console.log('ERROR', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
    return;
  }
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
const handleInvalidReqTime = (_err: Error) => {
  return new AppError(
    'invalid request time, please use UTC time for request header',
    401
  );
};
const handleJWTError = (_err: Error) => {
  return new AppError('invalid web token, please login again', 401);
};
const handleCastErrorDB = (err: mongoose.CastError): AppError => {
  const message = `Invalid ${err.path}:${err.value}`;
  return new AppError(message, 400);
};
interface DuplicateField extends Error {
  code?: number | string;
  keyValue: {
    [key: string]: any;
  };
}
const handleJWTExpired = (_err: Error) => {
  return new AppError('token has expired, please login again', 401);
};
const handleDuplicateFieldsDB = (err: DuplicateField): AppError => {
  const message = `Duplicate field value: ${Object.values(
    err.keyValue
  )} in key: ${Object.keys(err.keyValue)} Please use another value`;
  return new AppError(message, 400);
};
interface ValidationError extends Error {
  name: 'ValidationError';
  message: string;
  errors: {
    [key: string]: object;
  };
}
const handleValidationError = (err: ValidationError): AppError => {
  const message = `Please correct the following Error: ${err.message}`;
  return new AppError(message, 400);
};

export default globalErrorHandler;
