import { NextResponse } from "next/server";
import { readConfig } from "@/lib/config";

/** Public endpoint — returns site name and description, no auth required */
export async function GET() {
  try {
    const config = readConfig();
    return NextResponse.json({
      success: true,
      data: {
        name: config.site?.name || "ChamikoFiles",
        description: config.site?.description || "私人云盘",
        smartGradient: config.site?.smartGradient ?? true,
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: { name: "ChamikoFiles", description: "私人云盘", smartGradient: true },
    });
  }
}
