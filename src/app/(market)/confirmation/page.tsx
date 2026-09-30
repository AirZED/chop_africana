"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { restaurant } from "@/lib/menu-data";

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectStatus = searchParams.get("redirect_status");
  const paymentIntent = searchParams.get("payment_intent");
  const failed = redirectStatus !== null && redirectStatus !== "succeeded";

  const fulfillment = useCartStore((s) => s.fulfillment);
  const table = useCartStore((s) => s.table);
  const fullName = useCartStore((s) => s.fullName);
  const address = useCartStore((s) => s.address);
  const clearCart = useCartStore((s) => s.clearCart);
  const clearAll = useCartStore((s) => s.clearAll);

  useEffect(() => {
    // Only redirect-based payment methods land here with these query params —
    // the in-page card/wallet flow already cleared the cart before navigating.
    if (redirectStatus === "succeeded" && paymentIntent) {
      clearCart();
      fetch("/api/confirm-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent }),
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectStatus, paymentIntent]);

  if (failed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="text-5xl">⚠️</span>
        <h1 className="text-xl font-bold text-stone-900">Payment didn&apos;t go through</h1>
        <p className="text-stone-500">Please check your payment details and try again.</p>
        <button
          onClick={() => router.push("/checkout")}
          className="tap-press rounded-full bg-[#A61400] px-6 py-3 font-semibold text-white shadow-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  const orderNumber = (paymentIntent ?? "").slice(-6).toUpperCase() || "PENDING";
  const finalFulfillment = table ? "dine-in" : fulfillment;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-24 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-4xl shadow-lg">
        ✓
      </span>
      <div>
        <h1 className="font-serif text-2xl font-semibold text-stone-900">Order Confirmed!</h1>
        <p className="mt-2 text-stone-500">
          {restaurant.name} has received order #{orderNumber}.
        </p>
      </div>

      <div className="w-full max-w-xs rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm">
        {finalFulfillment === "dine-in" && (
          <p className="text-stone-700">
            We&apos;ll bring your food to <span className="font-semibold">Table {table}</span>.
          </p>
        )}
        {finalFulfillment === "pickup" && (
          <p className="text-stone-700">
            Thanks{fullName ? `, ${fullName}` : ""}! Your order will be ready for pickup at{" "}
            <span className="font-semibold">{restaurant.address}</span> in about {restaurant.pickupMinutes} minutes.
          </p>
        )}
        {finalFulfillment === "delivery" && (
          <p className="text-stone-700">
            Heading to <span className="font-semibold">{address || "your address"}</span> in about 30–50 minutes.
          </p>
        )}
      </div>

      <button
        onClick={() => {
          clearAll();
          router.push("/menu");
        }}
        className="tap-press w-full max-w-xs rounded-full bg-[#A61400] px-6 py-3 font-semibold text-white shadow-lg"
      >
        Start a New Order
      </button>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationContent />
    </Suspense>
  );
}
