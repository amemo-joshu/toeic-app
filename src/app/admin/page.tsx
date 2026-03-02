"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  streak: number;
  targetScore: number;
  createdAt: string;
  _count: { answers: number; studySessions: number };
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tab, setTab] = useState<"users" | "questions">("users");
  const [qForm, setQForm] = useState({
    part: 5, questionText: "", passage: "", options: ["", "", "", ""],
    correctAnswer: 0, explanation: "", category: "", difficulty: "medium"
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    else if (status === "authenticated" && session?.user.role !== "admin") router.push("/dashboard");
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === "admin") {
      fetch("/api/admin/users").then((r) => r.json()).then(setUsers);
    }
  }, [session]);

  const handleSaveQuestion = async () => {
    setSaving(true);
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...qForm,
        options: JSON.stringify(qForm.options),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg("✅ 問題を保存しました");
      setQForm({ part: 5, questionText: "", passage: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "", category: "", difficulty: "medium" });
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  if (!session || session.user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-blue-950 mb-6">⚙️ 管理者パネル</h1>

        <div className="flex gap-2 mb-6">
          {(["users", "questions"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg font-medium transition-colors ${tab === t ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
            >
              {t === "users" ? "👥 ユーザー" : "📝 問題追加"}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">名前</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">メール</th>
                  <th className="text-left px-4 py-3">ロール</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">回答数</th>
                  <th className="text-left px-4 py-3">目標</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.name || "未設定"}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{u._count.answers}</td>
                    <td className="px-4 py-3 font-bold text-yellow-600">{u.targetScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "questions" && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-blue-950 mb-4">問題を追加</h2>
            {saveMsg && <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg mb-4">{saveMsg}</div>}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">パート</label>
                  <select
                    value={qForm.part}
                    onChange={(e) => setQForm({ ...qForm, part: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[5, 6, 7].map((p) => <option key={p} value={p}>Part {p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">難易度</label>
                  <select
                    value={qForm.difficulty}
                    onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">易しい</option>
                    <option value="medium">普通</option>
                    <option value="hard">難しい</option>
                  </select>
                </div>
              </div>

              {qForm.part !== 5 && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">本文（パッセージ）</label>
                  <textarea
                    value={qForm.passage}
                    onChange={(e) => setQForm({ ...qForm, passage: e.target.value })}
                    rows={4}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="英文を入力..."
                  />
                </div>
              )}

              <div>
                <label className="text-sm text-gray-600 block mb-1">問題文</label>
                <textarea
                  value={qForm.questionText}
                  onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="質問文を入力..."
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">選択肢（(A)〜(D)）</label>
                {qForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-500 w-6">{String.fromCharCode(65 + i)}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const opts = [...qForm.options];
                        opts[i] = e.target.value;
                        setQForm({ ...qForm, options: opts });
                      }}
                      className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder={`選択肢 ${String.fromCharCode(65 + i)}`}
                    />
                    <input
                      type="radio"
                      name="correct"
                      checked={qForm.correctAnswer === i}
                      onChange={() => setQForm({ ...qForm, correctAnswer: i })}
                    />
                    <span className="text-xs text-gray-400">正解</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">解説（任意）</label>
                <textarea
                  value={qForm.explanation}
                  onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="正解の解説..."
                />
              </div>

              <button
                onClick={handleSaveQuestion}
                disabled={saving || !qForm.questionText}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? "保存中..." : "問題を保存"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
