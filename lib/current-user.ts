import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getCurrentUserFromToken() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId?: string;
      email?: string;
      role?: string;
      fullName?: string;
    };

    return payload;
  } catch {
    return null;
  }
}