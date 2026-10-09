import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reset = db.attempts.reset(params.id);
    if (!reset) {
      return NextResponse.json({ error: "Attempt not found or could not be reset." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Examination attempt has been successfully reset. Student can now retake the test.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to reset attempt" }, { status: 500 });
  }
}
