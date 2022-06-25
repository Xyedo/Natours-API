import nodemailer from 'nodemailer';
interface Options {
  email: string;
  subject: string;
  message: string;
}
const sendEmail = async (options: Options) => {
  const transporter = nodemailer.createTransport({
    host: process.env['EMAIL_HOST']?.toString(),
    port: Number(process.env['EMAIL_PORT']) || 2525,
    auth: {
      user: process.env['EMAIL_USERNAME'],
      pass: process.env['EMAIL_PASSWORD'],
    },
  });
  const mailOptions = {
    from: 'Hafid Mahdi <hafid@mahdi.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
