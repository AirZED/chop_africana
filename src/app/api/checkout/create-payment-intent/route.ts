import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { recomputeCartServerTotal } from "@/lib/cart-pricing";
import { listActiveMenuItems, getMenuItemById } from "@/lib/menu-service";
import { listActiveShopProducts, getShopProductById } from "@/lib/shop-service";
import { createOrder } from "@/lib/order-service";
import { CartLine, FulfillmentMode } from "@/lib/types";

interface RequestBody {
  fulfillment: FulfillmentMode;
  table?: string | null;
  address?: string;
  fullName: string;
  phone: string;
  email: string;
  items: CartLine[];
}

const VALID_FULFILLMENT: FulfillmentMode[] = ["delivery", "pickup", "dine-in"];

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { fulfillment, table, address, fullName, phone, email, items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (!VALID_FULFILLMENT.includes(fulfillment)) {
    return NextResponse.json({ error: "Invalid fulfillment mode" }, { status: 400 });
  }
  if (!fullName?.trim() || !phone?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Full name, phone, and email are required" }, { status: 400 });
  }
  if (fulfillment === "delivery" && !address?.trim()) {
    return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
  }
  if (fulfillment === "dine-in" && !table?.trim()) {
    return NextResponse.json({ error: "Table number is required for dine-in orders" }, { status: 400 });
  }

  // Only active, admin-managed items may be ordered — re-checked against a fresh
  // read of the catalogs so a just-deactivated item or price change can't slip through.
  for (const line of items) {
    if (line.kind === "restaurant" && !(await getMenuItemById(line.refId))?.active) {
      return NextResponse.json({ error: "One of the dishes in your cart is no longer available" }, { status: 400 });
    }
    if (line.kind === "shop" && !(await getShopProductById(line.refId))) {
      return NextResponse.json({ error: "One of the products in your cart is no longer available" }, { status: 400 });
    }
  }

  const [menu, shop] = await Promise.all([listActiveMenuItems(), listActiveShopProducts()]);
  const { subtotal, delivery, total, error } = recomputeCartServerTotal(items, menu, shop, fulfillment);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const amountInCents = Math.round(total * 100);
  if (amountInCents < 50) {
    return NextResponse.json({ error: "Order total is too low to process" }, { status: 400 });
  }

  const itemSummary = items
    .map((line) => {
      const name =
        line.kind === "restaurant"
          ? menu.find((m) => m.itemId === line.refId)?.name
          : shop.find((p) => p.productId === line.refId)?.name;
      return `${name ?? line.refId} x${line.quantity}`;
    })
    .join(", ")
    .slice(0, 480);

  try {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
      metadata: {
        fulfillment,
        table: table ?? "",
        fullName,
        phone,
        address: address ?? "",
        items: itemSummary,
      },
    });

    createOrder({
      stripePaymentIntentId: paymentIntent.id,
      fulfillment,
      table,
      fullName,
      phone,
      email,
      address,
      items,
      menu,
      shop,
      subtotal,
      delivery,
      total,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, total });
  } catch (err) {
    console.error("Stripe payment intent creation failed", err);
    return NextResponse.json({ error: "Unable to start payment. Please try again." }, { status: 502 });
  }
}
