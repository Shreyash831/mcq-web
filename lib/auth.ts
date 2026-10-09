import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { Admin, Student } from "@/types";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "super_secret_exam_jwt_key_9823478912389172389127398127398127398"
);

export const ADMIN_COOKIE_NAME = "mcq_admin_session";
export const STUDENT_COOKIE_NAME = "mcq_student_session";

export interface AdminJwtPayload {
  userId: string;
  email: string;
  name: string;
  role: "admin";
}

export interface StudentJwtPayload {
  studentId: string;
  attemptId: string;
  examId: string;
  rollNumber: string;
  division: string;
  role: "student";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdminToken(admin: Admin): Promise<string> {
  return new SignJWT({
    userId: admin.id,
    email: admin.email,
    name: admin.name,
    role: "admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function createStudentToken(payload: {
  studentId: string;
  attemptId: string;
  examId: string;
  rollNumber: string;
  division: string;
}): Promise<string> {
  return new SignJWT({
    ...payload,
    role: "student",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(SECRET_KEY);
}

export async function verifyToken<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as T;
  } catch (error) {
    return null;
  }
}

export async function getAdminSession(req?: NextRequest): Promise<AdminJwtPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }
  } else {
    const cookieStore = cookies();
    token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  }

  if (!token) return null;
  return verifyToken<AdminJwtPayload>(token);
}

export async function getStudentSession(req?: NextRequest): Promise<StudentJwtPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(STUDENT_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }
  } else {
    const cookieStore = cookies();
    token = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
  }

  if (!token) return null;
  return verifyToken<StudentJwtPayload>(token);
}
