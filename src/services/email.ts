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

  try {
    await transporter.verify();
    console.log(`SMTP verified: ${config.smtp.host}:${config.smtp.port} as ${config.smtp.user}`);
  } catch (err) {
    console.error('SMTP verify failed:', err);
    throw err;
  }

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: coachEmail,
    bcc: config.smtp.bcc.length > 0 ? config.smtp.bcc : undefined,
    subject: `Rapport d'orientation : ${coacheeName}`,
    text: `Bonjour,\n\nLe rapport d'orientation pour ${coacheeName} est prêt.\nVous le trouverez en pièce jointe.`,
    attachments: [
      {
        filename: `Rapport_${coacheeName.replace(/\s+/g, '_')}.docx`,
        content: reportBuffer,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    ],
  });

  console.log('SMTP sendMail info:', {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
    envelope: info.envelope,
  });
}
