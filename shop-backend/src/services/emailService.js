const nodemailer = require('nodemailer');

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  // Port 465 = TLS from first byte (secure: true). Port 587 = plain then STARTTLS (secure: false).
  let secure = process.env.SMTP_SECURE === 'true';
  if (secure && port === 587) {
    console.warn(
      '[email] SMTP_SECURE=true is incompatible with port 587; using STARTTLS (secure=false). For implicit TLS use port 465.'
    );
    secure = false;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth:
      process.env.SMTP_USER != null && process.env.SMTP_USER !== ''
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
        : undefined,
  });
}

/** True when SMTP_HOST is set (Railway health check; does not verify login or delivery). */
function isSmtpConfigured() {
  return getTransport() != null;
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || 'Leaf Doctor <noreply@leafdoctor.local>';
  const transport = getTransport();
  if (!transport) {
    console.warn('\n========== [email:dev] SMTP not configured — OTP below ==========');
    console.warn(`To: ${to}`);
    console.warn(`Subject: ${subject}`);
    console.warn(text || '');
    console.warn('================================================================\n');
    return { skipped: true, reason: 'smtp_not_configured' };
  }
  const info = await transport.sendMail({ from, to, subject, text, html });
  return { skipped: false, info };
}

module.exports = { sendMail, isSmtpConfigured };
