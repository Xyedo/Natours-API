import { NextFunction, Request, Response } from 'express';
import { APIFeatures, AppError, catchAsync } from '@/utils';
import User, { IUserDoc } from '@/models/userModel';
import { Protected } from './auth';

export const getAllUsers = catchAsync(async (_req, res, _next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

export const createNewUser = (_req: Request, res: Response) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'route is not yet implemented',
  });
};
export namespace UpdateMe {
  type ReqBody = Partial<IUserDoc>;
  export const updateMe = catchAsync(
    async (req: Protected.URequest<unknown, unknown, ReqBody>, res, next) => {
      if (!req.user) {
        next(new AppError('the user is not log in', 403));
        return;
      }
      if (req.body.password || req.body.confirmPassword) {
        next(new AppError('this route is not for update password', 400));
        return;
      }
      const user = req.user;
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.photo = req.body.photo || user.photo;
      await user.save({ validateModifiedOnly: true });

      (user.password as string | undefined) = undefined;
      res.status(200).json({
        status: 'success',
        data: {
          user,
        },
      });
    }
  );
}
export const deleteMe = catchAsync(
  async (req: Protected.URequest, res, next) => {
    if (!req.user) {
      next(new AppError('the user is not log in', 403));
      return;
    }
    req.user.active = false;
    await req.user.save({ validateModifiedOnly: true });
    res.status(204).json({
      status: 'success',
      data: {
        user: null,
      },
    });
  }
);
export const getUserById = (_req: Request, res: Response) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'route is not yet implemented',
  });
};

export const patchUserById = (_req: Request, res: Response) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'route is not yet implemented',
  });
};

export const deleteUserById = (_req: Request, res: Response) => {
  res.status(500).json({
    status: 'internal server error',
    message: 'route is not yet implemented',
  });
};
