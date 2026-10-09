"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AdminNavbar from "@/components/admin/AdminNavbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <AdminNavbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-700">
          Developed by <span className="font-bold text-slate-900">Suhas Gage</span> • Contact:{" "}
          <a href="tel:9021085949" className="font-bold text-blue-600 hover:text-blue-800 transition">
            9021085949
          </a>
        </p>
        <p>© 2026 MCQ Examination Control Center • Confidential Administrator Access</p>
      </footer>
    </div>
  );
}

