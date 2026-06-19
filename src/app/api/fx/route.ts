import { NextRequest, NextResponse } from "next/server";
import { fetchJPYTWDLive, fetchJPYTWDForDate } from "@/lib/stock-utils";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const rate = await fetchJPYTWDForDate(date);
    return NextResponse.json({ rate });
  }
  const rate = await fetchJPYTWDLive();
  return NextResponse.json({ rate });
}
