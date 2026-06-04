import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: {
      userId: user.userId,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      roleKey: user.roleKey,
    },
  });
}