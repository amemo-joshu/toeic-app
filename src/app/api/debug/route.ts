import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
  const cookies = req.cookies.getAll();
  const cookieNames = cookies.map(c => c.name);
  
  const token1 = await getToken({ req, secret, cookieName: "authjs.session-token" });
  const token2 = await getToken({ req, secret, cookieName: "__Secure-authjs.session-token" });
  const token3 = await getToken({ req, secret });
  
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  
  return NextResponse.json({ 
    cookieNames,
    token_authjs: token1 ? { id: token1.id, email: token1.email } : null,
    token_secure: token2 ? { id: token2.id, email: token2.email } : null,
    token_default: token3 ? { id: token3.id, email: token3.email } : null,
    users 
  });
}
