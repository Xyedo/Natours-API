import express from 'express';
import {
  getMonthlyPlan,
  getTourStats,
  aliasTopTour,
  createNewTour,
  deleteTourById,
  getAllTour,
  getTourById,
  patchTourById,
} from '@/controllers/tours';
import { Protected} from '@/controllers/auth';

const tourRouter = express.Router();
tourRouter.route('/').get(Protected.protect, getAllTour).post(createNewTour);
tourRouter.route('/top-5-cheap').get(aliasTopTour, getAllTour);
tourRouter.route('/tour-stats').get(getTourStats);
tourRouter.route('/monthly-plan/:year').get(getMonthlyPlan);
// tourRouter.param('id', checkID);
tourRouter
  .route('/:id')
  .get(getTourById)
  .patch(patchTourById)
  .delete(Protected.protect, Protected.restrictTo('admin', 'lead-guide'), deleteTourById);

export default tourRouter;
