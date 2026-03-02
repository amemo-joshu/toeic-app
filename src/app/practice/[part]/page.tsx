"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Question {
  id: string;
  part: number;
  questionText: string;
  passage?: string;
  audioScript?: string;
  imageUrl?: string;
  options: string;
  correctAnswer: number;
  explanation?: string;
}

interface QuestionGroup {
  passage: string;
  audioScript: string;
  questions: Question[];
}

type AnswerState = Record<string, { selected: number; isCorrect: boolean }>;

// ── TTS Helper ──────────────────────────────────────────
function useTTS() {
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const doSpeak = () => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 0.88;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(v => v.lang === "en-US" && v.localService) || voices.find(v => v.lang.startsWith("en-"));
      if (v) utter.voice = v;
      if (onEnd) utter.onend = onEnd;
      window.speechSynthesis.speak(utter);
    };
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) doSpeak();
    else { window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; doSpeak(); }; setTimeout(doSpeak, 300); }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  return { speak, stop };
}

// ── Finished Screen ──────────────────────────────────────
function FinishedScreen({ correct, total, part, onRetry, onBack }: { correct: number; total: number; part: number; onRetry: () => void; onBack: () => void }) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-2xl shadow-md p-8">
        <p className="text-6xl mb-4">{accuracy >= 80 ? "🎉" : accuracy >= 60 ? "👍" : "💪"}</p>
        <h2 className="text-2xl font-bold text-blue-950 mb-6">セッション完了！</h2>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-4"><p className="text-3xl font-bold text-blue-600">{correct}</p><p className="text-gray-500 text-sm">正解</p></div>
          <div className="bg-gray-50 rounded-xl p-4"><p className="text-3xl font-bold text-gray-600">{total}</p><p className="text-gray-500 text-sm">合計</p></div>
          <div className="bg-yellow-50 rounded-xl p-4"><p className="text-3xl font-bold text-yellow-600">{accuracy}%</p><p className="text-gray-500 text-sm">正答率</p></div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={onRetry} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">もう一度</button>
          <button onClick={onBack} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors">パート選択へ</button>
        </div>
      </div>
    </div>
  );
}

// passageからUnsplashキーワードを抽出
function getUnsplashKeyword(passage: string): string {
  const p = passage.toLowerCase();
  if (p.includes("kitchen") || p.includes("chef") || p.includes("cook")) return "kitchen,chef";
  if (p.includes("restaurant") || p.includes("waiter") || p.includes("dining")) return "restaurant";
  if (p.includes("office") || p.includes("desk") || p.includes("computer")) return "office,desk";
  if (p.includes("meeting") || p.includes("conference") || p.includes("board")) return "business,meeting";
  if (p.includes("store") || p.includes("shop") || p.includes("retail") || p.includes("clothes")) return "retail,store";
  if (p.includes("market") || p.includes("stall") || p.includes("vendor")) return "market,outdoor";
  if (p.includes("construction") || p.includes("worker") || p.includes("hard hat")) return "construction,worker";
  if (p.includes("forklift") || p.includes("warehouse") || p.includes("pallet")) return "warehouse,logistics";
  if (p.includes("park") || p.includes("picnic") || p.includes("garden")) return "park,outdoor";
  if (p.includes("train") || p.includes("station") || p.includes("platform")) return "train,station";
  if (p.includes("airport") || p.includes("plane") || p.includes("flight")) return "airport";
  if (p.includes("hospital") || p.includes("doctor") || p.includes("nurse")) return "hospital,medical";
  if (p.includes("library") || p.includes("book") || p.includes("reading")) return "library,books";
  if (p.includes("street") || p.includes("road") || p.includes("sidewalk")) return "street,city";
  return "office,business";
}

