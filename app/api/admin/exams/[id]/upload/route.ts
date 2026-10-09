import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { parseAndValidateQuestions } from "@/lib/excel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.syncFromCloud();

    const exam = db.exams.findById(params.id);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const confirmImport = formData.get("confirm") === "true";
    const replaceExisting = formData.get("replaceExisting") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    let fileType: "csv" | "xlsx" | "json" | "pdf" = "csv";
    if (fileName.endsWith(".pdf")) fileType = "pdf";
    else if (fileName.endsWith(".json")) fileType = "json";
    else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) fileType = "xlsx";
    else if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) fileType = "csv";
    else {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload PDF, Excel (.xlsx/.xls), CSV, or JSON." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parseResult = await parseAndValidateQuestions(buffer, fileType, params.id);

    if (confirmImport) {
      if (parseResult.validCount === 0) {
        return NextResponse.json(
          { error: "No valid questions found to import from this file.", validation: parseResult },
          { status: 400 }
        );
      }

      if (replaceExisting) {
        db.questions.deleteByExamId(params.id);
      }

      const imported = db.questions.bulkCreate(parseResult.validQuestions);
      await db.saveChanges();

      return NextResponse.json({
        success: true,
        importedCount: imported.length,
        validation: parseResult,
      });
    }

    // Return validation preview
    return NextResponse.json({
      success: true,
      validation: parseResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process question file" }, { status: 500 });
  }
}
