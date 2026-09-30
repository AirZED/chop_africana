import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { markOrderStatus } from "@/lib/order-service";

// Kitchen dispatch: routes paid tickets to a kitchen display / POS bridge / printer.
// Swap the body of the payment_intent.succeeded case for a real integration
// (e.g. push to a kitchen display websocket, or a Square/Toast order-create call).
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const payload = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      markOrderStatus(intent.id, "paid");
      console.log("[kitchen-dispatch] New paid ticket:", {
        id: intent.id,
        amount: intent.amount,
        mode: intent.metadata.mode,
        table: intent.metadata.table,
        items: intent.metadata.items,
      });
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      markOrderStatus(intent.id, "failed");
      console.warn("[payments] Payment failed:", intent.id, intent.last_payment_error?.message);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