// ── Part 1: 写真描写 ─────────────────────────────────────
function Part1Practice({ questions, onFinish }: { questions: Question[]; onFinish: (correct: number) => void }) {
  const { speak, stop } = useTTS();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const q = questions[current];
  const options: string[] = JSON.parse(q.options);

  const playAudio = () => {
    setIsPlaying(true);
    const script = q.audioScript || options.map((o, i) => `${String.fromCharCode(65+i)}. ${o}`).join(". ");
    speak(script, () => setIsPlaying(false));
  };

  const handleSelect = async (i: number) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    const isCorrect = i === q.correctAnswer;
    if (isCorrect) setCorrectCount(p => p + 1);
    await fetch("/api/answers", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: q.id, selectedAnswer: i, isCorrect }) });
  };

  const handleNext = () => {
    stop();
    if (current + 1 >= questions.length) onFinish(correctCount + (selected === q.correctAnswer ? 0 : 0));
    else { setCurrent(p => p + 1); setSelected(null); setAnswered(false); setIsPlaying(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-gray-500">{current + 1} / {questions.length}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className="bg-pink-500 h-2 rounded-full transition-all" style={{ width: `${((current+1)/questions.length)*100}%` }} />
        </div>
        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">Part 1</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        {/* 写真 */}
        <div className="rounded-xl overflow-hidden mb-5 bg-gray-100 relative">
          <img
            src={q.imageUrl || `https://picsum.photos/600/350?random=${q.id}`}
            alt="TOEIC Part 1 Photo"
            className="w-full h-56 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/600/350?random=${q.id}`;
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs p-2 text-center">
            📸 写真をよく見て、音声を聞いてから回答してください
          </div>
        </div>

        {/* 音声再生ボタン */}
        <div className="text-center mb-5">
          <button onClick={playAudio} disabled={isPlaying}
            className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${isPlaying ? "bg-gray-400 cursor-wait" : "bg-pink-500 hover:bg-pink-600"}`}>
            {isPlaying ? "🔊 再生中..." : "▶ 選択肢を聞く"}
          </button>
          <p className="text-xs text-gray-400 mt-2">ボタンを押して選択肢(A〜D)を聞いてから回答してください</p>
        </div>

        <div className="space-y-3">
          {options.map((opt, i) => {
            let cls = "border-2 border-gray-200 text-gray-700 hover:border-pink-400";
            if (answered) {
              if (i === q.correctAnswer) cls = "border-2 border-green-500 bg-green-50 text-green-800";
              else if (i === selected) cls = "border-2 border-red-400 bg-red-50 text-red-700";
              else cls = "border-2 border-gray-100 text-gray-400";
            }
            return (
              <button key={i} onClick={() => handleSelect(i)} disabled={answered}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${cls} disabled:cursor-default`}>
                <span className="font-bold mr-2">{String.fromCharCode(65+i)}.</span>
                {answered ? opt : ""}
              </button>
            );
          })}
        </div>
        {answered && q.explanation && (
          <div className="mt-4 bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-bold mb-1">💡 解説</p><p>{q.explanation}</p>
          </div>
        )}
      </div>
      {answered && (
        <button onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
          {current + 1 >= questions.length ? "結果を見る 🏁" : "次の問題 →"}
        </button>
      )}
    </div>
  );
}

// ── Part 2: 応答問題 ─────────────────────────────────────
function Part2Practice({ questions, onFinish }: { questions: Question[]; onFinish: (correct: number) => void }) {
  const { speak, stop } = useTTS();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const q = questions[current];
  const options: string[] = JSON.parse(q.options);

  const playAudio = () => {
    setIsPlaying(true);
    const script = (q.audioScript || q.questionText) + "... " +
      options.map((o, i) => `${String.fromCharCode(65+i)}. ${o}`).join(". ");
    speak(script, () => setIsPlaying(false));
  };

  const handleSelect = async (i: number) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    const isCorrect = i === q.correctAnswer;
    if (isCorrect) setCorrectCount(p => p + 1);
    await fetch("/api/answers", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: q.id, selectedAnswer: i, isCorrect }) });
  };

  const handleNext = () => {
    stop();
    if (current + 1 >= questions.length) onFinish(correctCount);
    else { setCurrent(p => p + 1); setSelected(null); setAnswered(false); setIsPlaying(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-gray-500">{current + 1} / {questions.length}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className="bg-rose-500 h-2 rounded-full transition-all" style={{ width: `${((current+1)/questions.length)*100}%` }} />
        </div>
        <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">Part 2</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <div className="text-center mb-6">
          <button onClick={playAudio} disabled={isPlaying}
            className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${isPlaying ? "bg-gray-400 cursor-wait" : "bg-rose-500 hover:bg-rose-600"}`}>
            {isPlaying ? "🔊 再生中..." : "▶ 質問と選択肢を聞く"}
          </button>
          <p className="text-xs text-gray-400 mt-2">質問→(A)(B)(C)の順に読み上げます</p>
        </div>

        {answered && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-600 italic border-l-4 border-rose-400">
            <p className="font-bold text-gray-700 mb-1">🔊 質問内容</p>
            <p>{q.questionText}</p>
          </div>
        )}

        <div className="space-y-3">
          {options.map((opt, i) => {
            let cls = "border-2 border-gray-200 text-gray-700 hover:border-rose-400";
            if (answered) {
              if (i === q.correctAnswer) cls = "border-2 border-green-500 bg-green-50 text-green-800";
              else if (i === selected) cls = "border-2 border-red-400 bg-red-50 text-red-700";
              else cls = "border-2 border-gray-100 text-gray-400";
            }
            return (
              <button key={i} onClick={() => handleSelect(i)} disabled={answered}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${cls} disabled:cursor-default`}>
                <span className="font-bold mr-2">{String.fromCharCode(65+i)}.</span>{opt}
              </button>
            );
          })}
        </div>
        {answered && q.explanation && (
          <div className="mt-4 bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-bold mb-1">💡 解説</p><p>{q.explanation}</p>
          </div>
        )}
      </div>
      {answered && (
        <button onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
          {current + 1 >= questions.length ? "結果を見る 🏁" : "次の問題 →"}
        </button>
      )}
    </div>
  );
}

