import nodemailer from "nodemailer";

export async function sendMail({ to, cc = [], subject, html }) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS?.replace(/\s/g, ""), // quita espacios
    },
  });

  await transporter.verify();
  console.log("SMTP conectado correctamente");

  const info = await transporter.sendMail({
    from: `"Sistema DGCI" <${process.env.SMTP_USER}>`,
    to,
    cc,
    subject,
    html,
  });

  console.log("Correo enviado:", info.messageId);
  console.log("Respuesta SMTP:", info.response);

  return info;
}