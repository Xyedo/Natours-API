// const { tours, writeNewTours } = require('../model');
import { NextFunction, Request, Response } from 'express';
import { APIFeatures, AppError, catchAsync } from '@/utils';
import Tour, { ITour } from '@/models/tourModel';

interface ReqParams {
  id: String;
}
type ReqBody = Partial<ITour>;

type ITourValString = Partial<Record<keyof ITour, string>>;

interface SpecialQuery {
  gte?: String;
  gt?: string;
  lt?: string;
  lte?: string;
}
type sortMethod = 'duration' | 'price' | 'rating' | 'createdAt';
interface ReqQuery
  extends Omit<ITourValString, 'duration' | 'price' | 'rating'> {
  page?: String;
  sort?: sortMethod | string;
  limit?: String;
  fields?: keyof ITour | string;
  duration?: SpecialQuery | string;
  price?: SpecialQuery | string;
  rating?: SpecialQuery | string;
}

export const aliasTopTour = async (
  req: Request<unknown, unknown, unknown, ReqQuery>,
  _res: Response,
  next: NextFunction
) => {
  req.query = {
    limit: '5',
    sort: '-ratingsAverage,price',
    fields: 'name,price,ratingsAverage,summary,difficulty',
  };
  next();
};

export const getAllTour = catchAsync(
  async (req: Request<unknown, unknown, unknown, ReqQuery>, res, _next) => {
    const feature = new APIFeatures<ITour, ReqQuery>(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tours = await feature.query;

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  }
);
// const checkCreateBody = (req, res, next) => {
//   const { name, price } = req.body;
//   if (name === undefined || price === undefined) {
//     res.status(400).json({
//       status: 'bad request',
//       message: 'missing name or price',
//     });
//     return;
//   }
//   next();
// };
export const createNewTour = catchAsync(async (req, res, _next) => {
  // const newTour = new Tour({
  //   ...req.body,
  // });
  // newTour.save();
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

export const getTourById = catchAsync(
  async (req: Request<ReqParams>, res, next) => {
    const findedTour = await Tour.findById(req.params.id);
    if (!findedTour) {
      next(new AppError(`no tour found with ID:${req.params.id}`, 404));
      return;
    }
    res.status(200).json({
      status: 'success',
      data: {
        tour: findedTour,
      },
    });
  }
);

export const patchTourById = catchAsync(
  async (req: Request<ReqParams, ReqBody>, res, next) => {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedTour) {
      next(new AppError(`no tour found with ID:${req.params.id}`, 404));
      return;
    }
    res.status(200).json({
      status: 'success',
      data: {
        tour: updatedTour,
      },
    });
  }
);
export const deleteTourById = catchAsync(
  async (req: Request<ReqParams>, res, next) => {
    const deletedTour = await Tour.findByIdAndDelete(req.params.id);

    if (!deletedTour) {
      next(new AppError(`no tour found with ID:${req.params.id}`, 404));
      return;
    }
    res.status(204).json({
      status: 'success',
      data: {
        tour: null,
      },
    });
  }
);
export const getTourStats = catchAsync(async (_req, res, _next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingAverage: { $gte: 2.0 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});
interface GetMonthlyPlanParam {
  year: string;
}
export const getMonthlyPlan = catchAsync(
  async (req: Request<GetMonthlyPlanParam>, res, _next) => {
    const year = Number(req.params.year) || new Date().getFullYear();
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      { $addFields: { month: '$_id' } },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: {
          numTourStarts: -1,
        },
      },
      { $limit: 12 },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  }
);
