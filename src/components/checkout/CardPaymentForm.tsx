"use client";

import { FormEvent, useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { formatGBP } from "@/lib/pricing";

interface CardPaymentFormProps {
  total: number;
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
}

/** Card-only payment step — Apple Pay / Google Pay are handled separately via PaymentMethodSection's own Payment Request flow. */
export default function CardPaymentForm({ total, onSuccess, onBack }: CardPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Please check your payment details.");
      setSubmitting(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/confirmation` },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        await fetch("/api/confirm-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });
      } catch {
        // Non-fatal — the Stripe webhook (if configured) is the authoritative path.
      }
      onSuccess(paymentIntent.id);
    } else {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="tap-press rounded-full border border-stone-300 px-5 py-3 font-medium text-stone-700"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="tap-press flex-1 rounded-full bg-[#A61400] px-6 py-3 font-semibold text-white shadow-lg disabled:opacity-50"
        >
          {submitting ? "Processing…" : `Pay ${formatGBP(total)}`}
        </button>
      </div>
    </form>
  );
}
