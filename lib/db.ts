import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { DatabaseSchema, Admin, Student, Exam, Question, ExamAttempt, StudentAnswer } from "@/types";
import { generateInitialData } from "./seed-data";

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isVercel ? "/tmp" : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "exam_system.json");
const BUNDLED_DB_FILE = path.join(process.cwd(), "data", "exam_system.json");

let memoryCache: DatabaseSchema | null = null;

function ensureDbFile(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      let initialData: DatabaseSchema;
      if (fs.existsSync(BUNDLED_DB_FILE)) {
        try {
          const bundledContent = fs.readFileSync(BUNDLED_DB_FILE, "utf8");
          initialData = JSON.parse(bundledContent);
        } catch {
          initialData = generateInitialData();
        }
      } else {
        initialData = generateInitialData();
      }

      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
      } catch (e) {
        console.warn("Could not write DB to filesystem, using memory cache:", e);
      }
      memoryCache = initialData;
      return initialData;
    }

    const content = fs.readFileSync(DB_FILE, "utf8");
    if (!content.trim()) {
      const initialData = generateInitialData();
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
      } catch {}
      memoryCache = initialData;
      return initialData;
    }

    const data: DatabaseSchema = JSON.parse(content);
    let dirty = false;

    if (!data.admins) {
      data.admins = [];
      dirty = true;
    }

    // Purge old demo admin accounts
    const initialAdminCount = data.admins.length;
    data.admins = data.admins.filter((a) => a.email.toLowerCase() !== "admin@exam.com");
    if (data.admins.length !== initialAdminCount) {
      dirty = true;
    }

    // Ensure Suhas admin account exists with hard password
    let suhasAdmin = data.admins.find((a) => a.email.toLowerCase() === "suhas@exam.com");
    if (!suhasAdmin) {
      data.admins.push({
        id: "admin-suhas",
        name: "Suhas",
        email: "suhas@exam.com",
        passwordHash: bcrypt.hashSync("Suhas#Admin2026!$9x", 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      dirty = true;
    } else if (!bcrypt.compareSync("Suhas#Admin2026!$9x", suhasAdmin.passwordHash)) {
      suhasAdmin.passwordHash = bcrypt.hashSync("Suhas#Admin2026!$9x", 10);
      suhasAdmin.name = "Suhas";
      dirty = true;
    }

    if (dirty) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
      } catch {}
    }

    memoryCache = data;
    return data;
  } catch (error) {
    console.error("Database initialization error, falling back to memory/initial data:", error);
    if (memoryCache) return memoryCache;
    const initial = generateInitialData();
    memoryCache = initial;
    return initial;
  }
}

function writeDb(data: DatabaseSchema): void {
  memoryCache = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.warn("writeDb file write warning (using memory state):", error);
  }
}

