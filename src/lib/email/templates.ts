export const brand = {
  primary: '#059669',
  primaryDark: '#047857',
  accent: '#f59e0b',
  text: '#0f172a',
  muted: '#64748b',
  bg: '#f1f5f9',
  card: '#ffffff',
  ring: '#d1fae5',
  success: '#10b981',
  danger: '#ef4444',
}

type LayoutOptions = {
  preheader?: string
  title: string
  heroIcon?: string
  heroEyebrow?: string
  badge?: string
  body: string
  ctaLabel?: string
  ctaHref?: string
  footerNote?: string
}

export function emailLayout({
  preheader,
  title,
  heroIcon,
  heroEyebrow,
  badge,
  body,
  ctaLabel,
  ctaHref,
  footerNote,
}: LayoutOptions) {
  const year = new Date().getFullYear()
  const icon =
    heroIcon ||
    `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>`

  const cta =
    ctaLabel && ctaHref
      ? `
      <tr>
        <td align="center" style="padding:28px 40px 0 40px;">
          <a href="${ctaHref}" style="display:inline-block;background:linear-gradient(135deg,${brand.primary},#10b981);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:999px;font-weight:700;font-size:15px;letter-spacing:.2px;box-shadow:0 10px 20px rgba(16,185,129,.25);">${ctaLabel}</a>
        </td>
      </tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${title}</title>
    <style>
      body, table, td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      a { color: ${brand.primary}; text-decoration: none; }
      @media (max-width: 620px) {
        .wrap { width: 100% !important; }
        .px-40 { padding-left: 24px !important; padding-right: 24px !important; }
        .hero { padding: 36px 24px !important; }
        .title { font-size: 26px !important; }
      }
    </style>
  </head>
  <body style="margin:0;background:${brand.bg};color:${brand.text};">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;color:${brand.bg};">${preheader}</div>` : ''}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${brand.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wrap" style="width:600px;max-width:100%;background:${brand.card};border-radius:20px;overflow:hidden;box-shadow:0 18px 40px rgba(15,23,42,.08);">
            <tr>
              <td class="hero" style="background:linear-gradient(135deg,#047857 0%,#059669 55%,#10b981 100%);padding:44px 40px;text-align:center;">
                <div style="width:64px;height:64px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:16px;margin:0 auto 18px;display:inline-block;line-height:0;">
                  <div style="padding:18px;">${icon}</div>
                </div>
                ${heroEyebrow ? `<div style="color:#a7f3d0;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">${heroEyebrow}</div>` : ''}
                <div class="title" style="color:#ffffff;font-size:30px;font-weight:800;letter-spacing:-.3px;line-height:1.15;">${title}</div>
                ${badge ? `<div style="display:inline-block;margin-top:16px;background:rgba(255,255,255,.18);color:#ffffff;padding:7px 16px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.3px;border:1px solid rgba(255,255,255,.25);">${badge}</div>` : ''}
              </td>
            </tr>

            <tr>
              <td class="px-40" style="padding:36px 40px 4px 40px;color:${brand.text};font-size:15px;line-height:1.7;">
                ${body}
              </td>
            </tr>

            ${cta}

            <tr>
              <td style="padding:36px 40px 12px 40px;">
                <div style="height:1px;background:linear-gradient(to right,transparent,#e2e8f0,transparent);"></div>
              </td>
            </tr>

            <tr>
              <td class="px-40" style="padding:0 40px 32px 40px;text-align:center;">
                <div style="font-size:15px;font-weight:800;color:${brand.primary};letter-spacing:-.2px;">FarmCon</div>
                <div style="font-size:12px;color:${brand.muted};margin-top:4px;">Smart Agri OS for Indian farmers</div>
                ${footerNote ? `<div style="font-size:12px;color:${brand.muted};margin-top:14px;line-height:1.6;">${footerNote}</div>` : ''}
                <div style="font-size:11px;color:${brand.muted};margin-top:18px;">
                  <a href="mailto:support@farmcon.in" style="color:${brand.primary};font-weight:600;">support@farmcon.in</a>
                  &nbsp;·&nbsp;
                  <a href="https://farmcon.in" style="color:${brand.primary};font-weight:600;">farmcon.in</a>
                </div>
                <div style="font-size:11px;color:#94a3b8;margin-top:14px;">© ${year} FarmCon. All rights reserved.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function otpEmail({ otp, minutes = 5 }: { otp: string; minutes?: number }) {
  const body = `
    <p style="margin:0 0 14px 0;font-size:18px;font-weight:700;color:${brand.text};">Your verification code</p>
    <p style="margin:0 0 24px 0;color:${brand.muted};">Use the code below to finish signing in. It expires in <strong style="color:${brand.text};">${minutes} minutes</strong>.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding:8px 0 4px 0;">
          <div style="background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:1px solid ${brand.ring};border-radius:16px;padding:28px 16px;text-align:center;">
            <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:${brand.primaryDark};text-transform:uppercase;">Verification code</div>
            <div style="font-family:'SF Mono','Menlo','Consolas',monospace;font-size:42px;font-weight:800;letter-spacing:10px;color:${brand.primary};margin:14px 0 6px 0;">${otp}</div>
            <div style="display:inline-block;background:#fef3c7;color:#92400e;border-radius:999px;padding:5px 14px;font-size:12px;font-weight:700;margin-top:6px;">Expires in ${minutes} minutes</div>
          </div>
        </td>
      </tr>
    </table>
    <div style="margin-top:28px;background:#f8fafc;border-left:4px solid ${brand.primary};border-radius:10px;padding:16px 18px;">
      <div style="font-size:13px;color:${brand.muted};line-height:1.7;">
        <strong style="color:${brand.text};">How to use:</strong> Return to the sign-in page, enter this 6-digit code, and you’re in.
        <br><br>
        <strong style="color:${brand.danger};">Heads up:</strong> FarmCon will never ask for this code. If you didn’t request it, you can safely ignore this email.
      </div>
    </div>
  `

  return {
    subject: `${otp} is your FarmCon verification code`,
    html: emailLayout({
      preheader: `Your FarmCon code: ${otp}. Expires in ${minutes} minutes.`,
      title: 'Verify your email',
      heroEyebrow: 'Sign-in request',
      body,
    }),
    text: `Your FarmCon verification code is ${otp}. It expires in ${minutes} minutes. If you didn’t request this, ignore this email.`,
  }
}

export function welcomeEmail({ ctaHref = 'https://farmcon.in/auth/signup' }: { ctaHref?: string } = {}) {
  const benefits = [
    ['Real-time mandi prices', 'Know when and where to sell for the best price.'],
    ['Expert farming guides', 'Weekly seasonal tips, pest control, irrigation advice.'],
    ['Exclusive drops', 'Early access to equipment rentals and input deals.'],
    ['Community success stories', 'Learn from farmers who’ve scaled with FarmCon.'],
  ]

  const benefitRows = benefits
    .map(
      ([title, desc]) => `
      <tr>
        <td style="padding:10px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="28" valign="top" style="padding-right:14px;">
                <div style="width:22px;height:22px;border-radius:50%;background:${brand.primary};display:inline-block;line-height:0;">
                  <div style="padding:4px 0 0 0;text-align:center;color:#fff;font-size:13px;font-weight:800;"></div>
                </div>
              </td>
              <td>
                <div style="font-size:14px;font-weight:700;color:${brand.text};">${title}</div>
                <div style="font-size:13px;color:${brand.muted};margin-top:3px;">${desc}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`,
    )
    .join('')

  const stats = [
    ['+40%', 'Avg. yield lift'],
    ['₹500 Cr', 'Crops sold'],
    ['10K+', 'Active farmers'],
  ]

  const statCells = stats
    .map(
      ([v, l]) => `
      <td align="center" style="padding:10px;width:33%;">
        <div style="font-size:26px;font-weight:800;color:${brand.primary};letter-spacing:-.5px;">${v}</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${brand.muted};margin-top:4px;">${l}</div>
      </td>`,
    )
    .join('')

  const body = `
    <p style="margin:0 0 10px 0;font-size:20px;font-weight:800;color:${brand.text};">You’re in. Welcome to FarmCon.</p>
    <p style="margin:0 0 24px 0;color:${brand.muted};">You’ve joined <strong style="color:${brand.text};">10,000+ farmers</strong> using data and real-time market intel to grow smarter — and sell at the right price.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border-radius:14px;padding:16px 10px;">
      <tr>${statCells}</tr>
    </table>

    <div style="margin:28px 0 8px 0;font-size:15px;font-weight:800;color:${brand.text};">What lands in your inbox</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${benefitRows}
    </table>
  `

  return {
    subject: 'Welcome to FarmCon — you’re in',
    html: emailLayout({
      preheader: 'Weekly mandi alerts, expert guides, and early feature access await.',
      title: 'Welcome to FarmCon',
      heroEyebrow: 'Newsletter',
      badge: 'Subscribed',
      body,
      ctaLabel: 'Explore the platform',
      ctaHref,
      footerNote:
        'You’re receiving this because you subscribed at farmcon.in. Reply to this email any time to get in touch.',
    }),
    text:
      'Welcome to FarmCon! You’ve joined 10,000+ farmers using FarmCon to grow smarter. Expect weekly mandi alerts, expert guides, and early access to new features. Explore: https://farmcon.in',
  }
}

export function orderConfirmationEmail({
  orderId,
  total,
  itemsLine,
}: {
  orderId: string
  total: number
  itemsLine: string
}) {
  const body = `
    <p style="margin:0 0 10px 0;font-size:18px;font-weight:800;color:${brand.text};">Order confirmed</p>
    <p style="margin:0 0 22px 0;color:${brand.muted};">Thanks for your order. Here’s the summary — a tracking link will follow once it ships.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0;border-radius:12px;padding:18px;background:#ffffff;">
      <tr>
        <td>
          <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:${brand.muted};text-transform:uppercase;">Order ID</div>
          <div style="font-size:15px;font-weight:700;color:${brand.text};margin-top:4px;">#${orderId}</div>
        </td>
        <td align="right">
          <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:${brand.muted};text-transform:uppercase;">Total</div>
          <div style="font-size:18px;font-weight:800;color:${brand.primary};margin-top:4px;">₹${total.toLocaleString('en-IN')}</div>
        </td>
      </tr>
      <tr><td colspan="2" style="padding-top:14px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>
      <tr>
        <td colspan="2" style="padding-top:14px;font-size:14px;color:${brand.muted};line-height:1.7;">${itemsLine}</td>
      </tr>
    </table>
  `
  return {
    subject: `Order #${orderId} confirmed · FarmCon`,
    html: emailLayout({
      preheader: `Your FarmCon order #${orderId} is confirmed.`,
      title: 'Your order is confirmed',
      heroEyebrow: 'Order receipt',
      body,
      ctaLabel: 'Track order',
      ctaHref: `https://farmcon.in/dashboard/orders`,
    }),
    text: `Your FarmCon order #${orderId} is confirmed. Total ₹${total}. Track at https://farmcon.in/dashboard/orders`,
  }
}
