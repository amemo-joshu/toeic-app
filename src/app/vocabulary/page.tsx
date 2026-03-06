"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface VocabItem {
  id: string;
  word: string;
  meaning: string;
  example?: string;
  category?: string;
  level: number;
  progress: { correctCount: number; wrongCount: number } | null;
  _ts?: number;
}

const LEVEL_INFO = [
  { level: 1, label: "Level 1", desc: "超基礎", color: "bg-green-500", light: "bg-green-50 border-green-300 text-green-700", score: "〜400点" },
  { level: 2, label: "Level 2", desc: "基礎",   color: "bg-blue-500",  light: "bg-blue-50 border-blue-300 text-blue-700",   score: "500点台" },
  { level: 3, label: "Level 3", desc: "中級",   color: "bg-yellow-500",light: "bg-yellow-50 border-yellow-300 text-yellow-700", score: "600点台" },
  { level: 4, label: "Level 4", desc: "上級",   color: "bg-orange-500",light: "bg-orange-50 border-orange-300 text-orange-700", score: "700点台" },
  { level: 5, label: "Level 5", desc: "超上級", color: "bg-red-500",   light: "bg-red-50 border-red-300 text-red-700",     score: "800点〜" },
];

export default function VocabularyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [mode, setMode] = useState<"normal" | "review">("normal");
  const [cards, setCards] = useState<VocabItem[]>([]);
  const [queue, setQueue] = useState<VocabItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [hint, setHint] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [wrongWords, setWrongWords] = useState<VocabItem[]>([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [fetchTs, setFetchTs] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const doSpeak = () => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 0.85;
      const voices = window.speechSynthesis.getVoices();
      const enVoice =
        voices.find(v => v.lang === "en-US" && v.localService) ||
        voices.find(v => v.lang === "en-US") ||
        voices.find(v => v.lang.startsWith("en-"));
      if (enVoice) utter.voice = enVoice;
      window.speechSynthesis.speak(utter);
    };

    // voicesが未ロードなら読み込み後に実行
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak();
      };
      // onvoiceschangedが発火しないブラウザ向けにフォールバック
      setTimeout(doSpeak, 300);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  const resetSession = () => {
    setCurrent(0);
    setInput("");
    setHint("");
    setResult(null);
    setStats({ correct: 0, wrong: 0 });
    setWrongWords([]);
    setFinished(false);
  };

  const loadLevel = async (level: number) => {
    setLoading(true);
    setQueue([]); // 古いデータを即クリア
    resetSession();
    const res = await fetch("/api/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fetch", level: String(level), limit: 10 }),
    });
    const raw = await res.json();
    const data: VocabItem[] = Array.isArray(raw) ? raw : [];
    const ts = data[0]?._ts ?? Date.now();
    setFetchTs(ts);
    setCards(data);
    setQueue(data);
    setSelectedLevel(level);
    setMode("normal");
    setLoading(false);
    setTimeout(focusInput, 150);
  };

  const loadReview = async () => {
    setLoading(true);
    resetSession();
    const res = await fetch("/api/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fetch", mode: "review", limit: 10 }),
    });
    const data: VocabItem[] = await res.json();
    setCards(data);
    setQueue(data);
    setSelectedLevel(null);
    setMode("review");
    setLoading(false);
  };

  const loadWrongOnly = () => {
    // 今回のセッションで間違えた単語のみ復習
    resetSession();
    setQueue([...wrongWords]);
    setCards([...wrongWords]);
    setMode("review");
    setFinished(false);
  };

  const focusInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
  };

  // PC向け: current/result 変化時にフォーカス（useEffect）
  useEffect(() => {
    if (result === null) {
      setTimeout(focusInput, 50);
    } else {
      setTimeout(() => nextBtnRef.current?.focus(), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, result]);

  const handleHint = () => {
    const word = queue[current]?.word ?? "";
    if (!hint) {
      setHint(word[0]);
    } else if (hint.length < word.length) {
      setHint(word.slice(0, hint.length + 1));
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || result) return;
    const card = queue[current];
    const isCorrect = input.trim().toLowerCase() === card.word.toLowerCase();
    setResult(isCorrect ? "correct" : "wrong");

    if (!isCorrect) {
      setWrongWords((prev) => prev.find(w => w.id === card.id) ? prev : [...prev, card]);
    }

    // 正解した単語を自動で発音
    setTimeout(() => speak(card.word), 200);

    await fetch("/api/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vocabId: card.id, correct: isCorrect }),
    });

    setStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
    }));
  };

  const handleNext = () => {
    if (current + 1 >= queue.length) {
      setFinished(true);
    } else {
      // iOS: readOnly を先に外してから同期的にフォーカス（gesture context 内）
      if (inputRef.current) {
        inputRef.current.readOnly = false;
        inputRef.current.focus();
      }
      setCurrent((p) => p + 1);
      setInput("");
      setHint("");
      setResult(null);
    }
  };

  if (!session) return null;

  // Level selection screen
  if (selectedLevel === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-blue-950 mb-2">単語学習</h1>
          <p className="text-gray-500 mb-6">レベルを選んでスタート！日本語を見て英語を入力しよう 🧠</p>

          {/* 復習モードボタン */}
          <button
            onClick={loadReview}
            className="w-full bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-4 text-left transition-all group"
          >
            <div className="bg-red-500 text-white w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
              🔁
            </div>
            <div>
              <p className="font-bold text-red-700 text-lg">苦手単語を復習</p>
              <p className="text-red-400 text-sm">これまでに間違えた単語をランダム10問</p>
            </div>
          </button>

          <div className="space-y-3">
            {LEVEL_INFO.map((li) => {
              const levelCards = cards.filter((c) => c.level === li.level);
              return (
                <button
                  key={li.level}
                  onClick={() => loadLevel(li.level)}
                  className="w-full bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-4 group text-left"
                >
                  <div className={`${li.color} text-white w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <span className="text-lg font-extrabold">{li.level}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-950 text-lg">{li.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${li.light}`}>{li.desc}</span>
                    </div>
                    <p className="text-gray-400 text-sm">目安スコア：{li.score} ／ 10単語</p>
                  </div>
                  <span className="text-gray-300 group-hover:text-blue-500 text-xl transition-colors">→</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64 text-gray-400">読み込み中...</div>
      </div>
    );
  }

  // Finished screen
  if (finished) {
    const total = stats.correct + stats.wrong;
    const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
    const li = LEVEL_INFO.find((l) => l.level === selectedLevel)!;
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <p className="text-5xl mb-4">{accuracy >= 80 ? "🎉" : accuracy >= 60 ? "👍" : "💪"}</p>
            <h2 className="text-2xl font-bold text-blue-950 mb-1">セッション完了！</h2>
            <p className={`text-sm font-medium px-3 py-1 rounded-full border inline-block mb-6 ${li.light}`}>{li.label} {li.desc}</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-green-600">{stats.correct}</p>
                <p className="text-gray-500 text-xs">正解</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-red-500">{stats.wrong}</p>
                <p className="text-gray-500 text-xs">不正解</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-yellow-600">{accuracy}%</p>
                <p className="text-gray-500 text-xs">正答率</p>
              </div>
            </div>

            {/* 今回の間違い一覧 */}
            {wrongWords.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4 mb-5 text-left">
                <p className="text-red-600 font-bold text-sm mb-2">❌ 間違えた単語 ({wrongWords.length}問)</p>
                <div className="flex flex-wrap gap-2">
                  {wrongWords.map(w => (
                    <span key={w.id} className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-lg font-mono">{w.word}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              {wrongWords.length > 0 && (
                <button
                  onClick={loadWrongOnly}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  🔁 間違えた単語を復習
                </button>
              )}
              {mode === "normal" && selectedLevel !== null && (
                <button
                  onClick={() => loadLevel(selectedLevel)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  次の10問 →
                </button>
              )}
              {mode === "normal" && selectedLevel !== null && selectedLevel < 5 && (
                <button
                  onClick={() => loadLevel(selectedLevel + 1)}
                  className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  次のレベルへ →
                </button>
              )}
              <button
                onClick={() => { setSelectedLevel(null); setCards([]); setMode("normal"); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                レベル選択
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const card = queue[current];
  const li = LEVEL_INFO.find((l) => l.level === selectedLevel)!;
  const progress = ((current) / queue.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setSelectedLevel(null)} className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1">
            ← レベル選択
          </button>
          {mode === "review"
            ? <span className="text-xs font-bold px-3 py-1 rounded-full border bg-red-50 border-red-300 text-red-700">🔁 復習モード</span>
            : <span className={`text-xs font-bold px-3 py-1 rounded-full border ${li.light}`}>{li.label} {li.desc}</span>
          }
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-gray-500 shrink-0">{current + 1} / {queue.length}</span>
          {fetchTs > 0 && <span className="text-xs text-gray-300 ml-1">#{String(fetchTs).slice(-5)}</span>}
          <div className="flex-1 bg-gray-200 rounded-full h-2.5">
            <div className={`${li.color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm font-medium text-green-600 shrink-0">✓ {stats.correct}</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-5">
          {/* Japanese meaning */}
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 text-center">日本語の意味</p>
          <p className="text-3xl font-bold text-blue-950 text-center mb-2">{card.meaning}</p>
          {card.category && (
            <p className="text-center text-xs text-gray-400 mb-6">{card.category}</p>
          )}

          {/* Input area */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 block mb-2">英語を入力してください</label>
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={input}
              onChange={(e) => { if (!result) setInput(e.target.value); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (!result) handleSubmit(); } }}
              readOnly={!!result}
              placeholder={hint ? hint + "..." : "英単語を入力..."}
              className={`w-full border-2 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none transition-colors ${
                result === "correct" ? "border-green-400 bg-green-50 text-green-700" :
                result === "wrong" ? "border-red-400 bg-red-50 text-red-700" :
                "border-gray-200 bg-white text-gray-900 focus:border-blue-400"
              }`}
            />
          </div>

          {/* Hint */}
          {hint && !result && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-3 flex items-center gap-2">
              <span className="text-yellow-500">💡</span>
              <span className="text-yellow-700 font-mono font-bold tracking-widest text-lg">
                {hint.split("").join(" ")}{"　_".repeat(card.word.length - hint.length)}
              </span>
            </div>
          )}

          {/* Result feedback */}
          {result === "correct" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-green-700 font-bold text-lg">✅ 正解！ <span className="font-mono">{card.word}</span></p>
                <button
                  onClick={() => speak(card.word)}
                  title="発音を聞く"
                  className="bg-green-200 hover:bg-green-300 text-green-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                >
                  🔊 発音
                </button>
              </div>
              {card.example && (
                <div className="flex items-start justify-between gap-2 mt-2">
                  <p className="text-green-600 text-sm italic flex-1">{card.example}</p>
                  <button
                    onClick={() => speak(card.example!)}
                    title="例文を聞く"
                    className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded-lg text-xs transition-colors shrink-0"
                  >
                    🔊 例文
                  </button>
                </div>
              )}
            </div>
          )}
          {result === "wrong" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
              <p className="text-red-600 font-bold mb-2">❌ 不正解</p>
              <div className="flex items-center justify-between mb-1">
                <p className="text-red-700 text-sm">正解: <span className="font-mono font-bold text-lg">{card.word}</span></p>
                <button
                  onClick={() => speak(card.word)}
                  title="発音を聞く"
                  className="bg-red-200 hover:bg-red-300 text-red-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                >
                  🔊 発音
                </button>
              </div>
              {card.example && (
                <div className="flex items-start justify-between gap-2 mt-2">
                  <p className="text-red-500 text-sm italic flex-1">{card.example}</p>
                  <button
                    onClick={() => speak(card.example!)}
                    title="例文を聞く"
                    className="bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded-lg text-xs transition-colors shrink-0"
                  >
                    🔊 例文
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        {!result ? (
          <div className="flex gap-3">
            <button
              onClick={handleHint}
              disabled={hint.length >= card.word.length}
              className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-2 border-yellow-200 font-bold py-3 rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              💡 ヒント
              {hint && <span className="text-xs bg-yellow-200 px-2 py-0.5 rounded-full">+1文字</span>}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="flex-2 flex-grow-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-40"
            >
              回答する ↵
            </button>
          </div>
        ) : (
          <button
            ref={nextBtnRef}
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 text-white font-bold py-3 rounded-xl transition-colors outline-none"
          >
            {current + 1 >= queue.length ? "結果を見る 🏁" : "次の単語 → (Enter)"}
          </button>
        )}
      </div>
    </div>
  );
}
