import { randomUUID } from "node:crypto";
import { Collection } from "mongodb";
import { getMongoDb } from "./mongodb";

interface AuditLogDoc {
  _id: string;
  adminEmail: string;
  action: string;
  target: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  targetId: string;
  details: string;
  createdAt: string;
}

async function getCollection(): Promise<Collection<AuditLogDoc>> {
  const db = await getMongoDb();
  return db.collection<AuditLogDoc>("audit_log");
}

export async function recordAudit(entry: {
  adminEmail: string;
  action: string;
  target: string;
  targetId: string;
  details?: string;
}): Promise<void> {
  try {
    const collection = await getCollection();
    await collection.insertOne({
      _id: randomUUID(),
      adminEmail: entry.adminEmail,
      action: entry.action,
      target: entry.target,
      targetId: entry.targetId,
      details: entry.details ?? "",
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    // Auditing is best-effort — never block the admin action it's recording.
    console.error("[audit] Failed to record entry", err);
  }
}

export async function listAuditLog(limit = 200): Promise<AuditLogEntry[]> {
  const collection = await getCollection();
  const docs = await collection
    .find({})
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 500))
    .toArray();
  return docs.map((d) => ({
    id: d._id,
    adminEmail: d.adminEmail,
    action: d.action,
    target: d.target,
    targetId: d.targetId,
    details: d.details,
    createdAt: d.createdAt,
  }));
}
