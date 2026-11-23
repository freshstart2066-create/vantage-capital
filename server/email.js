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
 * Helper to generate user initials for avatar
 */
function getInitials(name) {
  if (!name) return 'VC';
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Standard branded HTML email template wrapper (Official Banking Style with Profile Picture & Brand Emblem)
 */
function wrapHtml(headline, subtitle, contentHtml) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #eef2f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #eef2f6; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Institutional Card Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 6px; overflow: hidden; border: 1px solid #dcdfe4; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          
          <!-- Top Capital One / Chase Style Brand Bar with Official Emblem Avatar -->
          <tr>
            <td style="background-color: #004879; padding: 20px 32px; border-bottom: 3px solid #003153;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 14px;">
                          <!-- Official Vantage Capital Brand Emblem Profile Picture -->
                          <img src="https://vantagecapital.website/logo.png" alt="Vantage Capital Emblem" width="44" height="44" style="display: block; border-radius: 50%; border: 2px solid #d4af37; background-color: #003153;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 19px; font-weight: bold; letter-spacing: 2px; color: #ffffff; display: block; line-height: 1.2;">VANTAGE CAPITAL</span>
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; color: #b8d4e9; display: block; margin-top: 2px;">Institutional Treasury & Custody</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 5px 12px; border-radius: 12px; background-color: rgba(255,255,255,0.12); color: #ffffff; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; border: 1px solid rgba(255,255,255,0.22); font-family: Arial, sans-serif;">Official Notice</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 34px 32px 28px 32px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #222222; line-height: 1.6;">
              <h1 style="font-size: 21px; font-weight: bold; color: #004879; margin: 0 0 8px 0; line-height: 1.3;">${headline}</h1>
              ${subtitle ? `<p style="font-size: 13px; color: #64748b; margin: 0 0 24px 0; padding-bottom: 12px; border-bottom: 1px solid #eef2f6;">${subtitle}</p>` : '<div style="margin-bottom: 24px;"></div>'}
              ${contentHtml}
            </td>
          </tr>

          <!-- Bank Regulatory Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0;">
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 10px;">
                    <img src="https://vantagecapital.website/avatar.png" width="28" height="28" style="border-radius: 50%; border: 1px solid #cbd5e1; display: block;" alt="Seal" />
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-weight: bold; color: #1e293b; font-size: 12px;">Vantage Capital Technologies, Inc.</span>
                    <span style="color: #64748b; font-size: 11px; display: block;">Depository & Settlement Operations Desk</span>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 8px 0;">1680 Capital One Drive, McLean, VA 22102 &bull; Depository escrow accounts maintained at Capital One, N.A. (Member FDIC).</p>
              <p style="margin: 0 0 10px 0;">Client Support: <a href="mailto:admin@vantagecapital.website" style="color: #004879; text-decoration: underline;">admin@vantagecapital.website</a> &bull; Portal: <a href="https://vantagecapital.website" style="color: #004879; text-decoration: underline;">vantagecapital.website</a></p>
              <p style="margin: 0 0 8px 0; color: #778899;">This is an automated operational transmission regarding your account. Please do not reply directly to this notification as the mailbox is unattended.</p>
              <p style="margin: 0; color: #94a3b8;">&copy; ${new Date().getFullYear()} Vantage Capital. All rights reserved. Equal Housing Opportunity.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Automated Welcome Email for New Signups (Capital One / Chase Format with Profile Picture)
 */
export async function sendWelcomeEmail({ to, name, accountId }) {
  const initials = getInitials(name);
  const subject = `Welcome to Vantage Capital: Important information regarding your new account`;
  const content = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Dear ${name},</p>
    
    <p style="margin: 0 0 16px 0;">
      Thank you for opening an account with Vantage Capital. We are pleased to confirm that your institutional custody and trading account has been successfully created and approved for active operations.
    </p>

    <p style="margin: 0 0 22px 0;">
      Your client profile has been registered with our operations desk, providing you with direct access to our treasury management platform, market execution facilities, and dedicated custody infrastructure.
    </p>

    <!-- Account Details Table with Client Profile Picture -->
    <table width="100%" cellpadding="11" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 24px;">
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 12px 16px; vertical-align: middle;">Account Holder:</td>
        <td align="right" style="border-bottom: 1px solid #e2e8f0; padding: 12px 16px; vertical-align: middle;">
          <table cellpadding="0" cellspacing="0" border="0" align="right">
            <tr>
              <td style="vertical-align: middle; padding-right: 10px;">
                <!-- Client Profile Picture Avatar Circle -->
                <div style="width: 34px; height: 34px; border-radius: 50%; background-color: #004879; color: #ffffff; font-weight: bold; font-size: 13px; line-height: 34px; text-align: center; border: 2px solid #cbd5e1; font-family: Arial, sans-serif;">
                  ${initials}
                </div>
              </td>
              <td style="vertical-align: middle; text-align: left;">
                <div style="font-size: 14px; font-weight: bold; color: #1e293b; font-family: Arial, sans-serif;">${name}</div>
                <div style="font-size: 10px; font-weight: bold; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">&#10003; Verified Client Profile</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Account Number:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #004879; font-family: monospace; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">${accountId}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Registered Email:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">${to}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Base Currency:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">USD ($)</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Depository Partner:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Capital One, N.A. (McLean, VA)</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; padding: 11px 16px;">Account Status:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #00875a; padding: 11px 16px;">Active &bull; In Good Standing</td>
      </tr>
    </table>

    <h2 style="font-size: 14px; font-weight: bold; color: #004879; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Next Steps to Get Started:</h2>
    <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.65;">
      <li style="margin-bottom: 8px;">
        <strong>Access your client dashboard:</strong> Sign in at <a href="https://vantagecapital.website" style="color: #004879; text-decoration: underline;">vantagecapital.website</a> to review market positions and portfolio tools.
      </li>
      <li style="margin-bottom: 8px;">
        <strong>Fund your account via bank wire:</strong> Select <em>Deposit</em> inside your account portal to view our designated domestic wire instructions at Capital One, N.A.
      </li>
      <li style="margin-bottom: 8px;">
        <strong>Important wire reference:</strong> Always provide your Account Number (<strong>${accountId}</strong>) in the originator-to-beneficiary information (wire memo) so funds are routed to your ledger without delay.
      </li>
      <li>
        <strong>Monitor transactions:</strong> Real-time balance updates, wire confirmations, and trade execution notices will be dispatched to this email address automatically.
      </li>
    </ul>

    <!-- Sign In Button -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td align="center" style="background-color: #004879; border-radius: 4px;">
          <a href="https://vantagecapital.website" style="display: inline-block; padding: 13px 32px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; letter-spacing: 0.5px;">Sign In to Your Account</a>
        </td>
      </tr>
    </table>

    <!-- Security Reminder Box -->
    <table width="100%" cellpadding="14" cellspacing="0" border="0" style="background-color: #fbf7ee; border-left: 4px solid #d97706; border-radius: 2px; margin: 24px 0;">
      <tr>
        <td style="font-size: 12px; color: #78350f; line-height: 1.5; font-family: Arial, Helvetica, sans-serif;">
          <strong>Security Notice:</strong> Vantage Capital will never contact you by phone, text message, or unsolicited email requesting your password, PIN, or multi-factor authentication codes. If you ever receive a suspicious communication, notify our security desk immediately at <a href="mailto:admin@vantagecapital.website" style="color: #78350f; text-decoration: underline;">admin@vantagecapital.website</a>.
        </td>
      </tr>
    </table>

    <!-- Officer Profile Avatar Sign-off -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
      <tr>
        <td style="vertical-align: middle; padding-right: 12px;">
          <img src="https://vantagecapital.website/avatar.png" width="38" height="38" style="border-radius: 50%; border: 1.5px solid #cbd5e1; display: block;" alt="Desk Officer" />
        </td>
        <td style="vertical-align: middle;">
          <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e293b; font-family: Arial, sans-serif;">Client Operations & Treasury Desk</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b; font-family: Arial, sans-serif;">Vantage Capital Technologies, Inc. &bull; McLean, VA</p>
        </td>
      </tr>
    </table>
  `;

  await sendEmail({
    to,
    subject,
    html: wrapHtml('Account Established', 'Important confirmation and next steps for your new account', content),
    text: `Dear ${name},\n\nWelcome to Vantage Capital. Your institutional custody account has been established and approved for active operations.\n\nAccount Summary:\nAccount Holder: ${name}\nAccount Number: ${accountId}\nBase Currency: USD ($)\nDepository Partner: Capital One, N.A. (McLean, VA)\nStatus: Active\n\nTo fund your account or view balances, please sign in at: https://vantagecapital.website\nDepository Location: 1680 Capital One Drive, McLean, VA 22102\nClient Support: admin@vantagecapital.website\n\nSincerely,\nClient Operations & Treasury Services\nVantage Capital`,
  });

  // Admin Notification
  await sendAdminAlert({
    subject: `[New Registration] ${name} (${to})`,
    title: 'New Client Registration Completed',
    details: [
      { label: 'Client Name', value: name },
      { label: 'Client Email', value: to },
      { label: 'Account ID', value: accountId },
      { label: 'Registration Date', value: new Date().toUTCString() },
    ],
  });
}

