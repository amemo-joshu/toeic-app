"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ReactMarkdown from "react-markdown";

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionResultList {
    readonly [index: number]: SpeechRecognitionResult;
    readonly length: number;
  }
  interface SpeechRecognitionResult {
    readonly [index: number]: SpeechRecognitionAlternative;
    readonly isFinal: boolean;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
  }
}

type Mode = "conversation" | "correction" | "translate";
type Message = { role: "user" | "assistant"; content: string };

const MODES: { key: Mode; icon: string; label: string; desc: string; placeholder: string }[] = [
  {
    key: "conversation",
    icon: "💬",
    label: "英会話練習",
    desc: "AIと自由に英語で会話。ミスは優しく訂正してくれる",
    placeholder: "英語で話しかけてみよう！ 例: Tell me about your job.",
  },
  {
    key: "correction",
    icon: "✍️",
    label: "英文添削",
    desc: "書いた英文をAIが添削・解説してくれる",
    placeholder: "添削してほしい英文を入力... 例: I am working in hospital since 5 years.",
  },
  {
    key: "translate",
    icon: "🌐",
    label: "ビジネス翻訳",
    desc: "日本語→ビジネス英語に翻訳。語彙解説付き",
    placeholder: "翻訳したい日本語を入力... 例: 先日はお世話になりました。",
  },
];

export default function AIChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("conversation");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"en-US" | "ja-JP">("en-US");
  const [speechSupported, setSpeechSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const supported = typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    setSpeechSupported(supported);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.lang = speechLang;
    recognition.continuous = false;
    recognition.interimResults = true;

    let interimText = "";

    let finalTranscript = "";

    recognition.onresult = (event) => {
      finalTranscript = "";
      interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimText = transcript;
        }
      }
      // Show final + interim preview
      setInput(finalTranscript + (interimText ? ` [${interimText}]` : ""));
    };

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      // Keep only the final transcript (remove any interim brackets)
      setInput(finalTranscript);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [speechLang]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const currentMode = MODES.find((m) => m.key === mode)!;

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setMessages([]);
    setInput("");
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, mode }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "エラーが発生しました。もう一度試してください。" }]);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-3xl w-full mx-auto px-4 py-6 flex flex-col flex-1">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-blue-950 mb-1">AI英語コーチ <span className="text-sm font-normal text-gray-400">powered by Gemini</span></h1>
          <p className="text-gray-500 text-sm">会話練習・英文添削・ビジネス翻訳をAIがサポート</p>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => handleModeChange(m.key)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                mode === m.key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <p className="text-xl mb-1">{m.icon}</p>
              <p className={`text-xs font-bold ${mode === m.key ? "text-blue-700" : "text-gray-700"}`}>{m.label}</p>
              <p className="text-xs text-gray-400 hidden sm:block mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="bg-white rounded-2xl shadow-sm flex-1 flex flex-col min-h-96">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <p className="text-4xl mb-3">{currentMode.icon}</p>
                <p className="font-bold text-blue-950">{currentMode.label}</p>
                <p className="text-gray-400 text-sm mt-1">{currentMode.desc}</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0 mt-1">AI</div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm whitespace-pre-wrap"
                      : "bg-gray-100 text-gray-800 rounded-tl-sm"
                  }`}
                >
                  {msg.role === "user" ? msg.content : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-blue-800">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        code: ({ children }) => <code className="bg-gray-200 px-1 rounded font-mono text-xs">{children}</code>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0">AI</div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 space-y-2">
            {/* Language toggle for speech */}
            {speechSupported && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">音声言語:</span>
                <button
                  onClick={() => setSpeechLang("en-US")}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${speechLang === "en-US" ? "bg-blue-600 text-white border-blue-600" : "text-gray-500 border-gray-300 hover:border-blue-400"}`}
                >
                  🇺🇸 English
                </button>
                <button
                  onClick={() => setSpeechLang("ja-JP")}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${speechLang === "ja-JP" ? "bg-blue-600 text-white border-blue-600" : "text-gray-500 border-gray-300 hover:border-blue-400"}`}
                >
                  🇯🇵 日本語
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={listening ? "🎤 聞いています..." : currentMode.placeholder}
                rows={2}
                className={`flex-1 border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 transition-colors ${
                  listening
                    ? "border-red-400 bg-red-50 focus:ring-red-300"
                    : "border-gray-200 bg-white text-gray-900 focus:ring-blue-400"
                }`}
              />
              {/* Mic button */}
              {speechSupported && (
                <button
                  onClick={listening ? stopListening : startListening}
                  title={listening ? "停止" : "音声入力"}
                  className={`p-3 rounded-xl transition-all shrink-0 ${
                    listening
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  }`}
                >
                  {listening ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
                    </svg>
                  )}
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 shrink-0"
              >
                送信
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-2">Shift+Enter で改行 / Enter で送信</p>
      </div>
    </div>
  );
}
