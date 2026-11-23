import nodemailer from 'nodemailer';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_NAME = process.env.FROM_NAME || 'Vantage Capital';
const FROM_EMAIL = process.env.FROM_EMAIL || 'admin@vantagecapital.website';
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'admin@vantagecapital.website';

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    console.log(`[Email] SMTP Transport initialized for ${SMTP_USER}@${SMTP_HOST}:${SMTP_PORT}`);
  } catch (err) {
    console.error('[Email] Failed to initialize SMTP transport:', err.message);
  }
} else if (RESEND_API_KEY) {
  console.log('[Email] Resend API Key active for automated email dispatch.');
} else {
  console.log('[Email] No SMTP credentials configured. Outbound emails will be logged to console and saved.');
}

// In-memory log of recent automated emails (accessible by Admin)
export const recentEmailLogs = [];
const MAX_LOGS = 200;

function logEmail(record) {
  recentEmailLogs.unshift({
    id: Date.now() + Math.random().toString(36).substring(2, 6),
    timestamp: Date.now(),
    ...record,
  });
  if (recentEmailLogs.length > MAX_LOGS) {
    recentEmailLogs.length = MAX_LOGS;
  }
}

/**
 * Generic email sender with HTML wrapper and plain text fallback
 */
export async function sendEmail({ to, subject, html, text }) {
  const from = `"${FROM_NAME}" <${FROM_EMAIL}>`;
  const record = { to, subject, from, sent: false };

  console.log(`\n================== [AUTOMATED EMAIL DISPATCH] ==================`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Date: ${new Date().toUTCString()}`);
  console.log(`----------------------------------------------------------------`);

  // 1. Try Resend API (Fast, reliable direct dispatch)
  if (RESEND_API_KEY) {
    try {
      let fromAddress = `Vantage Capital <${FROM_EMAIL}>`;
      let res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html,
          text: text || subject,
        }),
      });
      let data = await res.json();

      // If domain not yet verified on Resend, try onboarding fallback for account test address
      if (res.status === 403 && data.message?.includes('not verified')) {
        console.warn('[Email Warning] Domain vantagecapital.website is not yet verified on Resend. Trying onboarding@resend.dev...');
        res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Vantage Capital <onboarding@resend.dev>',
            to: [to],
            subject,
            html,
            text: text || subject,
          }),
        });
        data = await res.json();
      }

      if (res.ok && data.id) {
        console.log(`[Email] Successfully delivered via Resend to ${to} (MessageID: ${data.id})`);
        record.sent = true;
        record.messageId = data.id;
        console.log(`================================================================\n`);
        logEmail(record);
        return record;
      } else {
        console.error(`[Email Resend Notice]`, data.message || data);
        record.error = data.message;
      }
    } catch (err) {
      console.error(`[Email Error] Failed delivering via Resend to ${to}:`, err.message);
      record.error = err.message;
    }
  }

  // 2. Fallback to SMTP transport if configured
  if (transporter && !record.sent) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || subject,
      });
      console.log(`[Email] Successfully delivered via SMTP to ${to} (MessageID: ${info.messageId})`);
      record.sent = true;
      record.messageId = info.messageId;
    } catch (err) {
      console.error(`[Email Error] Failed delivering via SMTP to ${to}:`, err.message);
      record.error = err.message;
    }
  }

  if (!record.sent) {
    console.log(`[Email Sim] Delivery simulated for ${to}.`);
    record.simulated = true;
  }
  console.log(`================================================================\n`);

  logEmail(record);
  return record;
}

/**
 * Standard branded HTML email template wrapper
 */
function wrapHtml(title, subtitle, contentHtml) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 24px 12px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #090d16 0%, #1e293b 100%); padding: 32px 28px; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: center; }
    .logo-badge { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 4px 12px; border-radius: 9999px; border: 1px solid rgba(56,189,248,0.25); margin-bottom: 12px; }
    .title { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .subtitle { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }
    .body { padding: 28px; line-height: 1.6; font-size: 14px; color: #cbd5e1; }
    .card { background-color: #131c31; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 18px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .row-label { color: #94a3b8; }
    .row-value { font-weight: 700; color: #f8fafc; font-family: 'SFMono-Regular', Consolas, monospace; }
    .button-wrap { text-align: center; margin: 26px 0 10px 0; }
    .btn { display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 8px; }
    .footer { background-color: #090d16; padding: 20px 28px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 11px; color: #64748b; line-height: 1.5; }
    .footer a { color: #38bdf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">VANTAGE CAPITAL</div>
      <h1 class="title">${title}</h1>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <div>&copy; ${new Date().getFullYear()} Vantage Capital Financial Technologies Inc.</div>
      <div>1680 Capital One Drive, McLean, VA 22102 &bull; <a href="https://vantagecapital.website">vantagecapital.website</a></div>
      <div style="margin-top: 6px;">Support: <a href="mailto:admin@vantagecapital.website">admin@vantagecapital.website</a></div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. Automated Welcome Email for New Signups
 */
export async function sendWelcomeEmail({ to, name, accountId }) {
  const subject = `Welcome to Vantage Capital — Account Initialized [${accountId}]`;
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>Welcome to <strong>Vantage Capital</strong>. Your institutional client account has been initialized and is ready for market operations and portfolio monitoring.</p>
    
    <div class="card">
      <div class="row">
        <span class="row-label">Account Name:</span>
        <span class="row-value">${name}</span>
      </div>
      <div class="row">
        <span class="row-label">Institutional Account ID:</span>
        <span class="row-value">${accountId}</span>
      </div>
      <div class="row">
        <span class="row-label">Account Status:</span>
        <span class="row-value" style="color: #10b981;">ACTIVE &bull; VERIFIED</span>
      </div>
      <div class="row">
        <span class="row-label">Primary Currency:</span>
        <span class="row-value">USD ($)</span>
      </div>
    </div>

    <p><strong>Next Steps:</strong></p>
    <ul style="padding-left: 20px; margin: 12px 0;">
      <li>Log in to access your live multi-asset trading terminal.</li>
      <li>To allocate funds, navigate to <strong>Deposit</strong> to view institutional wire instructions.</li>
      <li>Always quote your Account ID (<code>${accountId}</code>) on wire memos to ensure automated matching.</li>
    </ul>

    <div class="button-wrap">
      <a href="https://vantagecapital.website" class="btn">Log In to Client Portal</a>
    </div>

    <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
      If you did not create this account, please immediately contact our institutional security desk at <a href="mailto:admin@vantagecapital.website" style="color: #38bdf8;">admin@vantagecapital.website</a>.
    </p>
  `;

  await sendEmail({
    to,
    subject,
    html: wrapHtml('Client Account Initialized', 'Institutional Market Access', content),
    text: `Welcome to Vantage Capital, ${name}!\n\nYour account has been initialized.\nAccount ID: ${accountId}\nStatus: Active\n\nLog in at: https://vantagecapital.website\nContact: admin@vantagecapital.website`,
  });

  // Admin Notification
  await sendAdminAlert({
    subject: `[New Registration] ${name} (${to})`,
    title: 'New Client Registration',
    details: [
      { label: 'Client Name', value: name },
      { label: 'Email', value: to },
      { label: 'Account ID', value: accountId },
      { label: 'Timestamp', value: new Date().toUTCString() },
    ],
  });
}

/**
 * 2. Automated Deposit Notice Email (When client reports a transfer)
 */
export async function sendDepositReportedEmail({ to, name, amount, referenceId, originatingBank, accountId }) {
  const subject = `[Vantage Capital] Inbound Transfer Notice Received — Ref: ${referenceId}`;
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>We have received your inbound bank transfer notice. Our settlement operations team is matching your incoming funds with our depository institution.</p>

    <div class="card">
      <div class="row">
        <span class="row-label">Transfer Amount:</span>
        <span class="row-value" style="color: #38bdf8; font-size: 15px;">$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
      </div>
      <div class="row">
        <span class="row-label">Reference ID:</span>
        <span class="row-value">${referenceId}</span>
      </div>
      <div class="row">
        <span class="row-label">Client Account:</span>
        <span class="row-value">${accountId}</span>
      </div>
      ${originatingBank ? `
      <div class="row">
        <span class="row-label">Originating Bank:</span>
        <span class="row-value">${originatingBank}</span>
      </div>` : ''}
      <div class="row">
        <span class="row-label">Current Status:</span>
        <span class="row-value" style="color: #f59e0b;">AWAITING CONFIRMATION</span>
      </div>
    </div>

    <p>Once settled at Capital One, N.A., your ledger balance will be automatically updated and you will receive a final confirmation receipt.</p>

    <div class="button-wrap">
      <a href="https://vantagecapital.website" class="btn">View Transaction Status</a>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    html: wrapHtml('Inbound Deposit Reported', 'Depository Verification in Progress', content),
    text: `Inbound Deposit Notice Received\n\nClient: ${name}\nAmount: $${amount}\nReference: ${referenceId}\nStatus: Awaiting Settlement Confirmation\n\nTrack status at https://vantagecapital.website`,
  });

  // Admin Notification
  await sendAdminAlert({
    subject: `[Action Required] New Inbound Deposit: $${Number(amount).toLocaleString()} from ${name}`,
    title: 'New Inbound Wire Transfer Reported',
    details: [
      { label: 'Client Name', value: name },
      { label: 'Amount', value: `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD` },
      { label: 'Reference Ref', value: referenceId },
      { label: 'Client Email', value: to },
      { label: 'Originating Bank', value: originatingBank || 'Not specified' },
    ],
    actionUrl: 'https://vantagecapital.website/admin',
  });
}

