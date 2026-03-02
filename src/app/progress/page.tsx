"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

interface StatsData {
  stats: { isCorrect: boolean; _count: number }[];
  sessions: { id: string; part: number; totalQuestions: number; correctCount: number; duration: number; createdAt: string }[];
  user: { streak: number; targetScore: number };
  partStats: Record<string, { total: number; correct: number }>;
  estimatedScore: number | null;
}

interface RankUser {
  id: string;
  name: string;
  streak: number;
  total: number;
  accuracy: number;
  estimatedScore: number;
}

export default function ProgressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [ranking, setRanking] = useState<RankUser[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/answers").then((r) => r.json()).then(setStats);
      fetch("/api/ranking").then((r) => r.json()).then(setRanking);
    }
  }, [session]);

  if (!session || !stats) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center h-64 text-gray-500">読み込み中...</div>
    </div>
  );

  const totalAnswers = stats.stats.reduce((acc, s) => acc + s._count, 0);
  const correctAnswers = stats.stats.find((s) => s.isCorrect)?._count || 0;
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const estimatedScore = stats.estimatedScore ?? null;

  const radarData = [1, 2, 3, 4, 5, 6, 7].map((p) => {
    const ps = stats.partStats[p];
    return {
      part: `Part ${p}`,
      正答率: ps && ps.total > 0 ? Math.round((ps.correct / ps.total) * 100) : 0,
    };
  });

  const sessionData = stats.sessions.slice(0, 10).reverse().map((s, i) => ({
    name: `#${i + 1}`,
    正答率: Math.round((s.correctCount / s.totalQuestions) * 100),
    part: s.part,
  }));

  const myRank = ranking.findIndex((u) => u.id === session.user.id) + 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-blue-950 mb-6">進捗＆分析</h1>

        {/* Score card */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-2xl p-6 mb-6 flex items-center justify-between">
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
            <p className="text-blue-200 text-sm mt-1">目標: {stats.user?.targetScore || 700}点</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-sm">ランキング</p>
            <p className="text-4xl font-bold">{myRank > 0 ? `${myRank}位` : "-"}</p>
            <p className="text-blue-200 text-sm">{ranking.length}人中</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Radar chart */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-blue-950 mb-4">パート別正答率</h2>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="part" />
                <Radar dataKey="正答率" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent sessions */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-blue-950 mb-4">最近のセッション正答率</h2>
            {sessionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sessionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="正答率" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400">
                まだデータがありません
              </div>
            )}
          </div>
        </div>

        {/* Ranking */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-blue-950 mb-4">🏆 ランキング</h2>
          <div className="space-y-3">
            {ranking.slice(0, 10).map((user, i) => (
              <div
                key={user.id}
                className={`flex items-center gap-4 p-3 rounded-xl ${user.id === session.user.id ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${i === 0 ? "bg-yellow-400 text-blue-950" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-amber-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-blue-950 text-sm">
                    {user.name} {user.id === session.user.id && <span className="text-blue-500 text-xs">（あなた）</span>}
                  </p>
                  <p className="text-gray-400 text-xs">正答率 {user.accuracy}% · {user.total}問</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-700">{user.estimatedScore}</p>
                  <p className="text-gray-400 text-xs">点</p>
                </div>
              </div>
            ))}
            {ranking.length === 0 && (
              <p className="text-gray-400 text-center py-4">まだランキングデータがありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
