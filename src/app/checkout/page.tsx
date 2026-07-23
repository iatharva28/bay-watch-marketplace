"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/bay/cart-store";
import { formatInrFull, formatInr } from "@/lib/bay/data";
import WatchFace from "@/components/marketplace/WatchFace";
import { ScrollReveal } from "@/components/bay/ScrollReveal";
import { cn } from "@/lib/utils";

/**
 * BAY /checkout — a three-step checkout:
 *   1. Shipping address (India only for MVP)
 *   2. Payment method (Razorpay placeholder, UPI, Card, Net Banking)
 *   3. Review + place order
 *
 * On order placement: clears the cart, shows a confirmation screen
 * with a generated order number. (No backend yet — this is the
 * frontend MVP. Backend integration happens in Phase 2.)
 */

type Step = 1 | 2 | 3 | "complete";

const STEPS = [
  { id: 1 as const, label: "Shipping" },
  { id: 2 as const, label: "Payment" },
  { id: 3 as const, label: "Review" },
] as const;

function isStepComplete(step: Step, stepId: number): boolean {
  return (typeof step === "number" && step > stepId) || step === "complete";
}

const PAYMENT_METHODS = [
  { id: "razorpay", label: "Razorpay", note: "UPI, Cards, Net Banking, Wallets" },
  { id: "upi", label: "UPI Direct", note: "GPay, PhonePe, Paytm, BHIM" },
  { id: "card", label: "Credit / Debit Card", note: "Visa, Mastercard, RuPay, Amex" },
  { id: "netbanking", label: "Net Banking", note: "All major Indian banks" },
  { id: "emi", label: "EMI", note: "Available on cards above ₹50,000" },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu",
  "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, gstAmount, tcsAmount, total, clear } = useCartStore();
  const [step, setStep] = useState<Step>(1);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressId, setAddressId] = useState<string>("");
  const [shipping, setShipping] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });

  // Empty cart guard
  if (items.length === 0 && step !== "complete") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-32 text-center">
        <div className="eyebrow mb-4">Checkout</div>
        <h1 className="display-2 text-[var(--text)] mb-4">
          Nothing to <span className="italic-serif text-[var(--platinum)]">checkout</span>
        </h1>
        <p className="body-lg mb-8">
          Your cart is empty. Add a piece to proceed.
        </p>
        <Link href="/shop" className="btn-bay btn-bay-solid">
          <span>Explore the Collection</span>
        </Link>
      </div>
    );
  }

  const placeOrder = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // 0. Create or reuse the shipping address
      let finalAddressId = addressId;

      if (!finalAddressId) {
        // Create a new address from the form data
        const addrRes = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: shipping.fullName,
            phone: shipping.phone,
            line1: shipping.address,
            city: shipping.city,
            state: shipping.state,
            pincode: shipping.pincode,
            notes: shipping.notes || undefined,
            isDefault: true,
          }),
        });

        if (!addrRes.ok) {
          const data = await addrRes.json();
          throw new Error(data.error || "Failed to save address");
        }

        const addrData = await addrRes.json();
        finalAddressId = addrData.id;
      }

      // 1. Create the order(s) + Razorpay order on the server
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: finalAddressId,
          paymentMethod,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceInr: item.priceInr,
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            sellerType: item.sellerType,
            name: item.name,
            ref: item.ref,
            slug: item.slug,
            dialColor: item.dialColor,
            caseFinish: item.caseFinish,
            complicationType: item.complicationType,
            limited: item.limited,
            shipsInDays: item.shipsInDays,
            warrantyMonths: item.warrantyMonths,
          })),
        }),
      });

      if (!checkoutRes.ok) {
        const data = await checkoutRes.json();
        throw new Error(data.error || "Failed to create order");
      }

      const checkoutData = await checkoutRes.json();

      // 2. Check if Razorpay is configured (test/production)
      if (!checkoutData.razorpayKeyId) {
        throw new Error("Payment gateway not configured. Contact support.");
      }

      // 3. Open the Razorpay Checkout popup
      const razorpay = (window as any).Razorpay;
      if (!razorpay) {
        // Load the Razorpay script if not already loaded
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const RazorpayInstance = (window as any).Razorpay;
            const rzp = new RazorpayInstance({
              key: checkoutData.razorpayKeyId,
              amount: checkoutData.amount,
              currency: checkoutData.currency,
              name: "BAY Maison",
              description: `Order ${checkoutData.orderNumber}`,
              order_id: checkoutData.razorpayOrderId,
              prefill: {
                name: checkoutData.customerName,
                email: checkoutData.customerEmail,
                contact: checkoutData.customerPhone,
              },
              theme: {
                color: "#08090B",
              },
              modal: {
                ondismiss: () => {
                  setSubmitting(false);
                  setError("Payment cancelled. Your cart is safe — try again when ready.");
                },
              },
              // Use standard handler instead of event listeners
              handler: async (response: any) => {
                // DEBUG: log what Razorpay returns
                console.log("[checkout] Razorpay handler response:", response);
                // 4. Verify the payment on the server
                try {
                  // Handle different possible field names from Razorpay
                  const orderId = response.razorpay_order_id ?? response.order_id;
                  const paymentId = response.razorpay_payment_id ?? response.payment_id;
                  const signature = response.razorpay_signature ?? response.signature;

                  console.log("[checkout] Extracted:", { orderId, paymentId, signature });

                  if (!orderId || !paymentId || !signature) {
                    throw new Error("Razorpay response missing required fields: " + JSON.stringify(response));
                  }

                  const verifyRes = await fetch("/api/checkout/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      razorpayOrderId: orderId,
                      razorpayPaymentId: paymentId,
                      razorpaySignature: signature,
                    }),
                  });

                  if (!verifyRes.ok) {
                    const data = await verifyRes.json();
                    throw new Error(data.error || "Payment verification failed");
                  }

                  const verifyData = await verifyRes.json();
                  setOrderNumber(verifyData.orderNumber);
                  clear();
                  setStep("complete");
                } catch (err: any) {
                  setSubmitting(false);
                  setError(
                    err.message ||
                      "Payment was processed but verification failed. Please contact support with your payment ID."
                  );
                }
              },
            });

            rzp.open();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || "Something went wrong. Please try again.");
    }
  };

  if (step === "complete") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-20 h-20 rounded-full border border-[var(--platinum)] flex items-center justify-center mx-auto mb-8">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M8 16l5 5 11-11"
                stroke="var(--platinum)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="eyebrow-platinum mb-4">Order Confirmed</div>
          <h1 className="display-2 text-[var(--text)] mb-4">
            Thank you for <span className="italic-serif text-[var(--platinum)]">your order</span>
          </h1>
          <p className="body-lg mb-8">
            A BAY private client advisor will contact you within 24 hours
            to arrange insured delivery and confirm your appointment.
          </p>
          <div className="surface-elevated p-6 mb-8">
            <div className="spec-mono mb-2">Order Number</div>
            <div className="font-mono text-lg text-[var(--platinum)]">
              {orderNumber}
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/shop" className="btn-bay">
              <span>Continue Shopping</span>
            </Link>
            <Link href="/account" className="btn-bay btn-bay-solid">
              <span>View Order</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 lg:py-20">
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-6">
          <span className="section-num">/checkout</span>
          <span className="w-12 h-px bg-[var(--hairline)]" />
          <span className="eyebrow">Secure Checkout</span>
        </div>
        <h1 className="display-2 text-[var(--text)] mb-12">
          <span className="italic-serif text-[var(--platinum)]">Checkout</span>
        </h1>
      </ScrollReveal>

      {/* Step indicator */}
      <div className="flex items-center gap-4 mb-12">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs transition-colors",
                  step === s.id
                    ? "border-[var(--platinum)] text-[var(--platinum)]"
                    : isStepComplete(step, s.id)
                      ? "border-[var(--platinum)] bg-[var(--platinum)] text-[var(--bg)]"
                      : "border-[var(--hairline-strong)] text-[var(--text-muted)]"
                )}
              >
                {isStepComplete(step, s.id) ? "✓" : s.id}
              </span>
              <span
                className={cn(
                  "text-xs font-mono uppercase tracking-[0.18em] transition-colors",
                  step === s.id ? "text-[var(--text)]" : "text-[var(--text-muted)]"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="w-12 h-px bg-[var(--hairline)]" />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-12">
        {/* Form area */}
        <div>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="font-display text-3xl font-light mb-2">
                  Shipping address
                </h2>
                <p className="body-md mb-8">
                  India only for now. International shipping coming soon.
                </p>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field
                      label="Full Name"
                      value={shipping.fullName}
                      onChange={(v) => setShipping({ ...shipping, fullName: v })}
                      required
                    />
                    <Field
                      label="Phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={shipping.phone}
                      onChange={(v) => setShipping({ ...shipping, phone: v })}
                      required
                    />
                  </div>
                  <Field
                    label="Email"
                    type="email"
                    value={shipping.email}
                    onChange={(v) => setShipping({ ...shipping, email: v })}
                    required
                  />
                  <Field
                    label="Address"
                    placeholder="House no, Street, Area"
                    value={shipping.address}
                    onChange={(v) => setShipping({ ...shipping, address: v })}
                    required
                  />
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field
                      label="City"
                      value={shipping.city}
                      onChange={(v) => setShipping({ ...shipping, city: v })}
                      required
                    />
                    <div>
                      <label className="spec-mono block mb-2">State</label>
                      <select
                        value={shipping.state}
                        onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                        className="w-full bg-transparent border border-[var(--hairline-strong)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--platinum)] transition-colors"
                      >
                        <option value="" className="bg-[var(--bg)]">
                          Select state
                        </option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s} className="bg-[var(--bg)]">
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Field
                      label="PIN Code"
                      value={shipping.pincode}
                      onChange={(v) => setShipping({ ...shipping, pincode: v })}
                      required
                    />
                  </div>
                  <div>
                    <label className="spec-mono block mb-2">
                      Delivery Notes (optional)
                    </label>
                    <textarea
                      value={shipping.notes}
                      onChange={(e) => setShipping({ ...shipping, notes: e.target.value })}
                      rows={3}
                      placeholder="Gate code, preferred time, etc."
                      className="w-full bg-transparent border border-[var(--hairline-strong)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--platinum)] transition-colors resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <Link href="/cart" className="btn-bay">
                    <span>Back to Cart</span>
                  </Link>
                  <button
                    onClick={() => setStep(2)}
                    disabled={
                      !shipping.fullName ||
                      !shipping.email ||
                      !shipping.phone ||
                      !shipping.address ||
                      !shipping.city ||
                      !shipping.state ||
                      !shipping.pincode
                    }
                    className={cn(
                      "btn-bay btn-bay-solid",
                      (!shipping.fullName ||
                        !shipping.email ||
                        !shipping.phone ||
                        !shipping.address ||
                        !shipping.city ||
                        !shipping.state ||
                        !shipping.pincode) &&
                        "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <span>Continue to Payment</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="font-display text-3xl font-light mb-2">
                  Payment method
                </h2>
                <p className="body-md mb-8">
                  All payments are processed securely via Razorpay.
                  BAY never stores your card details.
                </p>

                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={cn(
                        "block p-5 border cursor-pointer transition-colors",
                        paymentMethod === method.id
                          ? "border-[var(--platinum)] bg-[var(--surface-1)]"
                          : "border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center",
                              paymentMethod === method.id
                                ? "border-[var(--platinum)]"
                                : "border-[var(--hairline-strong)]"
                            )}
                          >
                            {paymentMethod === method.id && (
                              <span className="w-2 h-2 rounded-full bg-[var(--platinum)]" />
                            )}
                          </span>
                          <div>
                            <div className="font-display text-lg font-light">
                              {method.label}
                            </div>
                            <div className="spec-mono">{method.note}</div>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="payment"
                          className="sr-only"
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                        />
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(1)} className="btn-bay">
                    <span>Back</span>
                  </button>
                  <button onClick={() => setStep(3)} className="btn-bay btn-bay-solid">
                    <span>Review Order</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="font-display text-3xl font-light mb-2">
                  Review and confirm
                </h2>
                <p className="body-md mb-8">
                  Please review your order before placing it.
                </p>

                {/* Shipping review */}
                <div className="surface p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="eyebrow-platinum">Shipping To</div>
                    <button
                      onClick={() => setStep(1)}
                      className="spec-mono hover:text-[var(--platinum)] transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="font-display text-lg font-light">
                    {shipping.fullName}
                  </div>
                  <div className="body-md mt-1">
                    {shipping.address}
                    <br />
                    {shipping.city}, {shipping.state} {shipping.pincode}
                    <br />
                    {shipping.phone} · {shipping.email}
                  </div>
                </div>

                {/* Payment review */}
                <div className="surface p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="eyebrow-platinum">Payment Method</div>
                    <button
                      onClick={() => setStep(2)}
                      className="spec-mono hover:text-[var(--platinum)] transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="font-display text-lg font-light">
                    {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}
                  </div>
                  <div className="spec-mono mt-1">
                    {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.note}
                  </div>
                </div>

                {/* Items review */}
                <div className="surface p-6 mb-8">
                  <div className="eyebrow-platinum mb-4">Items ({items.length})</div>
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li key={item.productId} className="flex items-center gap-4">
                        <div className="w-14 h-14 shrink-0 surface flex items-center justify-center">
                          <WatchFace
                            dialColor={item.dialColor}
                            caseFinish={item.caseFinish}
                            complicationType={item.complicationType}
                            size={48}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-lg font-light truncate">
                            {item.name}
                          </div>
                          <div className="spec-mono">
                            {item.ref} · Qty {item.quantity} · {item.sellerName}
                          </div>
                        </div>
                        <div className="font-mono text-sm text-[var(--text)]">
                          {formatInrFull(item.priceInr * item.quantity)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {error && (
                  <div className="p-4 border border-[var(--steel)] text-[var(--ice)] body-md">
                    {error}
                  </div>
                )}

                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="btn-bay" disabled={submitting}>
                    <span>Back</span>
                  </button>
                  <button
                    onClick={placeOrder}
                    disabled={submitting}
                    className="btn-bay btn-bay-solid"
                  >
                    <span>{submitting ? "Processing..." : `Place Order — ${formatInr(total())}`}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary — sticky */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="surface-elevated p-8">
            <div className="eyebrow-platinum mb-6">Order Summary</div>

            <ul className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <div className="w-12 h-12 shrink-0 surface flex items-center justify-center">
                    <WatchFace
                      dialColor={item.dialColor}
                      caseFinish={item.caseFinish}
                      complicationType={item.complicationType}
                      size={40}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-sm font-light truncate">
                      {item.name} × {item.quantity}
                    </div>
                    <div className="spec-mono truncate">{item.sellerName}</div>
                  </div>
                  <div className="font-mono text-xs text-[var(--text-soft)]">
                    {formatInrFull(item.priceInr * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="h-px bg-[var(--hairline)] my-4" />

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--text-soft)]">Subtotal (incl. GST)</dt>
                <dd className="font-mono text-[var(--text)]">
                  {formatInrFull(subtotal())}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-soft)]">of which GST</dt>
                <dd className="font-mono text-[var(--text-muted)]">
                  {formatInrFull(gstAmount())}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-soft)]">TCS (1%)</dt>
                <dd className="font-mono text-[var(--text-muted)]">
                  {formatInrFull(tcsAmount())}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-soft)]">Shipping</dt>
                <dd className="font-mono text-[var(--platinum)]">Free</dd>
              </div>
            </dl>

            <div className="h-px bg-[var(--hairline)] my-4" />

            <div className="flex justify-between items-baseline">
              <span className="font-display text-lg">Total</span>
              <span className="font-display text-2xl font-light text-[var(--text)]">
                {formatInr(total())}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="spec-mono block mb-2">
        {label}
        {required && <span className="text-[var(--platinum)] ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-transparent border border-[var(--hairline-strong)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--platinum)] transition-colors"
      />
    </div>
  );
}