import { ObjectId, Query, Document } from 'mongoose';
type IQuery<T> = Query<
  (Document<unknown, any, T> &
    T & {
      _id: ObjectId;
    })[],
  Document<unknown, any, T> &
    T & {
      _id: ObjectId;
    },
  {},
  T
>;
type GenericObject = {
  page?: String;
  sort?: String;
  limit?: String;
  fields?: String;
  [key: string]: any;
};
export default class APIFeatures<T, K extends GenericObject> {
  private _queryString: K;
  public query: IQuery<T>;
  constructor(query: IQuery<T>, queryString: K) {
    this._queryString = queryString;
    this.query = query;
  }
  filter(): APIFeatures<T, K> {
    const queryObj = { ...this._queryString };
    const excludedField = ['page', 'sort', 'limit', 'fields'] as const;
    excludedField.forEach((el) => {
      if (queryObj.hasOwnProperty(el)) {
        delete queryObj[el];
      }
    });
    //AdvancedFiltering
    const cleanQueryObj = JSON.parse(
      JSON.stringify(queryObj).replace(
        /\b(gte|gt|lte|lt)\b/g,
        (match) => `$${match}`
      )
    );
    this.query = this.query.find(cleanQueryObj);
    return this;
  }
  sort(): APIFeatures<T, K> {
    if (this._queryString.sort) {
      const sortBy = this._queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      return this;
    }
    this.query = this.query.sort('-createdAt');
    return this;
  }
  limitFields(): APIFeatures<T, K> {
    if (this._queryString.fields) {
      const fields = this._queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
      return this;
    }
    this.query = this.query.select('-__v');
    return this;
  }
  paginate(): APIFeatures<T, K> {
    let limit = 100;
    if (this._queryString.limit) {
      limit = Number(this._queryString.limit);
    }
    if (this._queryString.page) {
      const skip = (Number(this._queryString.page) - 1) * limit;
      this.query = this.query.skip(skip).limit(limit);
      return this;
    }
    this.query = this.query.limit(limit);
    return this;
  }
}