export const db = {
  getRawData(): DatabaseSchema {
    return ensureDbFile();
  },

  resetToSeed(): DatabaseSchema {
    const fresh = generateInitialData();
    writeDb(fresh);
    return fresh;
  },

  // Admins
  admins: {
    findByEmail(email: string): Admin | undefined {
      const data = ensureDbFile();
      return data.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
    },
    findById(id: string): Admin | undefined {
      const data = ensureDbFile();
      return data.admins.find((a) => a.id === id);
    },
  },

  // Students
  students: {
    getAll(): Student[] {
      return ensureDbFile().students;
    },
    findById(id: string): Student | undefined {
      return ensureDbFile().students.find((s) => s.id === id);
    },
    findByName(name: string): Student | undefined {
      const data = ensureDbFile();
      const n = name.trim().toLowerCase();
      return data.students.find((s) => s.name.trim().toLowerCase() === n);
    },
    findByEmail(email: string): Student | undefined {
      const data = ensureDbFile();
      const e = email.trim().toLowerCase();
      return data.students.find((s) => s.email && s.email.trim().toLowerCase() === e);
    },
    findByRollAndDivision(rollNumber: string, division: string): Student | undefined {
      const data = ensureDbFile();
      return data.students.find(
        (s) =>
          s.rollNumber.trim().toLowerCase() === rollNumber.trim().toLowerCase() &&
          s.division.trim().toLowerCase() === division.trim().toLowerCase()
      );
    },
    create(studentData: { name: string; rollNumber: string; division: string; email?: string }): Student {
      const data = ensureDbFile();
      const now = new Date().toISOString();
      const newStudent: Student = {
        id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: studentData.name.trim(),
        rollNumber: studentData.rollNumber.trim(),
        division: studentData.division.trim().toUpperCase(),
        email: studentData.email ? studentData.email.trim() : undefined,
        createdAt: now,
        updatedAt: now,
      };

      data.students.push(newStudent);
      writeDb(data);
      return newStudent;
    },
    upsert(studentData: { name: string; rollNumber: string; division: string; email?: string }): Student {
      const data = ensureDbFile();
      const existing = data.students.find(
        (s) =>
          s.rollNumber.trim().toLowerCase() === studentData.rollNumber.trim().toLowerCase() &&
          s.division.trim().toLowerCase() === studentData.division.trim().toLowerCase()
      );

      const now = new Date().toISOString();
      if (existing) {
        existing.name = studentData.name.trim();
        if (studentData.email) existing.email = studentData.email.trim();
        existing.updatedAt = now;
        writeDb(data);
        return existing;
      }

      return this.create(studentData);
    },
  },

  // Exams
  exams: {
    getAll(): Exam[] {
      return ensureDbFile().exams;
    },
    findById(id: string): Exam | undefined {
      return ensureDbFile().exams.find((e) => e.id === id);
    },
    create(exam: Omit<Exam, "id" | "createdAt" | "updatedAt">): Exam {
      const data = ensureDbFile();
      const now = new Date().toISOString();
      const newExam: Exam = {
        ...exam,
        id: `exam-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      };
      data.exams.unshift(newExam);
      writeDb(data);
      return newExam;
    },
    update(id: string, updates: Partial<Omit<Exam, "id" | "createdAt">>): Exam | null {
      const data = ensureDbFile();
      const index = data.exams.findIndex((e) => e.id === id);
      if (index === -1) return null;

      data.exams[index] = {
        ...data.exams[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      writeDb(data);
      return data.exams[index];
    },
    delete(id: string): boolean {
      const data = ensureDbFile();
      const initialLength = data.exams.length;
      data.exams = data.exams.filter((e) => e.id !== id);
      // Clean up cascade
      data.questions = data.questions.filter((q) => q.examId !== id);
      const attemptIds = data.examAttempts.filter((a) => a.examId === id).map((a) => a.id);
      data.examAttempts = data.examAttempts.filter((a) => a.examId !== id);
      data.studentAnswers = data.studentAnswers.filter((sa) => !attemptIds.includes(sa.attemptId));

      writeDb(data);
      return data.exams.length < initialLength;
    },
  },

  // Questions
  questions: {
    getByExamId(examId: string): Question[] {
      return ensureDbFile().questions.filter((q) => q.examId === examId);
    },
    findById(id: string): Question | undefined {
      return ensureDbFile().questions.find((q) => q.id === id);
    },
    bulkCreate(questions: Omit<Question, "id" | "createdAt">[]): Question[] {
      const data = ensureDbFile();
      const now = new Date().toISOString();
      const created: Question[] = questions.map((q) => ({
        ...q,
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: now,
      }));

      data.questions.push(...created);

      // Update total questions count in exam
      const examMap = new Map<string, number>();
      for (const q of data.questions) {
        examMap.set(q.examId, (examMap.get(q.examId) || 0) + 1);
      }
      for (const exam of data.exams) {
        if (examMap.has(exam.id)) {
          exam.totalQuestions = examMap.get(exam.id)!;
        }
      }

      writeDb(data);
      return created;
    },
    create(question: Omit<Question, "id" | "createdAt">): Question {
      return this.bulkCreate([question])[0];
    },
    update(id: string, updates: Partial<Omit<Question, "id" | "examId" | "createdAt">>): Question | null {
      const data = ensureDbFile();
      const index = data.questions.findIndex((q) => q.id === id);
      if (index === -1) return null;

      data.questions[index] = {
        ...data.questions[index],
        ...updates,
      };
      writeDb(data);
      return data.questions[index];
    },
    delete(id: string): boolean {
      const data = ensureDbFile();
      const target = data.questions.find((q) => q.id === id);
      if (!target) return false;

      const examId = target.examId;
      data.questions = data.questions.filter((q) => q.id !== id);
      data.studentAnswers = data.studentAnswers.filter((sa) => sa.questionId !== id);

      // Update exam count
      const exam = data.exams.find((e) => e.id === examId);
      if (exam) {
        exam.totalQuestions = data.questions.filter((q) => q.examId === examId).length;
      }

      writeDb(data);
      return true;
    },
    deleteByExamId(examId: string): number {
      const data = ensureDbFile();
      const initialCount = data.questions.filter((q) => q.examId === examId).length;
      data.questions = data.questions.filter((q) => q.examId !== examId);
      const exam = data.exams.find((e) => e.id === examId);
      if (exam) exam.totalQuestions = 0;
      writeDb(data);
      return initialCount;
    },
  },

  // Exam Attempts
  attempts: {
    getAll(): ExamAttempt[] {
      return ensureDbFile().examAttempts;
    },
    findById(id: string): ExamAttempt | undefined {
      return ensureDbFile().examAttempts.find((a) => a.id === id);
    },
    findByStudentAndExam(studentId: string, examId: string): ExamAttempt | undefined {
      return ensureDbFile().examAttempts.find((a) => a.studentId === studentId && a.examId === examId);
    },
    create(attemptData: Omit<ExamAttempt, "id" | "createdAt" | "updatedAt">): ExamAttempt {
      const data = ensureDbFile();
      const now = new Date().toISOString();
      const newAttempt: ExamAttempt = {
        ...attemptData,
        id: `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      };

      data.examAttempts.unshift(newAttempt);
      writeDb(data);
      return newAttempt;
    },
    update(id: string, updates: Partial<Omit<ExamAttempt, "id" | "createdAt">>): ExamAttempt | null {
      const data = ensureDbFile();
      const index = data.examAttempts.findIndex((a) => a.id === id);
      if (index === -1) return null;

      data.examAttempts[index] = {
        ...data.examAttempts[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      writeDb(data);
      return data.examAttempts[index];
    },
    reset(id: string): boolean {
      const data = ensureDbFile();
      const attempt = data.examAttempts.find((a) => a.id === id);
      if (!attempt) return false;

      // Remove attempt answers
      data.studentAnswers = data.studentAnswers.filter((sa) => sa.attemptId !== id);
      // Remove attempt so student can restart cleanly
      data.examAttempts = data.examAttempts.filter((a) => a.id !== id);
      writeDb(data);
      return true;
    },
    delete(id: string): boolean {
      const data = ensureDbFile();
      data.studentAnswers = data.studentAnswers.filter((sa) => sa.attemptId !== id);
      data.examAttempts = data.examAttempts.filter((a) => a.id !== id);
      writeDb(data);
      return true;
    },
  },

  // Student Answers
  answers: {
    getByAttemptId(attemptId: string): StudentAnswer[] {
      return ensureDbFile().studentAnswers.filter((sa) => sa.attemptId === attemptId);
    },
    saveAnswer(answer: {
      attemptId: string;
      questionId: string;
      displayedPosition: number;
      selectedAnswer?: string | null;
      normalizedAnswer?: string | null;
      correctAnswer: "A" | "B" | "C" | "D";
      isCorrect: boolean;
      marksAwarded: number;
      isFlagged?: boolean;
    }): StudentAnswer {
      const data = ensureDbFile();
      const index = data.studentAnswers.findIndex(
        (sa) => sa.attemptId === answer.attemptId && sa.questionId === answer.questionId
      );

      const now = new Date().toISOString();
      if (index >= 0) {
        data.studentAnswers[index] = {
          ...data.studentAnswers[index],
          ...answer,
          selectedAnswer: (answer.selectedAnswer as any) ?? null,
          normalizedAnswer: (answer.normalizedAnswer as any) ?? null,
          answeredAt: now,
        };
        writeDb(data);
        return data.studentAnswers[index];
      }

      const newAnswer: StudentAnswer = {
        id: `sa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        attemptId: answer.attemptId,
        questionId: answer.questionId,
        displayedPosition: answer.displayedPosition,
        selectedAnswer: (answer.selectedAnswer as any) ?? null,
        normalizedAnswer: (answer.normalizedAnswer as any) ?? null,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
        marksAwarded: answer.marksAwarded,
        isFlagged: answer.isFlagged,
        answeredAt: now,
      };

      data.studentAnswers.push(newAnswer);
      writeDb(data);
      return newAnswer;
    },
  },
};
