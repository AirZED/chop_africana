import bcrypt from "bcryptjs";
import { Collection } from "mongodb";
import { getMongoDb } from "./mongodb";
import type { AdminRole } from "./admin-auth";

interface AdminUserDoc {
  _id: string;
  email: string;
  passwordHash: string;
  // Optional in the type because it genuinely can be absent on documents
  // written before multi-admin roles existed — see the backfill below.
  role?: AdminRole;
  createdAt: string;
}

export interface AdminUser {
  email: string;
  role: AdminRole;
  createdAt: string;
}

const SALT_ROUNDS = 12;

async function getCollection(): Promise<Collection<AdminUserDoc>> {
  const db = await getMongoDb();
  const collection = db.collection<AdminUserDoc>("admin_users");
  const count = await collection.estimatedDocumentCount();

  if (count === 0) {
    const seedEmail = process.env.ADMIN_SEED_EMAIL;
    const seedPassword = process.env.ADMIN_SEED_PASSWORD;
    if (seedEmail && seedPassword) {
      const passwordHash = await bcrypt.hash(seedPassword, SALT_ROUNDS);
      await collection.insertOne({
        _id: seedEmail.trim().toLowerCase(),
        email: seedEmail.trim().toLowerCase(),
        passwordHash,
        role: "owner",
        createdAt: new Date().toISOString(),
      });
    }
  }

  return collection;
}

/** Checks email/password against MongoDB, auto-seeding the very first admin (as owner) from
 *  ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD (in .env.local) the first time this runs. */
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<{ email: string; role: AdminRole } | null> {
  const collection = await getCollection();
  const user = await collection.findOne({ _id: email.trim().toLowerCase() });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  // Accounts created before multi-admin roles existed have no `role` field in
  // Mongo (findOne just returns undefined for it). Treat that as "owner" — the
  // only role that existed back then — and backfill it in the same request so
  // this is a one-time, self-healing fix rather than a permanent workaround.
  if (!user.role) {
    await collection.updateOne({ _id: user._id }, { $set: { role: "owner" } });
  }

  return { email: user.email, role: user.role ?? "owner" };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const collection = await getCollection();
  const docs = await collection.find({}).sort({ createdAt: 1 }).toArray();
  return docs.map((d) => ({ email: d.email, role: d.role ?? "owner", createdAt: d.createdAt }));
}

export async function createAdminUser(email: string, password: string, role: AdminRole): Promise<void> {
  const collection = await getCollection();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = email.trim().toLowerCase();
  await collection.updateOne(
    { _id: id },
    { $set: { email: id, passwordHash, role, createdAt: new Date().toISOString() } },
    { upsert: true }
  );
}

export async function setAdminUserRole(email: string, role: AdminRole): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.updateOne({ _id: email.trim().toLowerCase() }, { $set: { role } });
  return result.matchedCount > 0;
}

export async function deleteAdminUser(email: string): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: email.trim().toLowerCase() });
  return result.deletedCount > 0;
}
