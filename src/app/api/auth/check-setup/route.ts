import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const needsSetup = !db.hasAnyUser();
    return NextResponse.json({ success: true, data: { needsSetup } });
  } catch (err) {
    console.error("[check-setup] Error:", err);
    // If anything fails, assume setup is needed (safest default)
    return NextResponse.json({ success: true, data: { needsSetup: true } });
  }
}
