import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

import { AppSidebar } from "@/components/app-sidebar";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Menu } from "lucide-react";

type SidebarUser = {
  email: string;
  full_name: string;
  role: string;
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) redirect("/auth/login");

  const secret = process.env.JWT_SECRET;
  if (!secret) redirect("/auth/login?error=Falta JWT_SECRET");

  let user: SidebarUser;

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

  return (
<SidebarProvider
  defaultOpen={true}
  className="[--sidebar-width:20rem] [--sidebar-width-icon:4rem]"
>
  <AppSidebar user={user} />
  <SidebarInset className="min-w-0">
    <div className="flex h-14 items-center gap-3 px-4">
      <SidebarTrigger className="h-9 w-9 rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50">
        <Menu className="h-5 w-5" />
      </SidebarTrigger>
      <Separator orientation="vertical" className="h-6" />
    </div>

    <div className="p-4">
      {children}
    </div>
  </SidebarInset>
</SidebarProvider>
  );
}