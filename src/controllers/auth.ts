import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUserDoc } from '@/models/userModel';
import { AppError, catchAsync, sendEmail } from '@/utils';
import { Types, Document } from 'mongoose';
import { promisify } from 'util';
import validator from 'validator';
import crypto from 'crypto';
export namespace Signup {
  type ReqBody = Partial<IUserDoc>;
  export const signup = catchAsync(
    async (req: Request<unknown, unknown, ReqBody>, res, next) => {
      const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        photo: req.body.photo,
      });
      createSendToken(newUser as TUser, res, next);
    }
  );
}
export namespace SignIn {
  interface ReqBody {
    email?: string;
    password?: string;
  }

  export const signin = catchAsync(
    async (req: Request<unknown, unknown, ReqBody>, res, next) => {
      if (!req.body.email?.trim() || !req.body.password) {
        next(new AppError('invalid Req Body', 400));
        return;
      }

      const user = await User.findOne({ email: req.body.email }).select(
        '+password'
      );
      if (!user) {
        next(new AppError('the password or email is invalid', 400));
        return;
      }

      if (!(await user.isCorrectPassword(req.body.password, user.password))) {
        next(new AppError('the password or email is invalid', 400));
        return;
      }
      createSendToken(user, res, next);
    }
  );
}

export namespace Protected {
  interface Paylod extends jwt.JwtPayload {
    id: string;
  }
  // interface Request<P = core.ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = qs.ParsedQs, Locals extends Record<string, any>
  export interface URequest<
    P = { [key: string]: string | undefined },
    ResBody = any,
    ReqBody = any,
    ReqQuery = any
  > extends Request<P, ResBody, ReqBody, ReqQuery> {
    user?: TUser;
  }
  export const protect = catchAsync(async (req: URequest, _res, next) => {
    //1. Check if header has auth and Bearer Token
    if (!req.headers.authorization) {
      next(
        new AppError('request header must have a authorization params', 401)
      );
      return;
    }
    if (!req.headers.authorization.startsWith('Bearer ')) {
      next(new AppError('request header auth have no bearer value', 401));
      return;
    }

    const token = req.headers.authorization.split(' ')[1];
    //2. Verify Header if Bearer token is actually a real token
    const decodedToken =
      process.env['JWT_SECRET'] &&
      ((await promisify(jwt.verify)(token, process.env['JWT_SECRET'])) as
        | jwt.JwtPayload
        | string);
    if (typeof decodedToken !== 'object') {
      next(new AppError('false authorization header', 401));
      return;
    }
    //3 check if user is existed and not removed
    const user = await User.findById((decodedToken as Paylod).id).select(
      '+password'
    );
    if (!user) {
      next(new AppError('the user is no longer exist', 401));
      return;
    }
    //4 check if user is changed Password after token was issued
    if (
      decodedToken.iat &&
      user.isUserChangedPassAfterJWTWasIssued(decodedToken.iat)
    ) {
      next(
        new AppError(
          'user recently changed Password or JWT exp is not valid',
          401
        )
      );
      return;
    }
    req.user = user;
    //Grant Access to Protected Route
    next();
  });
  export const restrictTo = (...roles: IUserDoc['role'][]) => {
    return (req: URequest, _res: Response, next: NextFunction) => {
      if (req.user && !roles.includes(req.user.role)) {
        next(
          new AppError('you dont have permission to perform this action', 403)
        );
        return;
      }
      next();
    };
  };
}

export namespace ForgotPassword {
  interface ReqBody {
    email?: string;
  }
  export const forgotPassword = catchAsync(
    async (
      req: Request<unknown, unknown, ReqBody>,
      res: Response,
      next: NextFunction
    ) => {
      if (!req.body.email) {
        next(new AppError('need email properties', 400));
        return;
      }
      if (!validator.isEmail(req.body.email)) {
        next(new AppError('this is not a valid email', 400));
      }
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        next(new AppError('no account match with that email', 404));
        return;
      }
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      const resetURL = `${req.protocol}://${req.get(
        'host'
      )}/api/v1/users/resetPassword/${resetToken}&${user.email}`;
      const message = `Forgot your password? Submit a PATCH request with
       your new password and passwordComfirm to ${resetURL}\nIf 
       you didn't forget your password, simply ignore this email`;
      try {
        await sendEmail({
          email: user.email,
          subject: 'Your password reset token (valid for 10min)',
          message,
        });
        res.status(200).json({
          status: 'success',
          messsage: 'token sent to email!',
        });
      } catch (e) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        next(
          new AppError(
            'there was an error sending the email. Try again later!',
            500
          )
        );
      }
    }
  );
}
export namespace ResetPassword {
  interface ReqParams {
    token?: string;
    email?: string;
  }
  interface ReqBody {
    password?: string;
    confirmPassword?: string;
  }
  export const resetPassword = catchAsync(
    async (req: Request<ReqParams, unknown, ReqBody>, res, next) => {
      if (!req.params.token || !req.params.email?.trim()) {
        next(new AppError('req params is invalid', 400));
        return;
      }
      if (!req.body.password || !req.body.confirmPassword) {
        next(new AppError('req body is invalid', 400));
        return;
      }

      const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
      const user = await User.findOne({
        email: req.params.email,
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date(Date.now()) },
      });
      if (!user) {
        next(new AppError('token is invalid or has expired', 400));
        return;
      }
      user.password = req.body.password;
      user.confirmPassword = req.body.confirmPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      createSendToken(user, res, next);
    }
  );
}

export namespace UpdatePassword {
  interface ReqBody {
    currentPassword?: string;
    newPassword?: string;
    confirmNewPassword?: string;
  }
  export const updatePassword = catchAsync(
    async (req: Protected.URequest<unknown, unknown, ReqBody>, res, next) => {
      if (
        !req.body.currentPassword ||
        !req.body.newPassword ||
        !req.body.confirmNewPassword
      ) {
        next(new AppError('invalid Req body', 400));
        return;
      }
      if (!req.user) {
        next(new AppError('Must Login First', 400));
        return;
      }
      const user = req.user;

      if (
        !(await user.isCorrectPassword(req.body.currentPassword, user.password))
      ) {
        next(new AppError('The Password is not correct', 401));
        return;
      }

      user.password = req.body.newPassword;
      user.confirmPassword = req.body.confirmNewPassword;
      await user.save();
      createSendToken(user, res, next);
    }
  );
}

const signToken = (id: Types.ObjectId): string | null => {
  if (!process.env['JWT_SECRET']) {
    return null;
  }
  return jwt.sign({ id }, process.env['JWT_SECRET'], {
    expiresIn: process.env['JWT_EXPIRES_IN'],
  });
};

type TUser = Document<unknown, any, IUserDoc> &
  IUserDoc & {
    _id: Types.ObjectId;
  };
const createSendToken = (user: TUser, res: Response, next: NextFunction) => {
  const token = signToken(user._id);
  if (!token) {
    next(new AppError('JWT Token is failed initialized', 500));
    return;
  }
  (user.password as string | undefined) = undefined;

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
