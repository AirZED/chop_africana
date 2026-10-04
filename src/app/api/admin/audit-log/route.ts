import { NextResponse } from "next/server";
import { listAuditLog } from "@/lib/audit-service";

export async function GET() {
  return NextResponse.json({ entries: await listAuditLog() });
}
