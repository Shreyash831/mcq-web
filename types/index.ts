export type OptionKey = "A" | "B" | "C" | "D";

export type ExamStatus = "draft" | "active" | "completed" | "inactive";

export type AttemptStatus = "in_progress" | "submitted" | "expired" | "reset";

export interface Admin {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  division: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  examId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: OptionKey;
  createdAt: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  durationMinutes: number;
  totalQuestions: number;
  marksPerQuestion: number;
  negativeMarks: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  startTime?: string;
  endTime?: string;
  status: ExamStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OptionMapping {
  A: OptionKey;
  B: OptionKey;
  C: OptionKey;
  D: OptionKey;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  expiresAt: string;
  status: AttemptStatus;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  marksObtained: number;
  totalPossibleMarks: number;
  percentage: number;
  questionOrder: string[]; // Question IDs in shuffled order
  optionOrderMap?: Record<string, OptionMapping>; // QuestionId -> Display mapping
  createdAt: string;
  updatedAt: string;
}

export interface StudentAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  displayedPosition: number;
  selectedAnswer?: OptionKey | null; // What student selected on their screen (A, B, C, D)
  normalizedAnswer?: OptionKey | null; // Canonical question original option
  correctAnswer: OptionKey;
  isCorrect: boolean;
  marksAwarded: number;
  isFlagged?: boolean;
  answeredAt?: string;
}

export interface DatabaseSchema {
  admins: Admin[];
  students: Student[];
  exams: Exam[];
  questions: Question[];
  examAttempts: ExamAttempt[];
  studentAnswers: StudentAnswer[];
}

// Student sanitized interfaces (SECURITY: Never expose answer keys or marks)
export interface SanitizedQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  selectedAnswer?: OptionKey | null;
  isFlagged?: boolean;
}

export interface StudentExamSession {
  attemptId: string;
  examId: string;
  examTitle: string;
  subject: string;
  durationMinutes: number;
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  student: {
    name: string;
    rollNumber: string;
    division: string;
  };
  totalQuestions: number;
  questions: SanitizedQuestion[];
}

// Admin Detailed Student Attempt View
export interface DetailedStudentAnswerView {
  questionNumber: number;
  questionId: string;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  selectedAnswerText?: string;
  selectedAnswerKey?: OptionKey | null;
  correctAnswerText: string;
  correctAnswerKey: OptionKey;
  isCorrect: boolean;
  status: "correct" | "incorrect" | "unanswered";
  marksAwarded: number;
  answeredAt?: string;
}

export interface DetailedAttemptReport {
  attempt: ExamAttempt;
  student: Student;
  exam: Exam;
  answers: DetailedStudentAnswerView[];
}
