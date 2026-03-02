"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-blue-950 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-yellow-400">🎯</span>
          <span className="hidden sm:inline">TOEIC 700+</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="hover:text-yellow-400 transition-colors">ダッシュボード</Link>
          <Link href="/practice" className="hover:text-yellow-400 transition-colors">問題練習</Link>
          <Link href="/vocabulary" className="hover:text-yellow-400 transition-colors">単語学習</Link>
          <Link href="/progress" className="hover:text-yellow-400 transition-colors">進捗</Link>
          <Link href="/ai-chat" className="hover:text-yellow-400 transition-colors flex items-center gap-1">
            <span>🤖</span>AIコーチ
          </Link>
          {session?.user.role === "admin" && (
            <Link href="/admin" className="hover:text-yellow-400 transition-colors">管理者</Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-lg transition-colors"
          >
            ログアウト
          </button>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="space-y-1">
            <span className="block w-6 h-0.5 bg-white"></span>
            <span className="block w-6 h-0.5 bg-white"></span>
            <span className="block w-6 h-0.5 bg-white"></span>
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-900 px-4 pb-4 space-y-2 text-sm">
          {[
            { href: "/dashboard", label: "ダッシュボード" },
            { href: "/practice", label: "問題練習" },
            { href: "/vocabulary", label: "単語学習" },
            { href: "/progress", label: "進捗" },
            { href: "/ai-chat", label: "🤖 AIコーチ" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-2 hover:text-yellow-400"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="block w-full text-left py-2 text-red-300 hover:text-red-200"
          >
            ログアウト
          </button>
        </div>
      )}
    </nav>
  );
}
