import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getStudentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const adminSession = await getAdminSession(req);
    if (adminSession) {
      const admin = db.admins.findById(adminSession.userId);
      return NextResponse.json({
        role: "admin",
        user: {
          id: admin?.id || adminSession.userId,
          name: admin?.name || adminSession.name,
          email: admin?.email || adminSession.email,
        },
      });
    }

    const studentSession = await getStudentSession(req);
    if (studentSession) {
      const student = db.students.findById(studentSession.studentId);
      return NextResponse.json({
        role: "student",
        user: {
          id: student?.id || studentSession.studentId,
          name: student?.name || "Student",
          rollNumber: student?.rollNumber || studentSession.rollNumber,
          division: student?.division || studentSession.division,
          attemptId: studentSession.attemptId,
          examId: studentSession.examId,
        },
      });
    }

    return NextResponse.json({ role: null, user: null }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve session" }, { status: 500 });
  }
}
