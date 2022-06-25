import {
  SignIn,
  Signup,
  Protected,
  ForgotPassword,
  ResetPassword,
  UpdatePassword,
} from '@/controllers/auth';
import express from 'express';
import {
  createNewUser,
  getAllUsers,
  deleteUserById,
  getUserById,
  patchUserById,
  UpdateMe,
  deleteMe,
} from '@/controllers/users';
const userRouter = express.Router();

userRouter.post('/signup', Signup.signup);
userRouter.post('/signin', SignIn.signin);
userRouter.post('/forgotPassword', ForgotPassword.forgotPassword);
userRouter.patch('/resetPassword/:token&:email', ResetPassword.resetPassword);
userRouter.post('/updateMyPassword', Protected.protect, UpdatePassword.updatePassword);
userRouter.patch("/updateMe", Protected.protect, UpdateMe.updateMe);
userRouter.delete("/deleteMe", Protected.protect, deleteMe);
userRouter.route('/').get(Protected.protect, getAllUsers).post(createNewUser);
userRouter
  .route('/:id')
  .get(getUserById)
  .patch(patchUserById)
  .delete(deleteUserById);

export default userRouter;
