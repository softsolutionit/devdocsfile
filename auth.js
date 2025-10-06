import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from './lib/prisma';

// Generate a URL-friendly username from email
const generateUsername = (email) => {
  
  let username = email.split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')  
    .replace(/_+/g, '_')           
    .replace(/^_|_$/g, '');       

  if (username.length < 3) {
    username = username.padEnd(3, '_');
  }
  
  return username.substring(0, 30);
};

const getUniqueUsername = async (baseUsername) => {
  let username = baseUsername;
  let counter = 1;
  
  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!existingUser) {
      return username;
    }
    
    const suffix = counter.toString();
    username = `${baseUsername.substring(0, 30 - suffix.length - 1)}_${suffix}`;
    counter++;
  }
};

if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is required in production');
}
const secret = process.env.NEXTAUTH_SECRET;

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  trustHost: true,
  
  useSecureCookies: process.env.NODE_ENV === 'production',
  
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
          });

          if (!user) {
            throw new Error('Invalid email or password');
          }

          if (!user.password) {
            throw new Error('Please sign in with your social account');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          throw new Error('Authentication failed');
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only handle OAuth sign-ins
      if (account?.provider !== 'credentials') {
        try {
          const baseUsername = generateUsername(user.email);
          
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          
          if (!existingUser) {
            const username = await getUniqueUsername(baseUsername);
            
            await prisma.user.update({
              where: { id: user.id },
              data: { 
                username,
                emailVerified: new Date(),
                role: 'USER',
                name: user.name || user.email.split('@')[0],
              },
            });
            user.username = username;
          } else if (!existingUser.username) {
            const username = await getUniqueUsername(baseUsername);
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { username },
            });
            user.username = username;
          } else {
            user.username = existingUser.username;
          }
        } catch (error) {
          console.error('Error during OAuth sign-in:', error);
        }
      }
      
      return true;
    },
    
    async redirect({ url, baseUrl }) {
      
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      return `${baseUrl}/dashboard`;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub; 
        session.user.role = token.role;
        session.user.username = token.username;
      }
      return session;
    },
    
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role || 'USER';
        
        // Only fetch user data if we don't have it yet or if this is a sign-in
        if (!token.username || account) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { username: true, role: true }
          });
          
          if (dbUser) {
            token.username = dbUser.username;
            token.role = dbUser.role || 'USER';
          }
        }
      }
      return token;
    },
  },
  
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.devdocsfile.com' : undefined,
      },
    },
    authjs: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  
  secret: secret,
  
  events: {
    async createUser({ user }) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'USER' },
        });
      } catch (error) {
      }
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);