import React from "react";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";

import { getUserByEmail } from "@/lib/current-user";

type SidebarUser = {
  email: string;
  full_name: string;
  role: string;
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: SidebarUser | null = null;

  const session = await auth();

  if (session?.user?.email?.endsWith("@uncsm.edu.ni")) {
    const dbUser = await getUserByEmail(session.user.email);

    if (!dbUser) {
      redirect("/auth/login?error=Usuario no autorizado");
    }

    user = {
      email: dbUser.email,
      full_name: dbUser.full_name,
      role: dbUser.role,
    };
  }

  if (!user) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) redirect("/auth/login");

    const secret = process.env.JWT_SECRET;
    if (!secret) redirect("/auth/login?error=Falta JWT_SECRET");

    try {
      const payload = jwt.verify(token, secret) as any;

      user = {
        email: payload.email,
        full_name: payload.full_name ?? payload.fullName ?? "Usuario",
        role: payload.role,
      };
    } catch {
      redirect("/auth/login");
    }
  }

 return (
  <SidebarProvider
    defaultOpen={true}
    className="[--sidebar-width:20rem] [--sidebar-width-icon:4rem]"
  >
    <AppSidebar user={user} />

    <SidebarInset className="min-w-0 bg-slate-50 overflow-hidden ">
      <Topbar user={user} />

      <main className="h-[calc(100vh-3.5rem)] overflow-auto p-4 ">
        <div className="min-w-0">
          {children}
        </div>
      </main>
    </SidebarInset>
  </SidebarProvider>
);
}