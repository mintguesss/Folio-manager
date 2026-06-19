import { fetchUSDTWDForDate } from "@/lib/stock-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const rate = await fetchUSDTWDForDate(date);
  return NextResponse.json({ rate });
}
