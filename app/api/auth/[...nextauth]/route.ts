import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'

export const authOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === 'google') {
        const email = user.email
        if (!email) return false

        const existingUser = await prisma.user.findUnique({
          where: { phone: email }
        })

        if (!existingUser) {
          await prisma.user.create({
            data: {
              phone: email,
              name: user.name || 'Google User',
              email: email,
              loyaltyPoints: 0,
              referralCode: 'MANI' + Math.random().toString(36).substring(2, 6).toUpperCase(),
              lastLoginDate: new Date(),
              firstPurchase: false
            }
          })
        } else {
          await prisma.user.update({
            where: { phone: email },
            data: { 
              lastLoginDate: new Date(),
              email: email
            }
          })
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { phone: user.email }
        })
        if (dbUser) {
          token.id = dbUser.id
          token.phone = dbUser.phone
          token.name = dbUser.name
          token.loyaltyPoints = dbUser.loyaltyPoints
          token.referralCode = dbUser.referralCode
          token.firstPurchase = dbUser.firstPurchase
        }
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id
        session.user.phone = token.phone
        session.user.loyaltyPoints = token.loyaltyPoints
        session.user.referralCode = token.referralCode
        session.user.firstPurchase = token.firstPurchase
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'default-secret-change-me',
  session: {
    strategy: 'jwt' as const,
  },
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
