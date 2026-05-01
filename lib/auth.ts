import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const secret = process.env.NEXTAUTH_SECRET
if (!secret && process.env.NODE_ENV === "production") {
  console.error(
    "[auth] NEXTAUTH_SECRET is not set. " +
    "Add it to your Vercel environment variables. " +
    "Generate one with: openssl rand -hex 32"
  )
}

// NextAuth v4 reads NEXTAUTH_URL automatically. On Vercel it also reads
// VERCEL_URL as a fallback. We log the resolved URL at startup so it's
// visible in Vercel Function logs.
const resolvedUrl =
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

if (process.env.NODE_ENV === "production") {
  console.log("[auth] resolved base URL:", resolvedUrl)
}

const googleEnabled =
  !!process.env.GOOGLE_CLIENT_ID?.trim() &&
  !!process.env.GOOGLE_CLIENT_SECRET?.trim()

export const authOptions: NextAuthOptions = {
  // Provide secret explicitly so NextAuth never crashes with "no secret".
  // In production this MUST be a strong random string from env.
  secret: secret || "dev-only-fallback-not-safe-for-production",

  // Only attach the Prisma adapter when Google OAuth is configured (the
  // adapter is required for OAuth account linking). For credentials-only
  // flows with JWT strategy, the adapter is not necessary.
  adapter: googleEnabled ? PrismaAdapter(prisma) : undefined,

  providers: [
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
          })

          if (!user || !user.passwordHash) return null

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!isValid) return null

          return { id: user.id, email: user.email, name: user.fullName }
        } catch (err) {
          console.error("[auth] authorize error:", err)
          return null
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token) session.user.id = token.id as string
      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
}
