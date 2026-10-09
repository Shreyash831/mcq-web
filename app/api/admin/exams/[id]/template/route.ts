import { NextRequest, NextResponse } from "next/server";
import { getSampleCsvTemplate, getSampleJsonTemplate } from "@/lib/excel";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "csv";

  if (format === "json") {
    const jsonContent = getSampleJsonTemplate();
    return new NextResponse(jsonContent, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="question_template.json"',
      },
    });
  }

  const csvContent = getSampleCsvTemplate();
  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="question_template.csv"',
    },
  });
}
