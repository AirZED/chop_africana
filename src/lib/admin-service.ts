import bcrypt from "bcryptjs";
import { Collection } from "mongodb";
import { getMongoDb } from "./mongodb";

interface AdminUserDoc {
  _id: string;
  email: string;
  passwordHash: string;
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
        createdAt: new Date().toISOString(),
      });
    }
  }

  return collection;
}

/** Checks email/password against MongoDB, auto-seeding the very first admin from
 *  ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD (in .env.local) the first time this runs. */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const collection = await getCollection();
  const user = await collection.findOne({ _id: email.trim().toLowerCase() });
  if (!user) return false;
  return bcrypt.compare(password, user.passwordHash);
}

export async function createAdminUser(email: string, password: string): Promise<void> {
  const collection = await getCollection();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = email.trim().toLowerCase();
  await collection.updateOne(
    { _id: id },
    { $set: { email: id, passwordHash, createdAt: new Date().toISOString() } },
    { upsert: true }
  );
}
