const COLORS = {
  olive: '#777E49',
  cream: '#E7DCC9',
  taupe: '#8C7C63',
  card: '#FFFFFF',
  creamMuted: '#DCD2C2',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function baseEmailLayout({ preheader, title, subtitle, body }) {
  return `<!doctype html>
<html>
  <body style="margin:0; padding:0; background:${COLORS.cream};">
    <!-- Preheader (hidden) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      ${escapeHtml(preheader || title)}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.cream};">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px; background:${COLORS.card}; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="background:${COLORS.olive}; padding:18px 20px;">
                <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size:20px; font-weight:800; color:#FFFFFF;">
                  Leaf Doctor
                </div>
                <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size:13px; font-weight:600; color:rgba(255,255,255,0.88); margin-top:4px;">
                  ${escapeHtml(subtitle || 'Your confirmation from Leaf Doctor')}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 20px 8px 20px;">
                <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size:18px; font-weight:800; color:${COLORS.taupe}; line-height:1.25;">
                  ${escapeHtml(title)}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 20px 22px 20px;">
                ${body}
              </td>
            </tr>

            <tr>
              <td style="padding:14px 20px; background:${COLORS.creamMuted}; border-top:1px solid rgba(140,124,99,0.22);">
                <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size:12px; color:${COLORS.taupe}; line-height:1.6;">
                  If you have questions, reply to this email.
                  <br/>
                  <span style="color:rgba(140,124,99,0.92); font-weight:700;">Leaf Doctor</span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function otpEmailTemplate({ code, title, subtitle, note }) {
  const safeCode = escapeHtml(code);
  const safeNote = note ? escapeHtml(note) : '';
  const body = `
    <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; color:${COLORS.taupe}; font-size:14px; line-height:1.6;">
      <div style="margin-bottom:14px;">
        Use the code below to continue.
      </div>

      <div style="margin:0 auto 16px auto; max-width:360px; text-align:center; background:#E4EBE2; border:1px solid rgba(119,126,73,0.25); border-radius:14px; padding:14px 16px;">
        <div style="font-size:28px; font-weight:900; letter-spacing:4px; color:${COLORS.olive};">
          ${safeCode}
        </div>
      </div>

      ${safeNote ? `<div style="margin-top:8px; color:${COLORS.taupe}; font-weight:700;">${safeNote}</div>` : ''}
      <div style="margin-top:12px; color:rgba(140,124,99,0.95);">
        If you didn’t request this, you can ignore this email.
      </div>
    </div>
  `;

  return baseEmailLayout({
    title: title || 'Confirmation code',
    subtitle: subtitle || 'Leaf Doctor confirmation',
    preheader: 'Your Leaf Doctor confirmation code',
    body,
  });
}

function orderItemsRows(items) {
  if (!Array.isArray(items) || items.length === 0) return '';
  return items
    .map((it) => {
      const name = escapeHtml(it.productName);
      const qty = Number(it.quantity || 0);
      const unit = Number(it.unitPrice || 0);
      const line = Number(it.lineTotal || 0);
      const img = it.imageUrl ? escapeHtml(it.imageUrl) : '';

      return `
        <tr>
          <td style="padding:12px 0; width:56px; vertical-align:top;">
            ${
              img
                ? `<img src="${img}" alt="${name}" width="48" height="48" style="border-radius:10px; object-fit:cover; background:#F0EBE3; border:1px solid rgba(140,124,99,0.25);" />`
                : `<div style="width:48px; height:48px; border-radius:10px; background:#F0EBE3; border:1px solid rgba(140,124,99,0.25);"></div>`
            }
          </td>
          <td style="padding:12px 0; vertical-align:top;">
            <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size:14px; font-weight:800; color:${COLORS.taupe}; line-height:1.3;">
              ${name}
            </div>
            <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size:12px; color:${COLORS.taupe}; font-weight:700; margin-top:4px;">
              Qty ${qty} · $${unit.toFixed(2)} each
            </div>
          </td>
          <td style="padding:12px 0; width:92px; text-align:right; vertical-align:top;">
            <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size:14px; font-weight:900; color:${COLORS.olive};">
              $${line.toFixed(2)}
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function orderConfirmationEmailTemplate({ order, customerName }) {
  const shippingLine = order?.shipping?.line1
    ? `${order.shipping.line1}${order.shipping.line2 ? `, ${order.shipping.line2}` : ''}`
    : '—';

  const shippingCity = order?.shipping?.city ? `${order.shipping.city}` : '';
  const shippingPostal = order?.shipping?.postalCode ? `${order.shipping.postalCode}` : '';
  const shippingCountry = order?.shipping?.country ? `${order.shipping.country}` : '';
  const shippingTail = [shippingCity, shippingPostal].filter(Boolean).join(' · ') + (shippingCountry ? ` · ${shippingCountry}` : '');

  const items = order?.items || [];

  const body = `
    <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; color:${COLORS.taupe}; font-size:14px; line-height:1.6;">
      <div style="margin-bottom:14px;">
        Hi ${escapeHtml(customerName || 'there')}, your order is confirmed.
      </div>

      <div style="margin:12px 0; padding:14px; background:rgba(119,126,73,0.08); border:1px solid rgba(119,126,73,0.20); border-radius:14px;">
        <div style="font-weight:900; color:${COLORS.olive}; font-size:14px; margin-bottom:6px;">Order #${escapeHtml(order?.id || '')}</div>
        <div style="font-weight:800; color:${COLORS.taupe};">
          Status: ${(order?.status || '').toString().toUpperCase()}
        </div>
        <div style="margin-top:6px; font-weight:900; color:${COLORS.olive}; font-size:18px;">
          Total: $${Number(order?.total || 0).toFixed(2)}
        </div>
      </div>

      <div style="margin-top:18px;">
        <div style="font-weight:900; color:${COLORS.taupe}; margin-bottom:10px;">Items</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
          ${orderItemsRows(items)}
        </table>
      </div>

      <div style="margin-top:18px;">
        <div style="font-weight:900; color:${COLORS.taupe}; margin-bottom:10px;">Shipping</div>
        <div style="padding:14px; background:${COLORS.creamMuted}; border:1px solid rgba(140,124,99,0.20); border-radius:14px;">
          <div style="font-weight:800; color:${COLORS.taupe};">${escapeHtml(order?.shipping?.name || '—')}</div>
          <div style="margin-top:6px; color:${COLORS.taupe}; font-weight:700;">${escapeHtml(shippingLine)}</div>
          <div style="margin-top:4px; color:${COLORS.taupe}; font-weight:700;">${escapeHtml(shippingTail)}</div>
          ${order?.shipping?.phone ? `<div style="margin-top:6px; color:${COLORS.taupe}; font-weight:700;">Phone: ${escapeHtml(order.shipping.phone)}</div>` : ''}
        </div>
      </div>

      <div style="margin-top:18px; color:${COLORS.taupe}; font-weight:700;">
        Thank you for choosing Leaf Doctor.
      </div>
    </div>
  `;

  return baseEmailLayout({
    title: 'Order confirmation',
    subtitle: 'Leaf Doctor order details',
    preheader: 'Your Leaf Doctor order is confirmed',
    body,
  });
}

module.exports = {
  otpEmailTemplate,
  orderConfirmationEmailTemplate,
  COLORS,
  escapeHtml,
};

