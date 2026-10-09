import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { parseAndValidateQuestions } from "@/lib/excel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exams = db.exams.getAll();
    return NextResponse.json({ exams });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch exams" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    // Support both multipart form data (with file attachment) and JSON
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const title = formData.get("title") as string;
      const subject = formData.get("subject") as string;
      const description = (formData.get("description") as string) || "";
      const durationMinutes = Number(formData.get("durationMinutes")) || 30;
      const marksPerQuestion = Number(formData.get("marksPerQuestion")) || 1;
      const negativeMarks = Number(formData.get("negativeMarks")) || 0;
      const shuffleQuestions = formData.get("shuffleQuestions") !== "false";
      const shuffleOptions = formData.get("shuffleOptions") === "true";
      const status = (formData.get("status") as any) || "active";
      const file = formData.get("file") as File | null;

      if (!title || !subject) {
        return NextResponse.json({ error: "Title and subject are required" }, { status: 400 });
      }

      const newExam = db.exams.create({
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        durationMinutes,
        totalQuestions: 0,
        marksPerQuestion,
        negativeMarks,
        shuffleQuestions,
        shuffleOptions,
        status,
      });

      let importedCount = 0;
      if (file) {
        const fileName = file.name.toLowerCase();
        let fileType: "csv" | "xlsx" | "json" | "pdf" = "csv";
        if (fileName.endsWith(".pdf")) fileType = "pdf";
        else if (fileName.endsWith(".json")) fileType = "json";
        else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) fileType = "xlsx";
        else if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) fileType = "csv";

        const buffer = Buffer.from(await file.arrayBuffer());
        const parseResult = await parseAndValidateQuestions(buffer, fileType, newExam.id);
        if (parseResult.validCount > 0) {
          const imported = db.questions.bulkCreate(parseResult.validQuestions);
          importedCount = imported.length;
        }
      }

      const refreshedExam = db.exams.findById(newExam.id);
      return NextResponse.json({ success: true, exam: refreshedExam || newExam, importedCount });
    }

    const body = await req.json();
    const {
      title,
      description,
      subject,
      durationMinutes,
      marksPerQuestion,
      negativeMarks,
      shuffleQuestions,
      shuffleOptions,
      status,
    } = body;

    if (!title || !subject || !durationMinutes) {
      return NextResponse.json({ error: "Title, subject, and duration are required" }, { status: 400 });
    }

    const newExam = db.exams.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      subject: subject.trim(),
      durationMinutes: Number(durationMinutes) || 30,
      totalQuestions: 0,
      marksPerQuestion: Number(marksPerQuestion) || 1,
      negativeMarks: Number(negativeMarks) || 0,
      shuffleQuestions: shuffleQuestions !== false,
      shuffleOptions: Boolean(shuffleOptions),
      status: status || "active",
    });

    return NextResponse.json({ success: true, exam: newExam });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create exam" }, { status: 500 });
  }
}
