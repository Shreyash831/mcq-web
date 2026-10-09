# 📝 MCQ Examination & Online Assessment Platform

A complete, secure, responsive, full-stack MCQ examination web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and server-side state persistence.

---

## 🌟 Key Highlights & Security Architecture

1. **Anti-Cheating & Randomization**:
   - **Server-side Question Shuffling**: Each student gets an independently randomized question order saved to their examination attempt.
   - **Answer Option Shuffling**: Randomized option mappings (A, B, C, D) configured per examination.
   - **Zero Client Leakage**: Correct answers and score values are **never** delivered through student APIs.
2. **Server-Enforced Scoring**:
   - Scores, accuracy, and percentages are computed exclusively on the backend upon submission or time expiration.
3. **Timer Synchronization**:
   - Server timestamp-backed countdown timer (`expiresAt`) with automatic submission when remaining time reaches `00:00`.
4. **Instant Question File Importer (PDF, Excel, CSV, JSON)**:
   - Supports **PDF Question Papers**, **Excel spreadsheets (.xlsx / .xls)**, **CSV**, and **JSON**.
   - Automatic question and option extraction with preview and row-by-row error reporting.
   - Once imported, questions are automatically available to all students taking that examination with server-side question and option randomization.
5. **Unique Candidate Identity Rule**:
   - Any student can register and take an assessment, but **student Names and Email addresses must be strictly unique**.
   - Repeated names or emails are automatically detected and rejected with clear guidance to change name/email.
6. **Confidential Student Privacy Rule**:
   - Students see only: *"Your examination has been submitted successfully."*
   - Strictly no marks, ranks, or correct/incorrect indicators are exposed to students.
7. **Administrator Control & Auditing**:
   - Aggregate dashboard metrics (Average %, Highest score, Total submissions).
   - Searchable, filterable student attempts table.
   - Deep Question-by-Question audit breakdown with side-by-side student selections vs. official answer keys.
   - Attempt reset / retake permission controls.
   - Results export to CSV spreadsheet.

---

## 🔒 Administrator Authentication

- **Admin Portal URL**: `/admin/login`
- Access to the Examination Administration portal is restricted to authorized controllers with authenticated credentials.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14+ (App Router & Route Handlers)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: JWT with HTTP-only Cookies (`jose` & `bcryptjs`)
- **File Parsing & Export**: `papaparse` & `xlsx`
- **Icons**: `lucide-react`

---

## 💻 Quick Start & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Application in Browser**:
   - **Main Portal**: `http://localhost:3000`
   - **Admin Portal**: `http://localhost:3000/admin/dashboard`
   - **Student Examination Entry**: `http://localhost:3000/student/register`

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── admin/             # Admin protected APIs (stats, exams, questions, attempts, export)
│   │   ├── auth/              # Admin login, logout, session verification
│   │   └── student/           # Student sanitized exam session, answer autosave, submit
│   ├── admin/
│   │   ├── dashboard/         # Performance overview & analytics
│   │   ├── exams/             # Exam creation & question bank manager
│   │   ├── students/          # Student results table & question-by-question audit
│   │   ├── export/            # CSV spreadsheet export center
│   │   └── login/             # Admin authentication
│   ├── student/
│   │   ├── register/          # Candidate registration & exam launch
│   │   └── exam/[attemptId]/  # Live examination screen & submission confirmation
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── admin/                 # AdminNavbar, QuestionUploader
│   ├── student/               # ExamTimer, QuestionPalette
│   └── ui/                    # Modal, Toast
├── lib/
│   ├── auth.ts                # JWT authentication & session handling
│   ├── db.ts                  # Embedded database access layer
│   ├── exam-engine.ts         # Randomization, option mapping & server-side scoring
│   ├── excel.ts               # CSV/XLSX parser & validation engine
│   └── seed-data.ts           # Prepopulated exams, questions & attempts
├── public/                    # Sample question CSV & JSON templates
├── types/index.ts             # Complete TypeScript interfaces
└── package.json
```

---

## 🛡️ API Endpoints Summary

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/student/exams` | GET | Public | List active examinations |
| `/api/student/start` | POST | Student | Register student & generate randomized attempt |
| `/api/student/exam/:attemptId` | GET | Student | Get sanitized questions (no answer keys or marks) |
| `/api/student/answer` | POST | Student | Real-time auto-save answer response |
| `/api/student/submit` | POST | Student | Final server evaluation & response submission |
| `/api/admin/stats` | GET | Admin | Aggregate dashboard analytics |
| `/api/admin/exams` | GET, POST | Admin | Manage examinations |
| `/api/admin/exams/:id/upload` | POST | Admin | Validate & bulk import questions |
| `/api/admin/attempts` | GET | Admin | Filter & search student examination results |
| `/api/admin/attempts/:id` | GET | Admin | Full Question-by-Question audit breakdown |
| `/api/admin/attempts/:id/reset`| POST | Admin | Reset attempt to permit retake |
| `/api/admin/export` | GET | Admin | Download results CSV spreadsheet |
