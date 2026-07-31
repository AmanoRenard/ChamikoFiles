import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { success: false, error: "权限不足" },
      { status: 403 }
    );
  }

  const users = db.listUsers();

  return NextResponse.json({
    success: true,
    data: users,
  });
}
