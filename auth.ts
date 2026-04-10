import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "select_account",
          hd: "uncsm.edu.ni", // dominio institucional
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase() ?? ""

      // SOLO permite correos institucionales
      if (!email.endsWith("@uncsm.edu.ni")) {
        return false
      }

      return true
    },
  },
  pages: {
    signIn: "/auth/login",
  },
})