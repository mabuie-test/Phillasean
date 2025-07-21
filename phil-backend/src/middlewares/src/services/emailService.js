import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
export function sendOrderNotification(to, subject, html, attachmentPath) {
  const mail = { from: process.env.SMTP_FROM, to, subject, html };
  if (attachmentPath) {
    mail.attachments = [{ path: attachmentPath }];
  }
  return transporter.sendMail(mail);
}
