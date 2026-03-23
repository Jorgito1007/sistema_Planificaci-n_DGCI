import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function seedAdmin() {
  // Create admin user via admin API
  const { data, error } = await supabase.auth.admin.createUser({
    email: "admin@dgci.gob",
    password: "123456",
    email_confirm: true,
    user_metadata: {
      full_name: "Administrador General",
      role: "Administrador",
    },
  })

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log("Admin user already exists")
      // Update profile role in case it was created before
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const adminUser = existingUsers?.users?.find((u: { email?: string }) => u.email === "admin@dgci.gob")
      if (adminUser) {
        await supabase
          .from("profiles")
          .update({ role: "Administrador", full_name: "Administrador General" })
          .eq("id", adminUser.id)
        
        // Set all permissions to true for admin
        const modules = ["sistema_administrativo", "por_componentes", "informes", "permisos_usuario", "auditoria"]
        for (const mod of modules) {
          await supabase
            .from("user_permissions")
            .update({ can_access: true })
            .eq("user_id", adminUser.id)
            .eq("module", mod)
        }
        console.log("Updated existing admin user permissions")
      }
    } else {
      console.error("Error creating admin:", error.message)
    }
    return
  }

  console.log("Admin user created:", data.user?.email)

  // Update profile to Administrador role (trigger should have created it, but let's ensure)
  if (data.user) {
    await supabase
      .from("profiles")
      .update({ role: "Administrador", full_name: "Administrador General" })
      .eq("id", data.user.id)

    // Set all permissions to true for admin
    const modules = ["sistema_administrativo", "por_componentes", "informes", "permisos_usuario", "auditoria"]
    for (const mod of modules) {
      await supabase
        .from("user_permissions")
        .update({ can_access: true })
        .eq("user_id", data.user.id)
        .eq("module", mod)
    }
    console.log("Admin permissions set to all modules")
  }
}

seedAdmin()
