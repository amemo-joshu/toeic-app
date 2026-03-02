import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

// NextAuth v5はcookie名が変わっているので両方試みる
export async function getSessionUser(req: NextRequest): Promise<{ id: string; role: string } | null> {
  // NextAuth v5: authjs.session-token
  let token = await getToken({ req, secret, cookieName: "authjs.session-token" });
  
  // フォールバック: 旧cookie名
  if (!token) {
    token = await getToken({ req, secret, cookieName: "__Secure-authjs.session-token" });
  }
  if (!token) {
    token = await getToken({ req, secret });
  }

  if (!token?.id) return null;
  return { id: token.id as string, role: (token.role as string) || "user" };
}
