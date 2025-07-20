// src/services/emailService.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // ou outro
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendOrderNotification(to, subject, html) {
  await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
}
