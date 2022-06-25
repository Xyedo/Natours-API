import path from 'path';
import dotenv from 'dotenv';
export default dotenv.config({
  path: path.resolve(__dirname, '../config.env'),
});
process.on('uncaughtException', (error) => {
  console.error({ error });
  process.exit(1);
});
