import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exam = db.exams.findById(params.id);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const questions = db.questions.getByExamId(params.id);
    return NextResponse.json({ exam, questions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionText, optionA, optionB, optionC, optionD, correctAnswer } = await req.json();

    if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!["A", "B", "C", "D"].includes(correctAnswer.toUpperCase())) {
      return NextResponse.json({ error: "Correct Answer must be A, B, C, or D" }, { status: 400 });
    }

    const newQuestion = db.questions.create({
      examId: params.id,
      questionText: questionText.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctAnswer: correctAnswer.toUpperCase() as "A" | "B" | "C" | "D",
    });

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add question" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = db.questions.deleteByExamId(params.id);
    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to clear questions" }, { status: 500 });
  }
}
