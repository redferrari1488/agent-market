import { NextResponse } from "next/server";
import { listAvailableProviders } from "@/lib/payments";

export async function GET() {
  return NextResponse.json({ providers: listAvailableProviders() });
}
