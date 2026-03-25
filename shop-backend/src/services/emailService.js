const { Resend } = require('resend');

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !String(apiKey).trim()) return null;
  return new Resend(apiKey);
}

/**
 * True when RESEND_API_KEY is set.
 * Note: This does not guarantee delivery; it only indicates the API client can be created.
 */
function isResendConfigured() {
  return getResendClient() != null;
}

function isEmailApiConfigured() {
  const hasResend = isResendConfigured();
  const hasSendGrid = !!(process.env.SENDGRID_API_KEY && String(process.env.SENDGRID_API_KEY).trim());
  return hasResend || hasSendGrid;
}

function extractEmail(from) {
  const s = String(from || '').trim();
  const match = s.match(/<([^>]+)>/);
  return (match ? match[1] : s).trim();
}

async function sendViaSendGrid(to, subject, html, text) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    throw new Error('SendGrid not configured (missing SENDGRID_API_KEY)');
  }

  const from = process.env.EMAIL_FROM || 'Leaf Doctor <noreply@leafdoctor.local>';
  const fromEmail = extractEmail(from);
  if (!fromEmail) throw new Error('Missing valid EMAIL_FROM for SendGrid');

  const content = [
    { type: 'text/html', value: html },
    ...(text ? [{ type: 'text/plain', value: text }] : []),
  ];

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail },
      subject,
      content,
    }),
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`SendGrid failed status=${response.status} body=${bodyText.slice(0, 500)}`);
  }

  return { provider: 'sendgrid', raw: bodyText };
}

/**
 * HTTPS email sending via Resend.
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @param {string=} text Optional plain text fallback
 */
async function sendEmail(to, subject, html, text) {
  const resend = getResendClient();
  const from = process.env.EMAIL_FROM || 'Leaf Doctor <noreply@leafdoctor.local>';

  const canSendViaSendGrid = !!(process.env.SENDGRID_API_KEY && String(process.env.SENDGRID_API_KEY).trim());

  if (resend) {
    try {
      const payload = {
        from,
        to,
        subject,
        html,
      };
      if (text) payload.text = text;

      // Resend Node SDK returns { data, error, headers } — it does NOT throw on 4xx/validation errors.
      const result = await resend.emails.send(payload);
      if (result?.error) {
        const errMsg =
          typeof result.error?.message === 'string'
            ? result.error.message
            : JSON.stringify(result.error);
        throw new Error(`Resend API rejected send: ${errMsg}`);
      }
      const id = result?.data?.id ?? 'unknown';
      console.info(`[email] Resend accepted message id=${id} to=${to} subject=${String(subject).slice(0, 80)}`);
      return result.data ?? { id };
    } catch (e) {
      console.error(
        `[email] Resend send failed to=${to} subject=${String(subject).slice(0, 80)}: ${e?.message || String(e)}`
      );
      if (!canSendViaSendGrid) throw e;
      console.warn('[email] falling back to SendGrid...');
    }
  } else if (!canSendViaSendGrid) {
    console.warn(
      `[email] Email provider not configured (set RESEND_API_KEY and/or SENDGRID_API_KEY); skipping send to=${to} subject=${subject}`
    );
    if (text || html) console.warn(text || html);
    return { skipped: true, reason: 'email_provider_not_configured' };
  }

  // Fallback (either Resend not configured, or it failed)
  return await sendViaSendGrid(to, subject, html, text);
}

module.exports = { sendEmail, isResendConfigured, isEmailApiConfigured };
