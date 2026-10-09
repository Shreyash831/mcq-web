"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Download,
  LogOut,
  RefreshCw,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<{ name: string; email: string } | null>(null);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setCurrentAdmin(data.user);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Examinations", href: "/admin/exams", icon: FileSpreadsheet },
    { name: "Students & Results", href: "/admin/students", icon: Users },
    { name: "Export Results", href: "/admin/export", icon: Download },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/admin-logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (pathname === "/admin/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <Link href="/admin/dashboard" className="font-bold text-slate-900 text-lg tracking-tight hover:text-blue-600 transition">
                MCQ Admin <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full ml-1">Portal</span>
              </Link>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Examination Control & Assessment System</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Menu */}
          <div className="flex items-center space-x-3">
            {/* View Student Portal Link */}
            <Link
              href="/"
              target="_blank"
              className="hidden lg:flex items-center space-x-1 text-xs font-medium text-slate-500 hover:text-blue-600 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Student View ↗</span>
            </Link>

            {/* Admin User Badge */}
            {currentAdmin && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {currentAdmin.name ? currentAdmin.name[0].toUpperCase() : "A"}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-none">{currentAdmin.name}</p>
                  <p className="text-[10px] text-slate-500 leading-none mt-0.5">{currentAdmin.email}</p>
                </div>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-sm font-medium text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition border border-slate-200 hover:border-red-200"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium rounded ${
                  isActive ? "text-blue-600 font-bold" : "text-slate-500"
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
