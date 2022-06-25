import './config';
import mongoose from 'mongoose';
import app from '@/app';

const uri =
  process.env['DB'] &&
  process.env['DB_PASSWORD'] &&
  process.env['DB_USERNAME'] &&
  process.env['DB']
    .replace('<PASSWORD>', process.env['DB_PASSWORD'])
    .replace('<USERNAME>', process.env['DB_USERNAME']);
if (process.env['NODE_ENV'] !== 'TEST') {
  uri &&
    mongoose.connect(uri).then(() => console.log('DB connection successfull'));
}

const port = 8000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (error) => {
  console.error({ error });
  server.close(() => {
    process.exit(1);
  });
});
export default server;
