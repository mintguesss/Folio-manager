import { NextRequest, NextResponse } from "next/server";
import { fetchTravelFx, fetchTravelFxForDate } from "@/lib/stock-utils";
import { toTravelCurrency } from "@/lib/currency";

export async function GET(req: NextRequest) {
  const currency = toTravelCurrency(req.nextUrl.searchParams.get("currency"));
  const date = req.nextUrl.searchParams.get("date");
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const rate = await fetchTravelFxForDate(currency, date);
    return NextResponse.json({ rate });
  }
  const rate = await fetchTravelFx(currency, true);
  return NextResponse.json({ rate });
}
