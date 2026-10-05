import { NextRequest, NextResponse } from "next/server";
import { AnalyticsRange, getAnalyticsSummary } from "@/lib/order-service";

const VALID_RANGES: AnalyticsRange[] = ["today", "7d", "30d", "90d", "all"];

export async function GET(req: NextRequest) {
  const rangeParam = req.nextUrl.searchParams.get("range") ?? "7d";
  const range = (VALID_RANGES as string[]).includes(rangeParam) ? (rangeParam as AnalyticsRange) : "7d";
  return NextResponse.json(await getAnalyticsSummary(range));
}
