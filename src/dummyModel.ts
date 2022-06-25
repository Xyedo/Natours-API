import { Response } from 'express';
import fs from 'fs';

export const tours = JSON.parse(
  fs
    .readFileSync(
      `C:/Users/ACER/Projects/JS-dev/NodeJS-Bootcamp/4-natours/starter/dev-data/data/tours.json`
    )
    .toString()
);
export const users = JSON.parse(
  fs
    .readFileSync(
      `C:/Users/ACER/Projects/JS-dev/NodeJS-Bootcamp/4-natours/starter/dev-data/data/users.json`
    )
    .toString()
);
export const writeNewTours = (res: Response) => {
  fs.writeFile(
    `C:/Users/ACER/Projects/JS-dev/NodeJS-Bootcamp/4-natours/starter/dev-data/data/tours.json`,
    JSON.stringify(tours),
    (err) => {
      if (err) {
        res.status(500).json({
          status: 'error',
          message: err.message,
        });
      }
    }
  );
};