/**
 * 3. Automated Deposit Confirmed Email (When Admin confirms & credits)
 */
export async function sendDepositConfirmedEmail({ to, name, amount, referenceId, newBalance, accountId }) {
  const subject = `[Vantage Capital] Deposit Confirmed & Credited — $${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>We are pleased to confirm that your incoming wire transfer has settled and is now credited to your active trading ledger.</p>

    <div class="card">
      <div class="row">
        <span class="row-label">Credited Amount:</span>
        <span class="row-value" style="color: #10b981; font-size: 15px;">+$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
      </div>
      <div class="row">
        <span class="row-label">Updated Active Balance:</span>
        <span class="row-value" style="color: #ffffff; font-size: 15px;">$${Number(newBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
      </div>
      <div class="row">
        <span class="row-label">Reference ID:</span>
        <span class="row-value">${referenceId}</span>
      </div>
      <div class="row">
        <span class="row-label">Status:</span>
        <span class="row-value" style="color: #10b981;">SETTLED &bull; COMPLETED</span>
      </div>
    </div>

    <div class="button-wrap">
      <a href="https://vantagecapital.website" class="btn">Launch Trading Terminal</a>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    html: wrapHtml('Deposit Confirmed & Available', 'Funds Credited to Active Ledger', content),
    text: `Deposit Confirmed!\n\nDear ${name},\nYour deposit of $${amount} has been credited.\nUpdated Balance: $${newBalance}\nReference: ${referenceId}\n\nAccess your account: https://vantagecapital.website`,
  });
}

