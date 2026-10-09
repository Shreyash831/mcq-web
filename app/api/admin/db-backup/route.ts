import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.syncFromCloud();
    const data = db.getRawData();

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="exam_system_backup_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to export database" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let dataToImport: any = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No backup JSON file provided" }, { status: 400 });
      }
      const text = await file.text();
      dataToImport = JSON.parse(text);
    } else {
      dataToImport = await req.json();
    }

    if (!dataToImport || !Array.isArray(dataToImport.exams)) {
      return NextResponse.json({ error: "Invalid database schema format." }, { status: 400 });
    }

    // Merge or restore
    const current = db.getRawData();
    current.exams = dataToImport.exams || [];
    current.questions = dataToImport.questions || [];
    if (dataToImport.students?.length) current.students = dataToImport.students;
    if (dataToImport.examAttempts?.length) current.examAttempts = dataToImport.examAttempts;
    if (dataToImport.studentAnswers?.length) current.studentAnswers = dataToImport.studentAnswers;

    await db.saveChanges();

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${current.exams.length} exams and ${current.questions.length} questions!`,
      summary: {
        exams: current.exams.length,
        questions: current.questions.length,
        students: current.students.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to restore database" }, { status: 500 });
  }
}
