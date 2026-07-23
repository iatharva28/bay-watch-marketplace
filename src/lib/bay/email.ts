import { Resend } from "resend";

/**
 * BAY Email Service (Resend)
 *
 * Resend is a modern email API with React Email template support.
 * Free tier: 3,000 emails/month.
 *
 * All emails come from care@baymaison.in (or EMAIL_FROM env var).
 * Templates are in src/emails/
 */

let resendInstance: Resend | null = null;

export function getResend(): Resend {
  if (resendInstance) return resendInstance;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY not configured. Set it in .env.local"
    );
  }

  resendInstance = new Resend(apiKey);
  return resendInstance;
}

type EmailParams = {
  to: string;
  subject: string;
  html: string;
  from?: string; // optional override
};

export async function sendEmail({ to, subject, html, from }: EmailParams) {
  const resend = getResend();

  // Use verified sender if available, otherwise fall back to Resend's default
  // Resend requires verified domain for custom from addresses
  const defaultFrom = process.env.EMAIL_FROM || "BAY Maison <care@baymaison.in>";
  const fallbackFrom = "BAY Maison <onboarding@resend.dev>";
  const sender = from || defaultFrom;

  // For unverified domains, use Resend's testing sender
  // In production with verified domain, use the custom sender
  const useFallback = !process.env.EMAIL_DOMAIN_VERIFIED && sender.includes("baymaison.in");
  const finalFrom = useFallback ? fallbackFrom : sender;

  if (useFallback) {
    console.warn("[email] Domain not verified, using fallback sender:", fallbackFrom);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: finalFrom,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Email send failed:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}

/**
 * Send an order confirmation email.
 * In Phase 2, this will use a React Email template.
 * For now, a clean HTML template that matches the BAY aesthetic.
 */
export async function sendOrderConfirmationEmail(
  to: string,
  orderNumber: string,
  total: string,
  items: { name: string; ref: string; quantity: number; price: string }[]
) {
  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #1f2228;">
            <strong style="color:#F2F2EF;font-family:Georgia,serif;font-size:18px;font-weight:300;">${item.name}</strong><br>
            <span style="color:#6E7178;font-family:monospace;font-size:11px;letter-spacing:0.08em;">${item.ref} · Qty ${item.quantity}</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #1f2228;text-align:right;color:#C9CACF;font-family:monospace;font-size:14px;">
            ${item.price}
          </td>
        </tr>
      `
    )
    .join("");

  const html = `
    <div style="background:#08090B;padding:40px 20px;font-family:Inter,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#0C0D10;border:1px solid #1f2228;padding:40px;">
        <div style="text-align:center;margin-bottom:40px;">
          <h1 style="color:#F2F2EF;font-family:Georgia,serif;font-size:36px;font-weight:300;letter-spacing:0.3em;margin:0;">BAY</h1>
          <p style="color:#6E7178;font-family:monospace;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;margin-top:8px;">Maison Horlogère</p>
        </div>

        <p style="color:#C8CCD3;font-family:monospace;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;">Order Confirmed</p>
        <h2 style="color:#F2F2EF;font-family:Georgia,serif;font-size:28px;font-weight:300;margin:8px 0 24px;">Thank you for your order</h2>

        <p style="color:#C9CACF;font-size:15px;line-height:1.7;margin-bottom:32px;">
          A BAY private client advisor will contact you within 24 hours to arrange insured delivery and confirm your appointment.
        </p>

        <div style="background:#08090B;padding:16px;margin-bottom:32px;">
          <p style="color:#6E7178;font-family:monospace;font-size:11px;letter-spacing:0.08em;margin:0 0 4px;">Order Number</p>
          <p style="color:#C8CCD3;font-family:monospace;font-size:16px;margin:0;">${orderNumber}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;">
          ${itemsHtml}
        </table>

        <div style="margin-top:24px;padding-top:24px;border-top:1px solid #1f2228;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#6E7178;font-size:13px;">Total (incl. GST + TCS)</span>
            <span style="color:#F2F2EF;font-family:Georgia,serif;font-size:24px;font-weight:300;">${total}</span>
          </div>
        </div>

        <div style="margin-top:40px;padding-top:24px;border-top:1px solid #1f2228;text-align:center;">
          <p style="color:#3F4248;font-family:monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;margin:0;">
            Designed in Mumbai · Made in Switzerland
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Order Confirmed — ${orderNumber}`,
    html,
  });
}

/**
 * Send a payout notification to a seller.
 */
export async function sendPayoutEmail(
  to: string,
  payoutId: string,
  amount: string,
  period: string
) {
  const html = `
    <div style="background:#08090B;padding:40px 20px;font-family:Inter,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#0C0D10;border:1px solid #1f2228;padding:40px;">
        <div style="text-align:center;margin-bottom:40px;">
          <h1 style="color:#F2F2EF;font-family:Georgia,serif;font-size:36px;font-weight:300;letter-spacing:0.3em;margin:0;">BAY</h1>
          <p style="color:#6E7178;font-family:monospace;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;margin-top:8px;">Seller Portal</p>
        </div>

        <p style="color:#C8CCD3;font-family:monospace;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;">Payout Processed</p>
        <h2 style="color:#F2F2EF;font-family:Georgia,serif;font-size:28px;font-weight:300;margin:8px 0 24px;">Your payout has been sent</h2>

        <p style="color:#C9CACF;font-size:15px;line-height:1.7;margin-bottom:32px;">
          Your settlement for ${period} has been transferred to your registered bank account.
        </p>

        <div style="background:#08090B;padding:16px;margin-bottom:32px;">
          <p style="color:#6E7178;font-family:monospace;font-size:11px;letter-spacing:0.08em;margin:0 0 4px;">Net Payout</p>
          <p style="color:#C8CCD3;font-family:monospace;font-size:20px;margin:0;">${amount}</p>
        </div>

        <p style="color:#6E7178;font-size:13px;line-height:1.6;">
          Payout ID: ${payoutId}<br>
          Please allow 1-2 business days for the transfer to reflect in your account.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Payout Processed — ${amount}`,
    html,
  });
}