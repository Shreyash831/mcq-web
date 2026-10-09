import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, STUDENT_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  response.cookies.delete(STUDENT_COOKIE_NAME);
  return response;
}
