import { Collection } from "mongodb";
import { getMongoDb } from "./mongodb";

interface DiscountCodeDoc {
  _id: string; // the code itself, uppercased
  type: "percent" | "fixed";
  value: number; // percent: 1-100, fixed: GBP amount
  active: boolean;
  expiresAt: string | null;
  minSubtotal: number; // GBP
  usageLimit: number | null;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCode {
  code: string;
  type: "percent" | "fixed";
  value: number;
  active: boolean;
  expiresAt: string | null;
  minSubtotal: number;
  usageLimit: number | null;
  usedCount: number;
}

export interface DiscountCodeInput {
  code: string;
  type: "percent" | "fixed";
  value: number;
  active: boolean;
  expiresAt?: string | null;
  minSubtotal: number;
  usageLimit?: number | null;
}

async function getCollection(): Promise<Collection<DiscountCodeDoc>> {
  const db = await getMongoDb();
  return db.collection<DiscountCodeDoc>("discount_codes");
}

function docToCode(doc: DiscountCodeDoc): DiscountCode {
  return {
    code: doc._id,
    type: doc.type,
    value: doc.value,
    active: doc.active,
    expiresAt: doc.expiresAt,
    minSubtotal: doc.minSubtotal,
    usageLimit: doc.usageLimit,
    usedCount: doc.usedCount,
  };
}

export async function getDiscountCode(code: string): Promise<DiscountCode | null> {
  const collection = await getCollection();
  const doc = await collection.findOne({ _id: code.trim().toUpperCase() });
  return doc ? docToCode(doc) : null;
}

export async function listDiscountCodes(): Promise<DiscountCode[]> {
  const collection = await getCollection();
  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(docToCode);
}

export async function createDiscountCode(input: DiscountCodeInput): Promise<string> {
  const collection = await getCollection();
  const code = input.code.trim().toUpperCase();
  const now = new Date().toISOString();
  await collection.insertOne({
    _id: code,
    type: input.type,
    value: input.value,
    active: input.active,
    expiresAt: input.expiresAt ?? null,
    minSubtotal: input.minSubtotal,
    usageLimit: input.usageLimit ?? null,
    usedCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  return code;
}

export async function updateDiscountCode(code: string, input: DiscountCodeInput): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.updateOne(
    { _id: code.trim().toUpperCase() },
    {
      $set: {
        type: input.type,
        value: input.value,
        active: input.active,
        expiresAt: input.expiresAt ?? null,
        minSubtotal: input.minSubtotal,
        usageLimit: input.usageLimit ?? null,
        updatedAt: new Date().toISOString(),
      },
    }
  );
  return result.matchedCount > 0;
}

export async function deleteDiscountCode(code: string): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: code.trim().toUpperCase() });
  return result.deletedCount > 0;
}

export type DiscountValidation =
  | { ok: true; code: string; discount: number }
  | { ok: false; error: string };

/** Validates a code against a cart subtotal and returns the GBP discount amount, without recording usage. */
export async function validateDiscountCode(rawCode: string, subtotal: number): Promise<DiscountValidation> {
  const collection = await getCollection();
  const code = rawCode.trim().toUpperCase();
  const doc = await collection.findOne({ _id: code });

  if (!doc || !doc.active) return { ok: false, error: "That code isn't valid." };
  if (doc.expiresAt && new Date(doc.expiresAt).getTime() < Date.now()) {
    return { ok: false, error: "That code has expired." };
  }
  if (doc.usageLimit !== null && doc.usedCount >= doc.usageLimit) {
    return { ok: false, error: "That code has already been fully redeemed." };
  }
  if (subtotal < doc.minSubtotal) {
    return { ok: false, error: `Spend at least £${doc.minSubtotal.toFixed(2)} to use this code.` };
  }

  const discount = doc.type === "percent" ? (subtotal * doc.value) / 100 : Math.min(doc.value, subtotal);
  return { ok: true, code, discount: Math.round(discount * 100) / 100 };
}

export async function recordDiscountUsage(code: string): Promise<void> {
  const collection = await getCollection();
  await collection.updateOne({ _id: code.trim().toUpperCase() }, { $inc: { usedCount: 1 } });
}
