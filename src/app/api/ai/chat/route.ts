import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPTS: Record<string, string> = {
  conversation: `You are a friendly English conversation partner helping a Japanese person practice for the TOEIC exam.
- Keep responses concise (2-4 sentences).
- Use natural business English.
- If the user makes grammar mistakes, gently correct them at the end with "💡 Correction: ...".
- Respond in English. You may add Japanese translation in parentheses for difficult words.`,

  correction: `You are an English writing coach helping a Japanese TOEIC learner.
The user will submit English text. Please:
1. Point out grammar, spelling, or unnatural expressions
2. Explain each correction briefly in Japanese
3. Show a polished version at the end labeled "✅ 修正後:"
Format your entire response in Japanese except for the English examples.`,

  translate: `You are a business English translator for Japanese TOEIC learners.
Translate the user's Japanese into natural business English.
Format your response as:
【英訳】
(translation here)

【使用した重要語彙】
- word: 意味

【別の表現】
(alternative phrasing)`,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  try {
    const { messages, mode } = await req.json();
    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.conversation;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Build full prompt with conversation history
    const historyText = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      )
      .join("\n");

    const fullPrompt = `${systemPrompt}\n\nConversation:\n${historyText}\n\nAssistant:`;

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    return NextResponse.json({ reply: text });
  } catch (error: unknown) {
    console.error("Gemini error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Gemini API エラー: ${message}` }, { status: 500 });
  }
}
