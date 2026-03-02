"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="mb-6">
          <span className="inline-block bg-yellow-400 text-blue-950 text-sm font-bold px-4 py-1 rounded-full uppercase tracking-wider">
            TOEIC 700+ MASTER
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
          目標スコアを
          <br />
          <span className="text-yellow-400">突破しよう</span>
        </h1>
        <p className="text-blue-200 text-xl md:text-2xl mb-12 max-w-2xl">
          スマートな学習システムで、TOEIC 700点以上を効率的に目指す。
          問題練習・単語学習・進捗分析がひとつに。
        </p>
        <div className="flex gap-4 flex-col sm:flex-row">
          <Link
            href="/auth/signup"
            className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-yellow-400/30 hover:-translate-y-0.5"
          >
            無料で始める
          </Link>
          <Link
            href="/auth/signin"
            className="border-2 border-white/30 hover:border-white text-white font-semibold px-10 py-4 rounded-xl text-lg transition-all hover:bg-white/10"
          >
            ログイン
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full">
          {[
            {
              icon: "📝",
              title: "Part別問題練習",
              desc: "Part 5〜7の文法・語彙・読解を徹底練習",
            },
            {
              icon: "🧠",
              title: "スマート単語帳",
              desc: "スペース反復法で効率的に語彙力アップ",
            },
            {
              icon: "📊",
              title: "スコア予測＆分析",
              desc: "弱点を可視化して最短距離で700点へ",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white/10 backdrop-blur rounded-2xl p-6 text-left hover:bg-white/15 transition-all"
            >
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-blue-200 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