/**
 * 2. Automated Deposit Notice Email (When client reports a transfer)
 */
export async function sendDepositReportedEmail({ to, name, amount, referenceId, originatingBank, accountId }) {
  const formattedAmount = Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const initials = getInitials(name);
  const subject = `Deposit Notification Received — Ref: ${referenceId}`;
  const content = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Dear ${name},</p>
    <p style="margin: 0 0 20px 0;">
      We have received your notification of an inbound transfer. Our treasury settlement operations desk has logged this transaction and is tracking incoming funds at our depository partner, Capital One, N.A.
    </p>

    <!-- Transfer Details Table with Profile Avatar -->
    <table width="100%" cellpadding="11" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 24px;">
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 12px 16px; vertical-align: middle;">Account Holder:</td>
        <td align="right" style="border-bottom: 1px solid #e2e8f0; padding: 12px 16px; vertical-align: middle;">
          <table cellpadding="0" cellspacing="0" border="0" align="right">
            <tr>
              <td style="vertical-align: middle; padding-right: 8px;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #004879; color: #ffffff; font-weight: bold; font-size: 11px; line-height: 28px; text-align: center; border: 1px solid #cbd5e1;">
                  ${initials}
                </div>
              </td>
              <td style="vertical-align: middle; font-size: 13px; font-weight: bold; color: #1e293b;">
                ${name}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Transfer Amount:</td>
        <td align="right" style="font-size: 14px; font-weight: bold; color: #004879; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">$${formattedAmount} USD</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Reference Number:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #1e293b; font-family: monospace; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">${referenceId}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Account Number:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #1e293b; font-family: monospace; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">${accountId}</td>
      </tr>
      ${originatingBank ? `
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Originating Institution:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">${originatingBank}</td>
      </tr>` : ''}
      <tr>
        <td style="font-size: 13px; color: #64748b; padding: 11px 16px;">Settlement Status:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #b45309; padding: 11px 16px;">Pending Settlement</td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
      Domestic wire transfers typically settle within 1 to 4 business hours depending on the originating bank's cutoff windows. Once funds are confirmed at Capital One, N.A., your ledger balance will be automatically credited and a receipt notification will follow.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center" style="background-color: #004879; border-radius: 4px;">
          <a href="https://vantagecapital.website" style="display: inline-block; padding: 13px 32px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none;">View Transaction History</a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
      <tr>
        <td style="vertical-align: middle; padding-right: 12px;">
          <img src="https://vantagecapital.website/avatar.png" width="38" height="38" style="border-radius: 50%; border: 1.5px solid #cbd5e1; display: block;" alt="Desk Officer" />
        </td>
        <td style="vertical-align: middle;">
          <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e293b; font-family: Arial, sans-serif;">Treasury Settlement Operations</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b; font-family: Arial, sans-serif;">Vantage Capital Technologies, Inc. &bull; McLean, VA</p>
        </td>
      </tr>
    </table>
  `;

  await sendEmail({
    to,
    subject,
    html: wrapHtml('Inbound Deposit Received', 'We have logged your deposit notice and are awaiting settlement', content),
    text: `Deposit Notice Received\n\nClient: ${name}\nAmount: $${formattedAmount} USD\nReference: ${referenceId}\nStatus: Pending Settlement\n\nTrack status: https://vantagecapital.website`,
  });

  // Admin Notification
  await sendAdminAlert({
    subject: `[Action Required] Inbound Wire Reported: $${formattedAmount} from ${name}`,
    title: 'Inbound Wire Transfer Notice',
    details: [
      { label: 'Client Name', value: name },
      { label: 'Amount', value: `$${formattedAmount} USD` },
      { label: 'Reference Ref', value: referenceId },
      { label: 'Account ID', value: accountId },
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
  const formattedAmount = Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedBalance = Number(newBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const initials = getInitials(name);
  const subject = `Deposit Confirmation: $${formattedAmount} USD credited to your account`;
  const content = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Dear ${name},</p>
    <p style="margin: 0 0 20px 0;">
      We are pleased to inform you that your wire transfer has successfully settled at our depository institution and has been credited to your active account balance.
    </p>

    <!-- Credit Details Table with Profile Avatar -->
    <table width="100%" cellpadding="11" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 24px;">
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 12px 16px; vertical-align: middle;">Account Holder:</td>
        <td align="right" style="border-bottom: 1px solid #e2e8f0; padding: 12px 16px; vertical-align: middle;">
          <table cellpadding="0" cellspacing="0" border="0" align="right">
            <tr>
              <td style="vertical-align: middle; padding-right: 8px;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #004879; color: #ffffff; font-weight: bold; font-size: 11px; line-height: 28px; text-align: center; border: 1px solid #cbd5e1;">
                  ${initials}
                </div>
              </td>
              <td style="vertical-align: middle; font-size: 13px; font-weight: bold; color: #1e293b;">
                ${name}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Amount Credited:</td>
        <td align="right" style="font-size: 14px; font-weight: bold; color: #00875a; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">+$${formattedAmount} USD</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">New Available Balance:</td>
        <td align="right" style="font-size: 14px; font-weight: bold; color: #004879; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">$${formattedBalance} USD</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Reference Number:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #1e293b; font-family: monospace; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">${referenceId}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; padding: 11px 16px;">Transaction Status:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #00875a; padding: 11px 16px;">Settled &bull; Available for Use</td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
      These funds are now fully cleared and available for immediate allocation, investment, or active market execution in the trading terminal.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center" style="background-color: #004879; border-radius: 4px;">
          <a href="https://vantagecapital.website" style="display: inline-block; padding: 13px 32px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none;">Launch Trading Terminal</a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
      <tr>
        <td style="vertical-align: middle; padding-right: 12px;">
          <img src="https://vantagecapital.website/avatar.png" width="38" height="38" style="border-radius: 50%; border: 1.5px solid #cbd5e1; display: block;" alt="Desk Officer" />
        </td>
        <td style="vertical-align: middle;">
          <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e293b; font-family: Arial, sans-serif;">Treasury & Settlement Desk</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b; font-family: Arial, sans-serif;">Vantage Capital Technologies, Inc. &bull; McLean, VA</p>
        </td>
      </tr>
    </table>
  `;

  await sendEmail({
    to,
    subject,
    html: wrapHtml('Deposit Confirmed', 'Funds have settled and are now available in your balance', content),
    text: `Deposit Confirmed\n\nDear ${name},\nYour deposit of $${formattedAmount} USD has settled.\nNew Available Balance: $${formattedBalance} USD\nReference: ${referenceId}\nStatus: Settled & Completed\n\nAccess your account: https://vantagecapital.website`,
  });
}

/**
 * 4. Automated Withdrawal Request Email
 */
export async function sendWithdrawalRequestedEmail({ to, name, amount, referenceId, bankName, accountLast4 }) {
  const formattedAmount = Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const initials = getInitials(name);
  const subject = `Withdrawal Request Received — Ref: ${referenceId}`;
  const content = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Dear ${name},</p>
    <p style="margin: 0 0 20px 0;">
      We have received your withdrawal request. Your transaction has been logged and forwarded to our compliance and settlement department for standard security verification.
    </p>

    <!-- Withdrawal Details Table with Profile Avatar -->
    <table width="100%" cellpadding="11" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 24px;">
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 12px 16px; vertical-align: middle;">Account Holder:</td>
        <td align="right" style="border-bottom: 1px solid #e2e8f0; padding: 12px 16px; vertical-align: middle;">
          <table cellpadding="0" cellspacing="0" border="0" align="right">
            <tr>
              <td style="vertical-align: middle; padding-right: 8px;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #004879; color: #ffffff; font-weight: bold; font-size: 11px; line-height: 28px; text-align: center; border: 1px solid #cbd5e1;">
                  ${initials}
                </div>
              </td>
              <td style="vertical-align: middle; font-size: 13px; font-weight: bold; color: #1e293b;">
                ${name}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Requested Amount:</td>
        <td align="right" style="font-size: 14px; font-weight: bold; color: #b91c1c; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">-$${formattedAmount} USD</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Beneficiary Institution:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">${bankName || 'Designated Bank Account'}</td>
      </tr>
      ${accountLast4 ? `
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Beneficiary Account:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #1e293b; font-family: monospace; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">&bull;&bull;&bull;&bull; ${accountLast4}</td>
      </tr>` : ''}
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Reference Number:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #1e293b; font-family: monospace; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">${referenceId}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; padding: 11px 16px;">Current Status:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #b45309; padding: 11px 16px;">Compliance Verification &bull; In Progress</td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
      As part of our risk management and fraud prevention procedures, outbound wire disbursements are verified before transmission via Fedwire/ACH. You will receive an immediate confirmation once your wire transfer is dispatched.
    </p>

    <!-- Security Warning Box -->
    <table width="100%" cellpadding="14" cellspacing="0" border="0" style="background-color: #fbf7ee; border-left: 4px solid #d97706; border-radius: 2px; margin: 24px 0;">
      <tr>
        <td style="font-size: 12px; color: #78350f; line-height: 1.5; font-family: Arial, Helvetica, sans-serif;">
          <strong>Did not request this transaction?</strong> If you did not initiate this withdrawal, please lock your account immediately and contact our security desk at <a href="mailto:admin@vantagecapital.website" style="color: #78350f; text-decoration: underline;">admin@vantagecapital.website</a>.
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
      <tr>
        <td style="vertical-align: middle; padding-right: 12px;">
          <img src="https://vantagecapital.website/avatar.png" width="38" height="38" style="border-radius: 50%; border: 1.5px solid #cbd5e1; display: block;" alt="Desk Officer" />
        </td>
        <td style="vertical-align: middle;">
          <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e293b; font-family: Arial, sans-serif;">Client Risk & Compliance Operations</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b; font-family: Arial, sans-serif;">Vantage Capital Technologies, Inc. &bull; McLean, VA</p>
        </td>
      </tr>
    </table>
  `;

  await sendEmail({
    to,
    subject,
    html: wrapHtml('Withdrawal Request Queued', 'We are processing your capital disbursement request', content),
    text: `Withdrawal Request Received\n\nClient: ${name}\nAmount: $${formattedAmount} USD\nDestination Bank: ${bankName}\nReference: ${referenceId}\nStatus: Compliance Review\n\nPortal: https://vantagecapital.website`,
  });

  // Admin Notification
  await sendAdminAlert({
    subject: `[Action Required] New Withdrawal Request: $${formattedAmount} by ${name}`,
    title: 'Client Withdrawal Request Submitted',
    details: [
      { label: 'Client Name', value: name },
      { label: 'Amount', value: `$${formattedAmount} USD` },
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
  const formattedAmount = Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const initials = getInitials(name);
  const subject = `Wire Dispatched: $${formattedAmount} USD sent to your bank`;
  const content = `
    <p style="margin: 0 0 16px 0; font-size: 15px;">Dear ${name},</p>
    <p style="margin: 0 0 20px 0;">
      We are writing to confirm that your withdrawal request has been approved, settled, and dispatched via domestic bank wire to your designated beneficiary account.
    </p>

    <!-- Dispatched Details Table with Profile Avatar -->
    <table width="100%" cellpadding="11" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 24px;">
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 12px 16px; vertical-align: middle;">Account Holder:</td>
        <td align="right" style="border-bottom: 1px solid #e2e8f0; padding: 12px 16px; vertical-align: middle;">
          <table cellpadding="0" cellspacing="0" border="0" align="right">
            <tr>
              <td style="vertical-align: middle; padding-right: 8px;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #004879; color: #ffffff; font-weight: bold; font-size: 11px; line-height: 28px; text-align: center; border: 1px solid #cbd5e1;">
                  ${initials}
                </div>
              </td>
              <td style="vertical-align: middle; font-size: 13px; font-weight: bold; color: #1e293b;">
                ${name}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Dispatched Amount:</td>
        <td align="right" style="font-size: 14px; font-weight: bold; color: #00875a; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">$${formattedAmount} USD</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Beneficiary Institution:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">${bankName || 'Designated Bank Account'}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">Wire Reference:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #1e293b; font-family: monospace; border-bottom: 1px solid #e2e8f0; padding: 11px 16px;">${referenceId}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #64748b; padding: 11px 16px;">Disbursement Status:</td>
        <td align="right" style="font-size: 13px; font-weight: bold; color: #00875a; padding: 11px 16px;">Dispatched &bull; Completed</td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
      Depending on your receiving financial institution's wire posting schedule, funds typically reflect in your account within 1 to 24 business hours. Please retain the wire reference number above for any inquiries with your bank.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center" style="background-color: #004879; border-radius: 4px;">
          <a href="https://vantagecapital.website" style="display: inline-block; padding: 13px 32px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none;">View Account Statement</a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
      <tr>
        <td style="vertical-align: middle; padding-right: 12px;">
          <img src="https://vantagecapital.website/avatar.png" width="38" height="38" style="border-radius: 50%; border: 1.5px solid #cbd5e1; display: block;" alt="Desk Officer" />
        </td>
        <td style="vertical-align: middle;">
          <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e293b; font-family: Arial, sans-serif;">Treasury & Wire Disbursements</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b; font-family: Arial, sans-serif;">Vantage Capital Technologies, Inc. &bull; McLean, VA</p>
        </td>
      </tr>
    </table>
  `;

  await sendEmail({
    to,
    subject,
    html: wrapHtml('Wire Transfer Dispatched', 'Funds have been wired to your bank account', content),
    text: `Wire Dispatched!\n\nDear ${name},\nYour payout of $${formattedAmount} USD has been dispatched to ${bankName}.\nWire Reference: ${referenceId}\nStatus: Dispatched &bull; Completed\n\nPortal: https://vantagecapital.website`,
  });
}

/**
 * 6. Internal Admin Security & Operations Alert
 */
export async function sendAdminAlert({ subject, title, details = [], actionUrl }) {
  const rows = details.map(d => `
    <tr>
      <td style="font-size: 13px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 10px 14px;">${d.label}:</td>
      <td align="right" style="font-size: 13px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding: 10px 14px;">${d.value}</td>
    </tr>
  `).join('');

  const content = `
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155;">An institutional operational event requires administrator review:</p>
    
    <table width="100%" cellpadding="10" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 24px;">
      ${rows}
    </table>

    ${actionUrl ? `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center" style="background-color: #004879; border-radius: 4px;">
          <a href="${actionUrl}" style="display: inline-block; padding: 12px 28px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: bold; color: #ffffff; text-decoration: none;">Open Admin Portal</a>
        </td>
      </tr>
    </table>` : ''}
  `;

  await sendEmail({
    to: ADMIN_ALERT_EMAIL,
    subject,
    html: wrapHtml(title, 'Internal Operations Alert', content),
    text: `${title}\n\n` + details.map(d => `${d.label}: ${d.value}`).join('\n') + `\n\nAdmin Portal: https://vantagecapital.website/admin`,
  });
}
