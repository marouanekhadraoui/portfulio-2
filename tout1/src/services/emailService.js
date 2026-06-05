const { Resend } = require('resend');
const nodemailer = require('nodemailer');

const escapeHtml = (text = '') =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildEmailContent = (data) => {
  const { firstName, lastName, email, subject, message } = data;
  const fullName = `${firstName} ${lastName}`.trim();
  const safeSubject = subject?.trim() || 'General inquiry';
  const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Algiers' });

  const emailSubject = `[Portfolio] ${safeSubject} — ${fullName}`;

  const text = [
    'New message from your portfolio website',
    '',
    `Name: ${fullName}`,
    `Email: ${email}`,
    `Subject: ${safeSubject}`,
    `Date: ${timestamp}`,
    '',
    'Message:',
    message,
    '',
    '---',
    'Reply directly to this email to respond to the sender.',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden">
          <tr>
            <td style="background:#0f172a;padding:20px 28px">
              <p style="margin:0;font-size:13px;color:#94a3b8;letter-spacing:0.05em;text-transform:uppercase">Portfolio Contact</p>
              <h1 style="margin:8px 0 0;font-size:20px;color:#ffffff;font-weight:600">New message received</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9">
                    <span style="font-size:12px;color:#64748b;display:block">From</span>
                    <strong style="font-size:14px;color:#0f172a">${escapeHtml(fullName)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9">
                    <span style="font-size:12px;color:#64748b;display:block">Email</span>
                    <a href="mailto:${escapeHtml(email)}" style="font-size:14px;color:#0284c7;text-decoration:none">${escapeHtml(email)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9">
                    <span style="font-size:12px;color:#64748b;display:block">Subject</span>
                    <strong style="font-size:14px;color:#0f172a">${escapeHtml(safeSubject)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0">
                    <span style="font-size:12px;color:#64748b;display:block">Date</span>
                    <span style="font-size:14px;color:#0f172a">${escapeHtml(timestamp)}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Message</p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;font-size:14px;line-height:1.6;color:#334155;white-space:pre-wrap">${escapeHtml(message)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0">
              <p style="margin:0;font-size:11px;color:#94a3b8">Sent via Marouane Khadraoui Portfolio · Reply to respond directly to the sender.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { emailSubject, text, html, fullName, safeSubject };
};

const sendViaResend = async (data) => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;

  const resend = new Resend(apiKey);
  const { emailSubject, text, html } = buildEmailContent(data);
  const toEmail = process.env.CONTACT_TO_EMAIL?.trim();
  const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim() || 'onboarding@resend.dev';
  const fromName = process.env.CONTACT_FROM_NAME?.trim() || 'Marouane Portfolio';

  const result = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: [toEmail],
    replyTo: data.email,
    subject: emailSubject,
    text,
    html,
    headers: {
      'X-Priority': '3',
      'X-Mailer': 'Portfolio-Contact-System',
    },
  });

  if (result.error) throw new Error(result.error.message);
  return { provider: 'resend', id: result.data?.id };
};

const sendViaGmail = async (data) => {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) return null;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  const { emailSubject, text, html } = buildEmailContent(data);
  const toEmail = process.env.CONTACT_TO_EMAIL?.trim() || user;

  const info = await transporter.sendMail({
    from: `"Marouane Portfolio" <${user}>`,
    to: toEmail,
    replyTo: `"${data.firstName} ${data.lastName}" <${data.email}>`,
    subject: emailSubject,
    text,
    html,
    priority: 'normal',
    headers: {
      'X-Mailer': 'Portfolio-Contact-System',
    },
  });

  return { provider: 'gmail', id: info.messageId };
};

const sendEmail = async (data) => {
  const errors = [];

  try {
    const resendResult = await sendViaResend(data);
    if (resendResult) {
      console.log(`Email sent via Resend (${resendResult.id})`);
      return resendResult;
    }
  } catch (err) {
    console.error('Resend failed:', err.message);
    errors.push(`Resend: ${err.message}`);
  }

  try {
    const gmailResult = await sendViaGmail(data);
    if (gmailResult) {
      console.log(`Email sent via Gmail (${gmailResult.id})`);
      return gmailResult;
    }
  } catch (err) {
    console.error('Gmail failed:', err.message);
    errors.push(`Gmail: ${err.message}`);
  }

  if (!process.env.RESEND_API_KEY?.trim() && !process.env.GMAIL_USER?.trim()) {
    throw new Error('No email provider configured. Set RESEND_API_KEY or GMAIL credentials in .env');
  }

  throw new Error(errors.join(' | ') || 'Failed to send email');
};

module.exports = { sendEmail, buildEmailContent };
