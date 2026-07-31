import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const needsSetup = !db.hasAnyUser();
  return NextResponse.json({ success: true, data: { needsSetup } });
}
