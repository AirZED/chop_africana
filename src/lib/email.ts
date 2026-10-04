import { Resend } from "resend";
import type { OrderRecord, OrderItemRecord, OrderStatus } from "./order-service";
import { formatGBP } from "./pricing";
import { restaurant } from "./menu-data";

let resendClient: Resend | null | undefined;

/** Returns null (and logs once) if RESEND_API_KEY isn't set — callers should treat email as best-effort. */
function getResendClient(): Resend | null {
  if (resendClient !== undefined) return resendClient;
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is not set — order emails will be skipped. Add it to .env.local.");
    resendClient = null;
    return null;
  }
  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

const FROM_ADDRESS = process.env.EMAIL_FROM || `${restaurant.name} <orders@chopafricana.com>`;

function itemsListHtml(items: OrderItemRecord[]): string {
  return items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 0;">${i.name}${i.selectionsSummary ? ` <span style="color:#78716c;">(${i.selectionsSummary})</span>` : ""} &times; ${i.quantity}</td>
          <td style="padding:6px 0;text-align:right;">${formatGBP(i.lineTotal)}</td>
        </tr>`
    )
    .join("");
}

function wrapEmail(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1917;">
      <h1 style="font-size:20px;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top:32px;font-size:12px;color:#a8a29e;">${restaurant.name} &middot; ${restaurant.address}</p>
    </div>
  `;
}

export async function sendOrderConfirmationEmail(params: {
  order: OrderRecord;
  items: OrderItemRecord[];
}): Promise<void> {
  const client = getResendClient();
  if (!client) return;

  const { order, items } = params;
  const orderNumber = order.id.slice(-6).toUpperCase();

  const html = wrapEmail(
    `Order #${orderNumber} confirmed`,
    `
      <p>Thanks${order.fullName ? `, ${order.fullName}` : ""}! We've got your order and we're getting started.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        ${itemsListHtml(items)}
        <tr><td style="padding-top:12px;border-top:1px solid #e7e5e4;">Subtotal</td><td style="padding-top:12px;border-top:1px solid #e7e5e4;text-align:right;">${formatGBP(order.subtotal)}</td></tr>
        ${order.discount > 0 ? `<tr><td>Discount${order.discountCode ? ` (${order.discountCode})` : ""}</td><td style="text-align:right;">-${formatGBP(order.discount)}</td></tr>` : ""}
        ${order.delivery > 0 ? `<tr><td>Delivery</td><td style="text-align:right;">${formatGBP(order.delivery)}</td></tr>` : ""}
        <tr><td style="font-weight:bold;">Total</td><td style="text-align:right;font-weight:bold;">${formatGBP(order.total)}</td></tr>
      </table>
    `
  );

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to: order.email,
      subject: `Order #${orderNumber} confirmed — ${restaurant.name}`,
      html,
    });
  } catch (err) {
    console.error("[email] Failed to send order confirmation", err);
  }
}

const STATUS_COPY: Partial<Record<OrderStatus, string>> = {
  preparing: "Your order is being prepared.",
  ready: "Your order is ready!",
  completed: "Your order is complete. Enjoy!",
  cancelled: "Your order has been cancelled.",
  refunded: "Your order has been refunded.",
};

export async function sendOrderStatusEmail(params: { order: OrderRecord; status: OrderStatus }): Promise<void> {
  const client = getResendClient();
  if (!client) return;

  const copy = STATUS_COPY[params.status];
  if (!copy) return; // Not every status (e.g. pending/paid) warrants a customer email.

  const { order } = params;
  const orderNumber = order.id.slice(-6).toUpperCase();

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to: order.email,
      subject: `Order #${orderNumber} update — ${restaurant.name}`,
      html: wrapEmail(`Order #${orderNumber} update`, `<p>${copy}</p>`),
    });
  } catch (err) {
    console.error("[email] Failed to send status update", err);
  }
}