/**
 * 4. Automated Withdrawal Request Email
 */
export async function sendWithdrawalRequestedEmail({ to, name, amount, referenceId, bankName, accountLast4 }) {
  const subject = `[Vantage Capital] Withdrawal Request Acknowledged — Ref: ${referenceId}`;
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>Your capital withdrawal request has been received and queued for compliance verification and domestic wire disbursement.</p>

    <div class="card">
      <div class="row">
        <span class="row-label">Requested Amount:</span>
        <span class="row-value" style="color: #f43f5e; font-size: 15px;">-$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
      </div>
      <div class="row">
        <span class="row-label">Destination Bank:</span>
        <span class="row-value">${bankName || 'Designated Bank'}</span>
      </div>
      ${accountLast4 ? `
      <div class="row">
        <span class="row-label">Account:</span>
        <span class="row-value">&bull;&bull;&bull;&bull; ${accountLast4}</span>
      </div>` : ''}
      <div class="row">
        <span class="row-label">Reference ID:</span>
        <span class="row-value">${referenceId}</span>
      </div>
      <div class="row">
        <span class="row-label">Status:</span>
        <span class="row-value" style="color: #f59e0b;">COMPLIANCE REVIEW &bull; PENDING</span>
      </div>
    </div>

    <p style="font-size: 12px; color: #94a3b8;">
      The requested funds have been placed on institutional hold and will be wired via Fedwire/ACH directly to your bank account upon approval.
    </p>
  `;

  await sendEmail({
    to,
    subject,
    html: wrapHtml('Withdrawal Request Queued', 'Capital Disbursement Notice', content),
    text: `Withdrawal Request Received\n\nClient: ${name}\nAmount: $${amount}\nDestination: ${bankName}\nReference: ${referenceId}\nStatus: Pending Review\n\nPortal: https://vantagecapital.website`,
  });

  // Admin Notification
  await sendAdminAlert({
    subject: `[Action Required] New Withdrawal Request: $${Number(amount).toLocaleString()} by ${name}`,
    title: 'New Client Withdrawal Request',
    details: [
      { label: 'Client Name', value: name },
      { label: 'Amount', value: `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD` },
      { label: 'Destination Bank', value: bankName || 'Not specified' },
      { label: 'Reference Ref', value: referenceId },
      { label: 'Client Email', value: to },
    ],
    actionUrl: 'https://vantagecapital.website/admin',
  });
}