// ── Part 3 & 4: 会話・説明文問題 ────────────────────────
function Part34Practice({ questions, part, onFinish }: { questions: Question[]; part: number; onFinish: (correct: number) => void }) {
  const { speak, stop } = useTTS();
  const [groups, setGroups] = useState<QuestionGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);

  useEffect(() => {
    const map = new Map<string, Question[]>();
    for (const q of questions) {
      const key = q.audioScript || q.passage || q.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    }
    setGroups(Array.from(map.entries()).map(([script, qs]) => ({ passage: script, audioScript: script, questions: qs })));
  }, [questions]);

  if (!groups.length) return null;
  const group = groups[currentGroup];
  const color = part === 3 ? "orange" : "amber";
  const allAnswered = group.questions.every(q => answers[q.id]);

  const playAudio = () => {
    setIsPlaying(true);
    speak(group.audioScript, () => setIsPlaying(false));
  };

  const handleSelect = (qId: string, i: number, correct: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: { selected: i, isCorrect: i === correct } }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    let correct = 0;
    for (const q of group.questions) {
      const ans = answers[q.id];
      if (!ans) continue;
      if (ans.isCorrect) correct++;
      await fetch("/api/answers", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id, selectedAnswer: ans.selected, isCorrect: ans.isCorrect }) });
    }
    setTotalCorrect(p => p + correct);
  };

  const handleNext = () => {
    stop();
    if (currentGroup + 1 >= groups.length) onFinish(totalCorrect);
    else { setCurrentGroup(p => p + 1); setAnswers({}); setSubmitted(false); setIsPlaying(false); }
  };

  const bgColor = part === 3 ? "bg-orange-500" : "bg-amber-500";
  const lightColor = part === 3 ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-gray-500">セット {currentGroup + 1} / {groups.length}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className={`${bgColor} h-2 rounded-full transition-all`} style={{ width: `${((currentGroup)/groups.length)*100}%` }} />
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lightColor}`}>Part {part}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 音声パネル */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            {part === 3 ? "💬 会話スクリプト" : "📢 トークスクリプト"}
          </p>
          <div className="text-center mb-4">
            <button onClick={playAudio} disabled={isPlaying}
              className={`px-6 py-3 rounded-xl font-bold text-white transition-all ${isPlaying ? "bg-gray-400 cursor-wait" : `${bgColor} hover:opacity-90`}`}>
              {isPlaying ? "🔊 再生中..." : "▶ 音声を聞く"}
            </button>
          </div>
          {submitted && (
            <div className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-xl p-4 mt-2 whitespace-pre-wrap">
              {group.audioScript}
            </div>
          )}
          {!submitted && (
            <p className="text-xs text-gray-400 text-center mt-2">音声を聞いてから設問に答えてください</p>
          )}
        </div>

        {/* 設問パネル */}
        <div className="space-y-4">
          {group.questions.map((q, qi) => {
            const opts: string[] = JSON.parse(q.options);
            const ans = answers[q.id];
            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm p-5">
                <p className={`text-xs font-bold mb-2 ${part === 3 ? "text-orange-500" : "text-amber-600"}`}>問題 {qi + 1}</p>
                <p className="text-blue-950 font-medium text-sm mb-3 leading-relaxed">{q.questionText}</p>
                <div className="space-y-2">
                  {opts.map((opt, i) => {
                    let cls = "border-2 border-gray-200 text-gray-700 hover:border-blue-400";
                    if (submitted) {
                      if (i === q.correctAnswer) cls = "border-2 border-green-500 bg-green-50 text-green-800";
                      else if (ans?.selected === i) cls = "border-2 border-red-400 bg-red-50 text-red-700";
                      else cls = "border-2 border-gray-100 text-gray-400";
                    } else if (ans?.selected === i) cls = "border-2 border-blue-500 bg-blue-50 text-blue-800";
                    return (
                      <button key={i} onClick={() => handleSelect(q.id, i, q.correctAnswer)} disabled={submitted}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${cls} disabled:cursor-default`}>
                        <span className="font-bold mr-2">{String.fromCharCode(65+i)}.</span>{opt}
                      </button>
                    );
                  })}
                </div>
                {submitted && q.explanation && (
                  <div className="mt-3 bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
                    <span className="font-bold">💡 </span>{q.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {!submitted ? (
            <button onClick={handleSubmit} disabled={!allAnswered}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-40">
              {allAnswered ? "回答を確認する ✓" : `あと ${group.questions.filter(q => !answers[q.id]).length} 問選択してください`}
            </button>
          ) : (
            <button onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
              {currentGroup + 1 >= groups.length ? "結果を見る 🏁" : "次のセットへ →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Part 5, 6, 7: リーディング ───────────────────────────
function ReadingPractice({ questions, part, onFinish }: { questions: Question[]; part: number; onFinish: (correct: number) => void }) {
  const [groups, setGroups] = useState<QuestionGroup[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(0);
  const [groupAnswers, setGroupAnswers] = useState<AnswerState>({});
  const [groupSubmitted, setGroupSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const isGrouped = part === 7;

  useEffect(() => {
    if (part === 7) {
      const map = new Map<string, Question[]>();
      for (const q of questions) {
        const key = q.passage || q.id;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(q);
      }
      setGroups(Array.from(map.entries()).map(([p, qs]) => ({ passage: p, audioScript: "", questions: qs })));
    }
  }, [questions, part]);

  const handleSelectSimple = async (i: number) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    const q = questions[current];
    const isCorrect = i === q.correctAnswer;
    if (isCorrect) setCorrectCount(p => p + 1);
    await fetch("/api/answers", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: q.id, selectedAnswer: i, isCorrect }) });
  };

  const handleNextSimple = () => {
    if (current + 1 >= questions.length) onFinish(correctCount);
    else { setCurrent(p => p + 1); setSelected(null); setAnswered(false); }
  };

  const handleGroupSelect = (qId: string, i: number, correct: number) => {
    if (groupSubmitted) return;
    setGroupAnswers(prev => ({ ...prev, [qId]: { selected: i, isCorrect: i === correct } }));
  };

  const handleGroupSubmit = async () => {
    setGroupSubmitted(true);
    let correct = 0;
    const group = groups[currentGroup];
    for (const q of group.questions) {
      const ans = groupAnswers[q.id];
      if (!ans) continue;
      if (ans.isCorrect) correct++;
      await fetch("/api/answers", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id, selectedAnswer: ans.selected, isCorrect: ans.isCorrect }) });
    }
    setCorrectCount(p => p + correct);
  };

  const handleGroupNext = () => {
    if (currentGroup + 1 >= groups.length) onFinish(correctCount);
    else { setCurrentGroup(p => p + 1); setGroupAnswers({}); setGroupSubmitted(false); }
  };

  if (isGrouped && groups.length > 0) {
    const group = groups[currentGroup];
    const allAnswered = group.questions.every(q => groupAnswers[q.id]);
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-gray-500">セット {currentGroup + 1} / {groups.length}</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${(currentGroup/groups.length)*100}%` }} />
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Part 7</span>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-xs font-bold text-gray-400 mb-3">📄 英文</p>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border-l-4 border-green-400 pl-4">{group.passage}</div>
          </div>
          <div className="space-y-4">
            {group.questions.map((q, qi) => {
              const opts: string[] = JSON.parse(q.options);
              const ans = groupAnswers[q.id];
              return (
                <div key={q.id} className="bg-white rounded-2xl shadow-sm p-5">
                  <p className="text-xs font-bold text-green-600 mb-2">問題 {qi + 1}</p>
                  <p className="text-blue-950 font-medium text-sm mb-3">{q.questionText}</p>
                  <div className="space-y-2">
                    {opts.map((opt, i) => {
                      let cls = "border-2 border-gray-200 text-gray-700 hover:border-green-400";
                      if (groupSubmitted) {
                        if (i === q.correctAnswer) cls = "border-2 border-green-500 bg-green-50 text-green-800";
                        else if (ans?.selected === i) cls = "border-2 border-red-400 bg-red-50 text-red-700";
                        else cls = "border-2 border-gray-100 text-gray-400";
                      } else if (ans?.selected === i) cls = "border-2 border-blue-500 bg-blue-50 text-blue-800";
                      return (
                        <button key={i} onClick={() => handleGroupSelect(q.id, i, q.correctAnswer)} disabled={groupSubmitted}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${cls} disabled:cursor-default`}>
                          <span className="font-bold mr-2">{String.fromCharCode(65+i)}.</span>{opt}
                        </button>
                      );
                    })}
                  </div>
                  {groupSubmitted && q.explanation && (
                    <div className="mt-3 bg-blue-50 rounded-lg p-3 text-xs text-blue-800"><span className="font-bold">💡 </span>{q.explanation}</div>
                  )}
                </div>
              );
            })}
            {!groupSubmitted ? (
              <button onClick={handleGroupSubmit} disabled={!allAnswered}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl disabled:opacity-40">
                {allAnswered ? "回答を確認する ✓" : `あと ${group.questions.filter(q => !groupAnswers[q.id]).length} 問選択してください`}
              </button>
            ) : (
              <button onClick={handleGroupNext} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl">
                {currentGroup + 1 >= groups.length ? "結果を見る 🏁" : "次のセットへ →"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Part 5, 6
  if (!questions.length) return null;
  const q = questions[current];
  const options: string[] = JSON.parse(q.options);
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-gray-500">{current + 1} / {questions.length}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((current+1)/questions.length)*100}%` }} />
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Part {part}</span>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        {q.passage && <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-700 leading-relaxed border-l-4 border-blue-400 whitespace-pre-wrap">{q.passage}</div>}
        <p className="text-blue-950 font-medium leading-relaxed mb-6">{q.questionText}</p>
        <div className="space-y-3">
          {options.map((opt, i) => {
            let cls = "border-2 border-gray-200 text-gray-700 hover:border-blue-400";
            if (answered) {
              if (i === q.correctAnswer) cls = "border-2 border-green-500 bg-green-50 text-green-800";
              else if (i === selected) cls = "border-2 border-red-400 bg-red-50 text-red-700";
              else cls = "border-2 border-gray-100 text-gray-400";
            }
            return (
              <button key={i} onClick={() => handleSelectSimple(i)} disabled={answered}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${cls} disabled:cursor-default`}>
                <span className="font-bold mr-2">{String.fromCharCode(65+i)}.</span>{opt}
              </button>
            );
          })}
        </div>
        {answered && q.explanation && (
          <div className="mt-4 bg-blue-50 rounded-xl p-4 text-sm text-blue-800"><p className="font-bold mb-1">💡 解説</p><p>{q.explanation}</p></div>
        )}
      </div>
      {answered && (
        <button onClick={handleNextSimple} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
          {current + 1 >= questions.length ? "結果を見る 🏁" : "次の問題 →"}
        </button>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────
export default function PracticePartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const part = parseInt(params.part as string);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [finished, setFinished] = useState(false);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  const load = useCallback(() => {
    if (!session) return;
    setLoading(true);
    setFinished(false);
    setFinalCorrect(0);
    fetch(`/api/questions?part=${part}&limit=15`)
      .then(r => r.json())
      .then(data => { setQuestions(data); setLoading(false); });
  }, [session, part]);

  useEffect(() => { load(); }, [load]);

  const handleFinish = async (correct: number) => {
    const duration = 0;
    await fetch("/api/answers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: "session", selectedAnswer: 0, isCorrect: false,
        part, totalQuestions: questions.length, correctCount: correct, duration }),
    });
    setFinalCorrect(correct);
    setFinished(true);
  };

  if (!session || loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center h-64 text-gray-400">読み込み中...</div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">📭</p>
        <h2 className="text-xl font-bold text-blue-950 mb-2">問題がありません</h2>
        <button onClick={() => router.push("/practice")} className="bg-blue-600 text-white px-6 py-2 rounded-lg mt-4">戻る</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {finished ? (
        <FinishedScreen correct={finalCorrect} total={questions.length} part={part}
          onRetry={load} onBack={() => router.push("/practice")} />
      ) : (
        <>
          {part === 1 && <Part1Practice questions={questions} onFinish={handleFinish} />}
          {part === 2 && <Part2Practice questions={questions} onFinish={handleFinish} />}
          {(part === 3 || part === 4) && <Part34Practice questions={questions} part={part} onFinish={handleFinish} />}
          {(part === 5 || part === 6 || part === 7) && <ReadingPractice questions={questions} part={part} onFinish={handleFinish} />}
        </>
      )}
    </div>
  );
}
