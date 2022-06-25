import mongoose from 'mongoose';
import slugify from 'slugify';
// import validator from 'validator';
export interface ITour {
  name: string;
  duration: Number;
  maxGroupSize: Number;
  difficulty: 'easy' | 'medium' | 'difficult';
  rating?: Number;
  ratingAverage?: Number;
  ratingsQuantity?: Number;
  price: Number;
  priceDiscount?: Number;
  summary: String;
  description?: String;
  imageCover: String;
  images: String[];
  createdAt: Date;
  startDates: Date[];
  durationWeeks: Number;
  slug: String;
  secretTour?: Boolean;
}

const tourSchema = new mongoose.Schema<ITour>(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 character'],
      minlength: [5, 'A tour name must have more or equal than 5 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain character'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a maxGroupSize'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulty must either:easy, medium, difficult',
      },
    },
    rating: {
      type: Number,
      default: 3,
      min: [0, 'Rating must be above 0.0'],
      max: [5, 'Rating must be below 5.0'],
    },

    ratingAverage: {
      type: Number,
      default: 2.7,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, ' A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (this: ITour, val: number) {
          //this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'priceDiscount ({VALUE}) must not be lower than price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      // select:false
    },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual('durationWeeks').get(function () {
  return (this.duration as number) / 7;
});
//Document MiddleWare
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//Query Middleware
tourSchema.pre<mongoose.Query<any, any, {}, any>>(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

// tourSchema.post<mongoose.Query<any, any, {}, any>>(/^find/, function (doc,next) {

//   next();
// });

//Agregation MiddleWare
tourSchema.pre<mongoose.Aggregate<any>>('aggregate', function (next) {
  (this.pipeline() as any).unshift({
    $match: {
      secretTour: { $ne: true },
    },
  });
  next();
});

const Tour = mongoose.model<ITour>('Tour', tourSchema);

export default Tour;
