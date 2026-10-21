import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { getPool, sql } from "@/lib/db";

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "select_account",
          hd: "uncsm.edu.ni",
        },
      },
    }),
  ],

  callbacks: {
    // ========================================================
    // VALIDAR INICIO DE SESIÓN
    // ========================================================

    async signIn({ profile }) {
      try {
        const email =
          profile?.email
            ?.trim()
            .toLowerCase() ?? "";

        // Solo correos institucionales
        if (
          !email.endsWith(
            "@uncsm.edu.ni"
          )
        ) {
          return false;
        }

        // Verificar que el usuario exista
        // y esté activo en Usuarios_Dgci
        const pool =
          await getPool();

        const result =
          await pool
            .request()
            .input(
              "Email",
              sql.NVarChar(255),
              email
            )
            .query(`
              SELECT
                u.UserId,
                u.Email,
                u.FullName,
                u.IsActive
              FROM dbo.Usuarios_Dgci u
              WHERE LOWER(u.Email) = @Email;
            `);

        const usuario =
          result.recordset[0];

        // No está registrado
        if (!usuario) {
          console.log(
            "Acceso rechazado. Usuario no registrado:",
            email
          );

          return false;
        }

        // Usuario desactivado
        if (!usuario.IsActive) {
          console.log(
            "Acceso rechazado. Usuario inactivo:",
            email
          );

          return false;
        }

        return true;

      } catch (error) {
        console.error(
          "Error validando usuario en Auth.js:",
          error
        );

        return false;
      }
    },

    // ========================================================
    // AGREGAR DATOS AL JWT DE AUTH.JS
    // ========================================================

    async jwt({ token }) {
      try {
        if (!token.email) {
          return token;
        }

        const email =
          String(token.email)
            .trim()
            .toLowerCase();

        const pool =
          await getPool();

        const result =
          await pool
            .request()
            .input(
              "Email",
              sql.NVarChar(255),
              email
            )
            .query(`
              SELECT TOP 1
                CAST(
                  u.UserId AS nvarchar(36)
                ) AS UserId,

                u.Email,

                u.FullName,

                u.Cargo,

                u.IsActive,

                r.RoleKey

              FROM dbo.Usuarios_Dgci u

              LEFT JOIN dbo.UserRoles_Dgci ur
                ON ur.UserId = u.UserId

              LEFT JOIN dbo.Roles_Dgci r
                ON r.RoleId = ur.RoleId

              WHERE
                LOWER(u.Email) = @Email;
            `);

        const usuario =
          result.recordset[0];

        if (!usuario) {
          return token;
        }

        token.userId =
          usuario.UserId;

        token.role =
          usuario.RoleKey ?? "";

        token.full_name =
          usuario.FullName ?? "";

        token.cargo =
          usuario.Cargo ?? "";

        token.is_active =
          Boolean(
            usuario.IsActive
          );

        return token;

      } catch (error) {
        console.error(
          "Error cargando datos del usuario en JWT:",
          error
        );

        return token;
      }
    },

    // ========================================================
    // PASAR DATOS DEL JWT A session.user
    // ========================================================

    async session({
      session,
      token,
    }) {
      if (session.user) {
        const user =
          session.user as any;

        user.userId =
          token.userId ?? "";

        user.role =
          token.role ?? "";

        user.full_name =
          token.full_name ??
          session.user.name ??
          "";

        user.cargo =
          token.cargo ?? "";

        user.is_active =
          token.is_active ??
          false;
      }

      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },
});