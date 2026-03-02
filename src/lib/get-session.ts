import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

// NextAuth v5はcookie名が変わっているので両方試みる
export async function getSessionUser(req: NextRequest): Promise<{ id: string; role: string } | null> {
  // 本番環境: __Secure-authjs.session-token
  let token = await getToken({ req, secret, cookieName: "__Secure-authjs.session-token" });
  
  // 開発環境フォールバック
  if (!token) {
    token = await getToken({ req, secret, cookieName: "authjs.session-token" });
  }
  if (!token) {
    token = await getToken({ req, secret });
  }

  if (!token?.id) return null;
  return { id: token.id as string, role: (token.role as string) || "user" };
}
