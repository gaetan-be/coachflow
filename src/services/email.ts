import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export async function sendReportEmail(
  coachEmail: string,
  coacheeName: string,
  reportBuffer: Buffer
): Promise<void> {
  if (!config.smtp.host) {
    console.log('SMTP not configured, skipping email send.');
    return;
  }

  await transporter.sendMail({
    from: config.smtp.from,
    to: coachEmail,
    subject: `Brenso — Rapport d'orientation : ${coacheeName}`,
    text: `Bonjour,\n\nLe rapport d'orientation pour ${coacheeName} est prêt.\nVous le trouverez en pièce jointe.\n\nBrenso`,
    attachments: [
      {
        filename: `Brenso_Rapport_${coacheeName.replace(/\s+/g, '_')}.docx`,
        content: reportBuffer,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    ],
  });
}
