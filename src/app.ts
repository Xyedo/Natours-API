// import { NextFunction, Response, Request } from 'express';

import express from 'express';
import morgan from 'morgan';
import AppError from '@/utils/appError';
import { tourRouter, userRouter } from '@/routes';
import globalErrorHandler from '@/controllers/error';
console.log(process.env['NODE_ENV']);
const app = express();

if (process.env['NODE_ENV'] === 'DEVELOPMENT') {
  app.use(morgan('dev'));
}

app.use(express.json());

// app.use((_req: Request, _res: Response, next: NextFunction) => {
//   console.log('Hello from middleware');
//   next();
// });

// server.use((req:Request, res, next) => {
//   req.requestTime = new Date().toISOString();
//   next();
// });

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.all('*', (req, _res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on server`, 404));
});

app.use(globalErrorHandler);
export default app;