/**
 * 5. Automated Withdrawal Dispatched Email (When Admin approves)
 */
export async function sendWithdrawalDispatchedEmail({ to, name, amount, referenceId, bankName }) {
  const subject = `[Vantage Capital] Wire Dispatched — $${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>Your withdrawal has been approved and the wire transfer has been dispatched to your beneficiary bank account.</p>

    <div class="card">
      <div class="row">
        <span class="row-label">Dispatched Amount:</span>
        <span class="row-value" style="color: #10b981; font-size: 15px;">$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
      </div>
      <div class="row">
        <span class="row-label">Destination Bank:</span>
        <span class="row-value">${bankName || 'Designated Bank Account'}</span>
      </div>
      <div class="row">
        <span class="row-label">Reference ID:</span>
        <span class="row-value">${referenceId}</span>
      </div>
      <div class="row">
        <span class="row-label">Status:</span>
        <span class="row-value" style="color: #10b981;">DISPATCHED &bull; COMPLETED</span>
      </div>
    </div>

    <p style="font-size: 12px; color: #94a3b8;">
      Depending on your receiving bank's wire processing schedule, funds typically reflect in your account within 1 to 24 business hours.
    </p>
  `;

  await sendEmail({
    to,
    subject,
    html: wrapHtml('Wire Transfer Dispatched', 'Payout Completed', content),
    text: `Wire Dispatched!\n\nDear ${name},\nYour payout of $${amount} has been dispatched to ${bankName}.\nReference: ${referenceId}\nStatus: Dispatched\n\nPortal: https://vantagecapital.website`,
  });
}

/**
 * 6. Internal Admin Security & Operations Alert
 */
export async function sendAdminAlert({ subject, title, details = [], actionUrl }) {
  const rows = details.map(d => `
    <div class="row">
      <span class="row-label">${d.label}:</span>
      <span class="row-value">${d.value}</span>
    </div>
  `).join('');

  const content = `
    <p>An institutional operational event requires your attention:</p>
    <div class="card">
      ${rows}
    </div>
    ${actionUrl ? `
    <div class="button-wrap">
      <a href="${actionUrl}" class="btn">Open Admin Portal</a>
    </div>` : ''}
  `;

  await sendEmail({
    to: ADMIN_ALERT_EMAIL,
    subject,
    html: wrapHtml(title, 'Internal Operations Alert', content),
    text: `${title}\n\n` + details.map(d => `${d.label}: ${d.value}`).join('\n') + `\n\nAdmin Portal: https://vantagecapital.website/admin`,
  });
}
