import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGeminiModel } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { part, category, difficulty } = await req.json();

  const model = getGeminiModel("gemini-2.5-pro");

  const prompts: Record<number, string> = {
    5: `Generate a TOEIC Part 5 sentence completion question in JSON format.
Category: ${category || "grammar or vocabulary"}
Difficulty: ${difficulty || "medium"}

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "questionText": "The project manager _____ the team to submit reports weekly.",
  "options": ["requires", "requiring", "requirement", "required"],
  "correctAnswer": 0,
  "explanation": "Brief explanation in Japanese why option A is correct."
}`,

    6: `Generate a TOEIC Part 6 text completion question in JSON format.
The passage should be a business email, memo, or notice (3-5 sentences).
Difficulty: ${difficulty || "medium"}

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "passage": "The full passage text with _____ where the blank is.",
  "questionText": "Choose the best word or phrase for the blank.",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": 0,
  "explanation": "Brief explanation in Japanese why option A is correct."
}`,

    7: `Generate a TOEIC Part 7 reading comprehension question in JSON format.
Type: ${category || "email, advertisement, notice, or article"} 
Difficulty: ${difficulty || "medium"}

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "passage": "A realistic business English passage (email, ad, notice, or article). 80-150 words.",
  "questionText": "A comprehension question about the passage.",
  "options": ["correct answer", "wrong option B", "wrong option C", "wrong option D"],
  "correctAnswer": 0,
  "explanation": "Brief explanation in Japanese pointing to where the answer is found."
}`,
  };

  const prompt = prompts[part] || prompts[5];
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code blocks if present
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "AI応答の解析に失敗しました。もう一度試してください。" }, { status: 500 });
  }

  // Save to DB if admin
  if (session.user.role === "admin") {
    const saved = await prisma.question.create({
      data: {
        part,
        questionText: parsed.questionText,
        passage: parsed.passage || null,
        options: JSON.stringify(parsed.options),
        correctAnswer: parsed.correctAnswer,
        explanation: parsed.explanation,
        category: category || "ai-generated",
        difficulty: difficulty || "medium",
      },
    });
    return NextResponse.json({ question: parsed, saved: true, id: saved.id });
  }

  return NextResponse.json({ question: parsed, saved: false });
}
