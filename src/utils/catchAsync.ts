import { NextFunction, Request, Response } from 'express';

type CbRetPromise<P, ResBody, ReqBody, ReqQuery> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response,
  next: NextFunction
) => Promise<void>;
type returnedFn<P, ResBody, ReqBody, ReqQuery> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response,
  next: NextFunction
) => void;
interface Dictionary {
  [key: string]: string;
}
type Query = Partial<Dictionary>;
//Request<P = core.ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = qs.ParsedQs
function catchAsync<
  P = Dictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Query
>(
  fn: CbRetPromise<P, ResBody, ReqBody, ReqQuery>
): returnedFn<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => fn(req, res, next).catch(next);
}

export default catchAsync;
