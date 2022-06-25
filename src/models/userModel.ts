import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
interface IUser {
  name: string;
  photo?: string;
  email: string;
  role: 'user' | 'guide' | 'lead-guide' | 'admin';
  password: string;
  confirmPassword?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  active: boolean;
}
export interface IUserDoc extends IUser, Document {
  isCorrectPassword: (
    this: IUserDoc,
    candidatePass: string,
    hashedPass: string
  ) => Promise<boolean>;
  isUserChangedPassAfterJWTWasIssued: (
    this: IUserDoc,
    JWTTimestamp: number
  ) => boolean;
  createPasswordResetToken: (this: IUserDoc) => string;
}
const userSchema = new mongoose.Schema<IUserDoc>({
  name: {
    type: String,
    required: [true, 'a user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'a user must have an email'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'email is not valid'],
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'a user must have a password'],
    minlength: [8, 'a user password length is less than 8'],
    select: false,
    validate: {
      validator: validator.isStrongPassword,
      message:
        'a user password is at least have lowercase, uppercase, number, and symbol',
    },
  },
  confirmPassword: {
    type: String,
    required: [true, 'a user must have a confirmPassword'],
    validate: {
      validator: function (this: IUser, val: string) {
        return this.password === val;
      },
      message: 'a user password and confirmPassword are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
    return;
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    next();
    return;
  }
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.pre<mongoose.Query<any, any, {}, any>>(/^find/, function (next) {
  this.find({ active: true });
  next();
});

userSchema.methods['isCorrectPassword'] = async function (
  this: IUserDoc,
  candidatePass: string,
  hashedPass: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePass, hashedPass);
};

userSchema.methods['isUserChangedPassAfterJWTWasIssued'] = function (
  this: IUserDoc,
  JWTTimestamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};
userSchema.methods['createPasswordResetToken'] = function (this: IUserDoc) {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};
const User = mongoose.model<IUserDoc>('User', userSchema);
export default User;
