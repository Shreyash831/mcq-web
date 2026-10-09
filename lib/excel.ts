import Papa from "papaparse";
import * as XLSX from "xlsx";
import { OptionKey, Question } from "@/types";

export interface ParsedQuestionRow {
  rowNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: OptionKey;
  raw: any;
  errors: string[];
}

export interface ParseResult {
  validQuestions: Omit<Question, "id" | "createdAt">[];
  rows: ParsedQuestionRow[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  errorsSummary: string[];
}

// Fast, Memory-Safe Plain Text Extractor from PDF buffer without heavy regex backtracking
function extractTextFromPdfBuffer(buffer: Buffer): string {
  try {
    // Read up to 5MB slice to prevent heap overflow
    const maxLen = Math.min(buffer.length, 5 * 1024 * 1024);
    const raw = buffer.subarray(0, maxLen).toString("latin1");
    const chunks: string[] = [];

    // Fast linear scan for Tj and TJ strings without catastrophic backtracking
    let pos = 0;
    while (pos < raw.length) {
      const openParen = raw.indexOf("(", pos);
      if (openParen === -1 || openParen > maxLen) break;
      const closeParen = raw.indexOf(")", openParen);
      if (closeParen === -1 || closeParen > maxLen) break;

      const snippet = raw.substring(openParen + 1, closeParen);
      if (snippet.length > 0 && snippet.length < 500) {
        chunks.push(snippet);
      }
      pos = closeParen + 1;
    }

    if (chunks.length > 10) {
      return chunks.join(" ");
    }

    // Fallback: extract clean printable ASCII tokens
    return buffer
      .subarray(0, maxLen)
      .toString("utf8")
      .replace(/[^\x20-\x7E\n\r\t]/g, " ");
  } catch (err) {
    return "";
  }
}

// Parse MCQ Questions from Freeform Text with line-by-line linear scan
export function parseMcqFromText(fullText: string): any[] {
  if (!fullText) return [];

  const lines = fullText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.length < 2000)
    .slice(0, 3000); // Safety limit max 3000 lines

  const rawQuestions: any[] = [];
  let currentQ: any = null;

  const qStartRegex = /^(?:Q(?:uestion)?\.?\s*(\d+)|(\d+)[\.\)\-\:]|Problem\s*(\d+))\s*(.*)/i;
  const optARegex = /^(?:(?:\(A\)|A[\.\)\:\-]|\[A\])\s*|\bA\b[\.\:\-])\s*(.*)/i;
  const optBRegex = /^(?:(?:\(B\)|B[\.\)\:\-]|\[B\])\s*|\bB\b[\.\:\-])\s*(.*)/i;
  const optCRegex = /^(?:(?:\(C\)|C[\.\)\:\-]|\[C\])\s*|\bC\b[\.\:\-])\s*(.*)/i;
  const optDRegex = /^(?:(?:\(D\)|D[\.\)\:\-]|\[D\])\s*|\bD\b[\.\:\-])\s*(.*)/i;
  const ansRegex = /(?:(?:Correct\s*)?Ans(?:wer)?|Correct\s*Option|Key|Ans\.)\s*[\:\-\=\.\s]*\(?([A-D1-4])\)?/i;

  const pushCurrent = () => {
    if (currentQ && (currentQ.questionText || currentQ.optionA)) {
      if (!currentQ.optionA) currentQ.optionA = "Option A";
      if (!currentQ.optionB) currentQ.optionB = "Option B";
      if (!currentQ.optionC) currentQ.optionC = "Option C";
      if (!currentQ.optionD) currentQ.optionD = "Option D";
      if (!currentQ.correctAnswer) currentQ.correctAnswer = "A";
      rawQuestions.push(currentQ);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check Answer Line or embedded answer
    const ansMatch = line.match(ansRegex);
    if (ansMatch && currentQ) {
      let rawAns = ansMatch[1].toUpperCase();
      if (rawAns === "1") rawAns = "A";
      else if (rawAns === "2") rawAns = "B";
      else if (rawAns === "3") rawAns = "C";
      else if (rawAns === "4") rawAns = "D";
      currentQ.correctAnswer = rawAns;
      continue;
    }

    // Check Inline Single-Line Options: e.g. A) ... B) ... C) ... D) ...
    const inlineMatch = line.match(/^(?:(?:\(A\)|A[\.\)\:\-])\s*(.*?))\s+(?:(?:\(B\)|B[\.\)\:\-])\s*(.*?))\s+(?:(?:\(C\)|C[\.\)\:\-])\s*(.*?))\s+(?:(?:\(D\)|D[\.\)\:\-])\s*(.*))$/i);
    if (inlineMatch && currentQ) {
      currentQ.optionA = inlineMatch[1].trim();
      currentQ.optionB = inlineMatch[2].trim();
      currentQ.optionC = inlineMatch[3].trim();
      currentQ.optionD = inlineMatch[4].trim();
      continue;
    }

    // Check Option A
    const optAMatch = line.match(optARegex);
    if (optAMatch && currentQ) {
      currentQ.optionA = optAMatch[1];
      continue;
    }

    // Check Option B
    const optBMatch = line.match(optBRegex);
    if (optBMatch && currentQ) {
      currentQ.optionB = optBMatch[1];
      continue;
    }

    // Check Option C
    const optCMatch = line.match(optCRegex);
    if (optCMatch && currentQ) {
      currentQ.optionC = optCMatch[1];
      continue;
    }

    // Check Option D
    const optDMatch = line.match(optDRegex);
    if (optDMatch && currentQ) {
      currentQ.optionD = optDMatch[1];
      continue;
    }

    // Check Question Start
    const qMatch = line.match(qStartRegex);
    if (qMatch) {
      pushCurrent();
      currentQ = {
        questionText: qMatch[4] || line,
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "A",
      };
      continue;
    }

    // Multiline continuation
    if (currentQ) {
      if (!currentQ.optionA) {
        currentQ.questionText += " " + line;
      } else if (!currentQ.optionB) {
        currentQ.optionA += " " + line;
      } else if (!currentQ.optionC) {
        currentQ.optionB += " " + line;
      } else if (!currentQ.optionD) {
        currentQ.optionC += " " + line;
      } else if (!currentQ.correctAnswer || currentQ.correctAnswer === "A") {
        currentQ.optionD += " " + line;
      }
    }
  }

  pushCurrent();
  return rawQuestions;
}

