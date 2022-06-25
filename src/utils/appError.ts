export default class AppError extends Error {
  status: string;
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
