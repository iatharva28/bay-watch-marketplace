import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * BAY Razorpay Integration
 *
 * Razorpay is India's standard payment gateway. Supports UPI,
 * cards, net banking, wallets, and EMI.
 *
 * Flow:
 *   1. POST /api/checkout → create Razorpay Order, return orderId
 *   2. Client opens Razorpay Checkout (popup) with the orderId
 *   3. Customer pays → Razorpay returns paymentId + signature
 *   4. POST /api/checkout/verify → verify signature, capture payment
 *   5. Webhook /api/webhooks/razorpay → async payment status updates
 *
 * Test mode: use test cards from https://razorpay.com/docs/payments/test-cards/
 * Production: switch from rzp_test_* to rzp_live_* keys
 */

let razorpayInstance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (razorpayInstance) return razorpayInstance;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local"
    );
  }

  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpayInstance;
}

/**
 * Create a Razorpay Order.
 * The amount is in paise (Razorpay's smallest unit).
 */
export async function createRazorpayOrder(
  amountInr: number, // in paise
  orderNumber: string,
  notes?: Record<string, string>
) {
  const razorpay = getRazorpay();

  const order = await razorpay.orders.create({
    amount: amountInr,
    currency: "INR",
    receipt: orderNumber,
    notes: {
      bay_order_number: orderNumber,
      ...notes,
    },
  });

  return order;
}

/**
 * Verify the Razorpay payment signature.
 * This is the CRITICAL security check — without it, anyone could
 * forge a payment confirmation.
 *
 * Signature = HMAC_SHA256(razorpayOrderId + "|" + razorpayPaymentId, keySecret)
 */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET not configured");
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex")
  );
}

/**
 * Fetch a payment's details from Razorpay (for webhook verification).
 */
export async function fetchPayment(paymentId: string) {
  const razorpay = getRazorpay();
  return razorpay.payments.fetch(paymentId);
}

/**
 * Initiate a refund for a payment.
 */
export async function refundPayment(
  paymentId: string,
  amountInr: number, // in paise
  notes?: Record<string, string>
) {
  const razorpay = getRazorpay();
  return razorpay.payments.refund(paymentId, {
    amount: amountInr,
    notes: {
      bay_refund_reason: "Customer request",
      ...notes,
    },
  });
}