export async function parseAndValidateQuestions(
  rawContent: Buffer | ArrayBuffer | string,
  fileType: "csv" | "xlsx" | "json" | "pdf",
  examId: string
): Promise<ParseResult> {
  let rawRows: any[] = [];
  const buffer = Buffer.isBuffer(rawContent)
    ? rawContent
    : typeof rawContent === "string"
    ? Buffer.from(rawContent)
    : Buffer.from(rawContent);

  try {
    if (fileType === "pdf") {
      let pdfText = "";
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const pdfData = await pdfParse(buffer, { max: 50 });
        pdfText = pdfData.text;
      } catch (pdfErr) {
        pdfText = extractTextFromPdfBuffer(buffer);
      }

      rawRows = parseMcqFromText(pdfText);

      if (rawRows.length === 0 && pdfText) {
        const csvFallback = Papa.parse(pdfText, { header: true, skipEmptyLines: "greedy" });
        if (csvFallback.data && csvFallback.data.length > 0) {
          rawRows = csvFallback.data;
        }
      }
    } else if (fileType === "json") {
      const text = buffer.toString("utf8");
      const parsed = JSON.parse(text);
      rawRows = Array.isArray(parsed) ? parsed : [parsed];
    } else if (fileType === "csv") {
      const text = buffer.toString("utf8");
      const parseOutput = Papa.parse(text, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""),
      });
      rawRows = parseOutput.data;
    } else if (fileType === "xlsx") {
      // Use low-memory dense mode for XLSX
      const workbook = XLSX.read(buffer, {
        type: "buffer",
        dense: true,
        cellDates: false,
        cellStyles: false,
        sheetRows: 2000,
      });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (json.length > 0) {
        const headers = (json[0] as string[]).map((h) =>
          String(h || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
        );
        rawRows = json.slice(1).map((row: any) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });
      }
    }
  } catch (err: any) {
    return {
      validQuestions: [],
      rows: [],
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      errorsSummary: [`Failed to parse ${fileType.toUpperCase()} file: ${err.message || "Invalid file format"}`],
    };
  }

  const rows: ParsedQuestionRow[] = [];
  const validQuestions: Omit<Question, "id" | "createdAt">[] = [];
  const errorsSummary: string[] = [];

  rawRows.forEach((item, idx) => {
    const rowNumber = idx + 1;
    const errors: string[] = [];

    // Flexible key locator
    const findField = (prefixes: string[]) => {
      for (const [key, val] of Object.entries(item)) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (prefixes.some((p) => cleanKey === p || cleanKey.includes(p))) {
          return String(val || "").trim();
        }
      }
      return "";
    };

    const questionText = findField(["question", "questiontext", "qtext", "query", "q"]);
    let optionA = findField(["optiona", "opta", "choicea", "a"]);
    let optionB = findField(["optionb", "optb", "choiceb", "b"]);
    let optionC = findField(["optionc", "optc", "choicec", "c"]);
    let optionD = findField(["optiond", "optd", "choiced", "d"]);
    let correctAnswerRaw = findField(["correctanswer", "correct", "answer", "ans", "key", "correctoption"]).toUpperCase();

    // Map 1/2/3/4 to A/B/C/D
    if (correctAnswerRaw === "1") correctAnswerRaw = "A";
    else if (correctAnswerRaw === "2") correctAnswerRaw = "B";
    else if (correctAnswerRaw === "3") correctAnswerRaw = "C";
    else if (correctAnswerRaw === "4") correctAnswerRaw = "D";

    // Check if correct answer was typed as full text
    if (correctAnswerRaw.length > 1) {
      if (optionA && correctAnswerRaw === optionA.toUpperCase()) correctAnswerRaw = "A";
      else if (optionB && correctAnswerRaw === optionB.toUpperCase()) correctAnswerRaw = "B";
      else if (optionC && correctAnswerRaw === optionC.toUpperCase()) correctAnswerRaw = "C";
      else if (optionD && correctAnswerRaw === optionD.toUpperCase()) correctAnswerRaw = "D";
      else {
        const match = correctAnswerRaw.match(/\b([A-D])\b/);
        if (match) correctAnswerRaw = match[1];
      }
    }

    if (!questionText) {
      errors.push("Question text is required.");
    }
    if (!optionA) optionA = "Option A";
    if (!optionB) optionB = "Option B";
    if (!optionC) optionC = "Option C";
    if (!optionD) optionD = "Option D";

    // Gracefully default to 'A' if not explicitly defined in the file
    if (!correctAnswerRaw || !["A", "B", "C", "D"].includes(correctAnswerRaw)) {
      correctAnswerRaw = "A";
    }

    const rowObj: ParsedQuestionRow = {
      rowNumber,
      questionText: questionText || `Question ${rowNumber}`,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer: correctAnswerRaw as OptionKey,
      raw: item,
      errors,
    };

    rows.push(rowObj);

    if (errors.length === 0) {
      validQuestions.push({
        examId,
        questionText: questionText || `Question ${rowNumber}`,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer: correctAnswerRaw as OptionKey,
      });
    } else {
      errorsSummary.push(`Item ${rowNumber}: ${errors.join(" ")}`);
    }
  });

  return {
    validQuestions,
    rows,
    totalRows: rows.length,
    validCount: validQuestions.length,
    invalidCount: rows.length - validQuestions.length,
    errorsSummary,
  };
}

