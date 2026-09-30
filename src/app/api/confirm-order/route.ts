import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { markOrderStatus } from "@/lib/order-service";

// Fallback confirmation path for local/dev environments where a Stripe webhook
// listener isn't running. The client calls this right after stripe.confirmPayment()
// resolves — but we never trust that client-reported status directly; we re-fetch
// the PaymentIntent from Stripe to verify it actually succeeded before marking the
// order paid. In production, the /api/webhook handler is the authoritative path;
// this just keeps local demos and analytics in sync without requiring `stripe listen`.
export async function POST(req: NextRequest) {
  let body: { paymentIntentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.paymentIntentId) {
    return NextResponse.json({ error: "Missing paymentIntentId" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(body.paymentIntentId);
    if (intent.status === "succeeded") {
      markOrderStatus(intent.id, "paid");
    } else if (intent.status === "canceled") {
      markOrderStatus(intent.id, "failed");
    }
    return NextResponse.json({ status: intent.status });
  } catch (err) {
    console.error("Failed to confirm order", err);
    return NextResponse.json({ error: "Unable to confirm order" }, { status: 502 });
  }
}
