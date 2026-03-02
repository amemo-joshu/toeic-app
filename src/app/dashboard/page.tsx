"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Stats {
  stats: { isCorrect: boolean; _count: number }[];
  user: { streak: number; targetScore: number; lastStudiedAt: string | null };
  partStats: Record<string, { total: number; correct: number }>;
  estimatedScore: number | null;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/answers")
        .then((r) => r.json())
        .then(setStats);
    }
  }, [session]);

  if (status === "loading" || !session) return null;

  const totalAnswers = stats?.stats.reduce((acc, s) => acc + s._count, 0) || 0;
  const correctAnswers = stats?.stats.find((s) => s.isCorrect)?._count || 0;
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const estimatedScore = stats?.estimatedScore ?? null;
  const streak = stats?.user?.streak || 0;
  const targetScore = stats?.user?.targetScore || 700;
  const progress = estimatedScore !== null ? Math.min(100, Math.round((estimatedScore / targetScore) * 100)) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-950">
            おかえり、{session.user.name}さん 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">今日も一緒に頑張ろう！</p>
        </div>

        {/* Score progress */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-200 text-sm">推定スコア</p>
              {estimatedScore !== null ? (
                <p className="text-5xl font-extrabold text-yellow-400">{estimatedScore}</p>
              ) : (
                <div>
                  <p className="text-5xl font-extrabold text-yellow-400/60">???</p>
                  <p className="text-yellow-200 text-xs mt-1">全Part練習後に解放🔒</p>
                </div>
              )}
              <p className="text-blue-200 text-sm mt-1">目標: {targetScore}点</p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-sm">連続学習</p>
              <p className="text-4xl font-bold">🔥 {streak}</p>
              <p className="text-blue-200 text-sm">日</p>
            </div>
          </div>
          <div className="bg-blue-950/40 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-blue-200 text-xs mt-2 text-right">{progress}% 達成</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "総回答数", value: totalAnswers, icon: "📝" },
            { label: "正解数", value: correctAnswers, icon: "✅" },
            { label: "正答率", value: `${accuracy}%`, icon: "🎯" },
            { label: "連続日数", value: `${streak}日`, icon: "🔥" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-2xl font-bold text-blue-950">{s.value}</p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <h2 className="text-lg font-bold text-blue-950 mb-4">今日の学習</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              href: "/practice",
              icon: "📝",
              title: "問題練習",
              desc: "Part 1〜7の問題を解く",
              color: "bg-blue-600",
            },
            {
              href: "/vocabulary",
              icon: "🧠",
              title: "単語学習",
              desc: "フラッシュカードで語彙力UP",
              color: "bg-yellow-500",
            },
            {
              href: "/progress",
              icon: "📊",
              title: "進捗確認",
              desc: "弱点分析とランキング",
              color: "bg-green-600",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
            >
              <div
                className={`${item.color} text-white w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}
              >
                {item.icon}
              </div>
              <h3 className="font-bold text-blue-950">{item.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
