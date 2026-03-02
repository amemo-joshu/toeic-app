"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const PARTS = [
  { part: 1, title: "Part 1", desc: "写真描写問題", icon: "📸", color: "bg-pink-500", details: "写真の内容を最もよく描写する文を選ぶ", isListening: true },
  { part: 2, title: "Part 2", desc: "応答問題", icon: "🎙️", color: "bg-rose-500", details: "質問や発言に対して最適な応答を選ぶ", isListening: true },
  { part: 3, title: "Part 3", desc: "会話問題", icon: "💬", color: "bg-orange-500", details: "2人の会話を聞いて設問に答える", isListening: true },
  { part: 4, title: "Part 4", desc: "説明文問題", icon: "📢", color: "bg-amber-500", details: "ひとりの話をを聞いて設問に答える", isListening: true },
  { part: 5, title: "Part 5", desc: "短文穴埋め問題", icon: "📝", color: "bg-blue-600", details: "文法・語彙の知識を問う穴埋め形式", isListening: false },
  { part: 6, title: "Part 6", desc: "長文穴埋め問題", icon: "📄", color: "bg-purple-600", details: "文脈を理解して適切な語句を選ぶ", isListening: false },
  { part: 7, title: "Part 7", desc: "読解問題", icon: "📖", color: "bg-green-600", details: "メール・記事などの英文を読んで答える", isListening: false },
];

export default function PracticePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-blue-950 mb-2">問題練習</h1>
        <p className="text-gray-500 mb-6">パートを選んで練習を始めよう</p>

        <div className="mb-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">🎧 リスニング（Part 1〜4）</span>
        </div>
        <div className="grid gap-3 mb-6">
          {PARTS.filter(p => p.isListening).map((p) => (
            <Link key={p.part} href={`/practice/${p.part}`}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-5 group">
              <div className={`${p.color} text-white w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform`}>
                {p.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-blue-950">{p.title}</h2>
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">音声</span>
                </div>
                <p className="text-gray-600 font-medium text-sm">{p.desc}</p>
                <p className="text-gray-400 text-xs mt-0.5">{p.details}</p>
              </div>
              <div className="text-gray-300 group-hover:text-blue-500 transition-colors text-xl">→</div>
            </Link>
          ))}
        </div>

        <div className="mb-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">📖 リーディング（Part 5〜7）</span>
        </div>
        <div className="grid gap-3">
          {PARTS.filter(p => !p.isListening).map((p) => (
            <Link key={p.part} href={`/practice/${p.part}`}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-5 group">
              <div className={`${p.color} text-white w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform`}>
                {p.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-blue-950">{p.title}</h2>
                <p className="text-gray-600 font-medium text-sm">{p.desc}</p>
                <p className="text-gray-400 text-xs mt-0.5">{p.details}</p>
              </div>
              <div className="text-gray-300 group-hover:text-blue-500 transition-colors text-xl">→</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
