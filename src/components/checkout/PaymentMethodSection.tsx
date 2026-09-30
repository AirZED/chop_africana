"use client";

import { useEffect, useRef, useState } from "react";
import type { PaymentRequest, Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { getStripeClient } from "@/lib/stripe-client";
import CardPaymentForm from "./CardPaymentForm";

type Method = "applePay" | "googlePay" | "card";

interface CreateIntentResult {
  clientSecret: string;
  total: number;
}

interface PaymentMethodSectionProps {
  total: number;
  disabled: boolean;
  /** Validates the earlier steps and creates the PaymentIntent server-side. Returns null (and sets its own error) on failure. */
  onCreateIntent: () => Promise<CreateIntentResult | null>;
  onSuccess: (paymentIntentId: string) => void;
}

const METHOD_META: Record<Method, { label: string; icon: React.ReactNode }> = {
  applePay: {
    label: "Apple Pay",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M16.5 3.5c-.9 1.1-2.3 1.9-3.7 1.8-.2-1.4.5-2.8 1.3-3.7.9-1.1 2.4-1.9 3.6-2 .1 1.5-.4 2.9-1.2 3.9Zm1.2 1.9c-2-.1-3.7 1.1-4.7 1.1-1 0-2.4-1.1-4-1-2 0-3.9 1.2-4.9 3-2.1 3.6-.5 9 1.5 12 1 1.4 2.1 3 3.7 3 1.4-.1 2-.9 3.7-.9 1.7 0 2.2.9 3.7.9 1.6 0 2.6-1.4 3.6-2.9 1.1-1.6 1.6-3.2 1.6-3.3-.1 0-3.1-1.2-3.1-4.6 0-2.9 2.3-4.2 2.4-4.3-1.3-1.9-3.3-2.1-4-2.1Z" />
      </svg>
    ),
  },
  googlePay: {
    label: "Google Pay",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5">
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.6Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24Z"
        />
        <path fill="#FBBC05" d="M5.4 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.4A12 12 0 0 0 0 12c0 1.9.5 3.8 1.4 5.4l4-3.1Z" />
        <path
          fill="#EA4335"
          d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.6l4 3.1c.9-2.8 3.5-4.9 6.6-4.9Z"
        />
      </svg>
    ),
  },
  card: {
    label: "Debit or credit card",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-5">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
};

export default function PaymentMethodSection({ total, disabled, onCreateIntent, onSuccess }: PaymentMethodSectionProps) {
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [available, setAvailable] = useState<Record<Method, boolean>>({ applePay: false, googlePay: false, card: true });
  const [method, setMethod] = useState<Method>("card");
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [phase, setPhase] = useState<"select" | "card" | "processing">("select");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientSecretRef = useRef<string | null>(null);

  useEffect(() => {
    getStripeClient().then((s) => setStripeInstance(s));
  }, []);

  useEffect(() => {
    if (!stripeInstance || total <= 0) return;
    const pr = stripeInstance.paymentRequest({
      country: "GB",
      currency: "gbp",
      total: { label: "Chop Africana", amount: Math.round(total * 100) },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.on("paymentmethod", async (ev) => {
      const cs = clientSecretRef.current;
      if (!cs || !stripeInstance) {
        ev.complete("fail");
        return;
      }
      const { error: confirmError, paymentIntent } = await stripeInstance.confirmCardPayment(
        cs,
        { payment_method: ev.paymentMethod.id },
        { handleActions: false }
      );
      if (confirmError) {
        ev.complete("fail");
        setError(confirmError.message ?? "Payment failed. Please try again.");
        setPhase("select");
        return;
      }
      ev.complete("success");

      if (paymentIntent.status === "requires_action") {
        const { error: actionError } = await stripeInstance.confirmCardPayment(cs);
        if (actionError) {
          setError(actionError.message ?? "Payment failed. Please try again.");
          setPhase("select");
          return;
        }
      }

      await fetch("/api/confirm-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      }).catch(() => {});
      onSuccess(paymentIntent.id);
    });

    pr.canMakePayment().then((result) => {
      const applePay = !!result?.applePay;
      const googlePay = !!result?.googlePay;
      setAvailable({ applePay, googlePay, card: true });
      setMethod(applePay ? "applePay" : googlePay ? "googlePay" : "card");
      setPaymentRequest(pr);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripeInstance, total]);

  async function handleContinue() {
    setError(null);
    setPhase("processing");
    const result = await onCreateIntent();
    if (!result) {
      setPhase("select");
      return;
    }
    clientSecretRef.current = result.clientSecret;
    setClientSecret(result.clientSecret);

    if (method === "card") {
      setPhase("card");
      return;
    }

    if (!paymentRequest) {
      setError("This payment method isn't available. Please choose another.");
      setPhase("select");
      return;
    }
    paymentRequest.show();
    setPhase("select");
  }

  if (phase === "card" && clientSecret) {
    return (
      <Elements
        stripe={getStripeClient()}
        options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#A61400", borderRadius: "10px" } } }}
      >
        <CardPaymentForm total={total} onSuccess={onSuccess} onBack={() => setPhase("select")} />
      </Elements>
    );
  }

  const methods: Method[] = (["applePay", "googlePay", "card"] as Method[]).filter((m) => available[m]);

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-2">
        {methods.map((m) => (
          <label
            key={m}
            className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3.5 ${
              method === m ? "border-stone-900" : "border-stone-200"
            }`}
          >
            <span className="flex items-center gap-3 font-medium text-stone-900">
              {METHOD_META[m].icon}
              {METHOD_META[m].label}
            </span>
            <span
              className={`flex size-5 items-center justify-center rounded-full border-2 ${
                method === m ? "border-[#A61400]" : "border-stone-300"
              }`}
            >
              {method === m && <span className="size-2.5 rounded-full bg-[#A61400]" />}
            </span>
            <input
              type="radio"
              name="payment-method"
              className="sr-only"
              checked={method === m}
              onChange={() => setMethod(m)}
            />
          </label>
        ))}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={handleContinue}
        disabled={disabled || phase === "processing"}
        className="tap-press mt-5 w-full rounded-full bg-[#A61400] px-6 py-3.5 font-semibold text-white shadow-lg disabled:opacity-50"
      >
        {phase === "processing" ? "Preparing…" : "Continue to payment"}
      </button>
    </div>
  );
}
