import { Question, Exam, OptionKey, OptionMapping, SanitizedQuestion, StudentAnswer, ExamAttempt } from "@/types";

// Fisher-Yates shuffle
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate shuffled option mapping
export function generateOptionMapping(): OptionMapping {
  const keys: OptionKey[] = ["A", "B", "C", "D"];
  const shuffled = shuffleArray(keys);
  return {
    A: shuffled[0], // Displayed Option A shows Question's Option [shuffled[0]]
    B: shuffled[1],
    C: shuffled[2],
    D: shuffled[3],
  };
}

// Build sanitized student question view for a single question given an optional mapping
export function sanitizeQuestionForStudent(
  question: Question,
  questionNumber: number,
  mapping?: OptionMapping,
  savedAnswer?: { selectedAnswer?: OptionKey | null; isFlagged?: boolean }
): SanitizedQuestion {
  const originalOptions = {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  };

  if (!mapping) {
    return {
      id: question.id,
      questionNumber,
      questionText: question.questionText,
      options: originalOptions,
      selectedAnswer: savedAnswer?.selectedAnswer,
      isFlagged: savedAnswer?.isFlagged,
    };
  }

  // With shuffled options
  return {
    id: question.id,
    questionNumber,
    questionText: question.questionText,
    options: {
      A: originalOptions[mapping.A],
      B: originalOptions[mapping.B],
      C: originalOptions[mapping.C],
      D: originalOptions[mapping.D],
    },
    selectedAnswer: savedAnswer?.selectedAnswer,
    isFlagged: savedAnswer?.isFlagged,
  };
}

// Resolve student's selected displayed option to original canonical option key
export function resolveNormalizedOption(
  displayedSelection: OptionKey | null | undefined,
  mapping?: OptionMapping
): OptionKey | null {
  if (!displayedSelection) return null;
  if (!mapping) return displayedSelection;
  return mapping[displayedSelection] || null;
}

// Check server-side time expiration
export function isAttemptExpired(attempt: ExamAttempt, graceSeconds = 30): boolean {
  const expiresAtMs = new Date(attempt.expiresAt).getTime() + graceSeconds * 1000;
  return Date.now() > expiresAtMs;
}

// Calculate remaining seconds
export function getRemainingSeconds(attempt: ExamAttempt): number {
  const now = Date.now();
  const expires = new Date(attempt.expiresAt).getTime();
  const diff = Math.floor((expires - now) / 1000);
  return Math.max(0, diff);
}

// Score student attempt strictly on server
export interface ScoreResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  marksObtained: number;
  totalPossibleMarks: number;
  percentage: number;
  evaluatedAnswers: {
    questionId: string;
    displayedPosition: number;
    selectedAnswer: OptionKey | null;
    normalizedAnswer: OptionKey | null;
    correctAnswer: OptionKey;
    isCorrect: boolean;
    marksAwarded: number;
    isFlagged?: boolean;
  }[];
}

export function evaluateAttempt(
  exam: Exam,
  attempt: ExamAttempt,
  questions: Question[],
  savedStudentAnswers: StudentAnswer[]
): ScoreResult {
  const questionsMap = new Map(questions.map((q) => [q.id, q]));
  const answersMap = new Map(savedStudentAnswers.map((a) => [a.questionId, a]));

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalScore = 0;

  const marksPerQ = Number(exam.marksPerQuestion) || 1;
  const negMarks = Number(exam.negativeMarks) || 0;
  const totalPossibleMarks = attempt.questionOrder.length * marksPerQ;

  const evaluatedAnswers: ScoreResult["evaluatedAnswers"] = [];

  attempt.questionOrder.forEach((qId, index) => {
    const question = questionsMap.get(qId);
    if (!question) return;

    const saved = answersMap.get(qId);
    const displayedSelection = saved?.selectedAnswer || null;
    const mapping = attempt.optionOrderMap?.[qId];

    const normalizedSelection = resolveNormalizedOption(displayedSelection, mapping);
    const isAnswered = Boolean(normalizedSelection);

    let isCorrect = false;
    let marksAwarded = 0;

    if (!isAnswered) {
      unansweredCount++;
      marksAwarded = 0;
    } else if (normalizedSelection === question.correctAnswer) {
      correctCount++;
      isCorrect = true;
      marksAwarded = marksPerQ;
    } else {
      incorrectCount++;
      isCorrect = false;
      marksAwarded = negMarks > 0 ? -negMarks : 0;
    }

    totalScore += marksAwarded;

    evaluatedAnswers.push({
      questionId: qId,
      displayedPosition: index + 1,
      selectedAnswer: displayedSelection,
      normalizedAnswer: normalizedSelection,
      correctAnswer: question.correctAnswer,
      isCorrect,
      marksAwarded,
      isFlagged: saved?.isFlagged,
    });
  });

  const finalScore = Math.max(0, Math.round(totalScore * 100) / 100);
  const percentage = totalPossibleMarks > 0 ? Math.round((finalScore / totalPossibleMarks) * 10000) / 100 : 0;

  return {
    totalQuestions: attempt.questionOrder.length,
    correctAnswers: correctCount,
    incorrectAnswers: incorrectCount,
    unansweredQuestions: unansweredCount,
    marksObtained: finalScore,
    totalPossibleMarks,
    percentage,
    evaluatedAnswers,
  };
}