// Generate Sample Template CSV
export function getSampleCsvTemplate(): string {
  return [
    "Question,Option A,Option B,Option C,Option D,Correct Answer",
    '"What is the capital of France?","London","Berlin","Paris","Madrid","C"',
    '"Which planet is known as the Red Planet?","Venus","Mars","Jupiter","Saturn","B"',
    '"What is 12 multiplied by 8?","86","94","96","108","C"',
    '"Which HTML tag is used for the largest heading?","<h6>","<head>","<h1>","<heading>","C"',
    '"Which data structure follows LIFO?","Queue","Stack","Array","Tree","B"',
  ].join("\n");
}

// Generate Sample Template JSON
export function getSampleJsonTemplate(): string {
  const sample = [
    {
      questionText: "What is the capital of France?",
      optionA: "London",
      optionB: "Berlin",
      optionC: "Paris",
      optionD: "Madrid",
      correctAnswer: "C",
    },
    {
      questionText: "Which planet is known as the Red Planet?",
      optionA: "Venus",
      optionB: "Mars",
      optionC: "Jupiter",
      optionD: "Saturn",
      correctAnswer: "B",
    },
    {
      questionText: "What is 12 multiplied by 8?",
      optionA: "86",
      optionB: "94",
      optionC: "96",
      optionD: "108",
      correctAnswer: "C",
    },
  ];
  return JSON.stringify(sample, null, 2);
}

// Export student results to CSV string
export function exportResultsToCsv(data: {
  studentName: string;
  rollNumber: string;
  division: string;
  examTitle: string;
  status: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  marksObtained: number;
  totalPossibleMarks: number;
  percentage: number;
  submittedAt: string;
}[]): string {
  const headers = [
    "Student Name",
    "Roll Number",
    "Division",
    "Exam Title",
    "Status",
    "Total Questions",
    "Correct",
    "Incorrect",
    "Unanswered",
    "Marks Obtained",
    "Total Marks",
    "Percentage (%)",
    "Submission Time",
  ];

  const rows = data.map((item) => [
    `"${item.studentName.replace(/"/g, '""')}"`,
    `"${item.rollNumber}"`,
    `"${item.division}"`,
    `"${item.examTitle.replace(/"/g, '""')}"`,
    item.status,
    item.totalQuestions,
    item.correctAnswers,
    item.incorrectAnswers,
    item.unansweredQuestions,
    item.marksObtained,
    item.totalPossibleMarks,
    `${item.percentage}%`,
    item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "Not Submitted",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
