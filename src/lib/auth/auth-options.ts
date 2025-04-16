import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectToDatabase from '../mongodb';
import { compare } from 'bcrypt';
import { UserRole } from '@/types';

// Extend the User type to include our custom fields
declare module 'next-auth' {
  interface User {
    id: string;
    role: UserRole;
    office: string | null;
  }
}

// Extend the JWT and Session types
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    office: string | null;
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      office: string | null;
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        await connectToDatabase();
        
        // Using dynamic import to avoid circular dependency issues
        const { default: User } = await import('@/models/User');
        
        const user = await User.findOne({ email: credentials.email }).select('+password');
        
        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }
        
        const isPasswordCorrect = await compare(credentials.password, user.password);
        
        if (!isPasswordCorrect) {
          throw new Error('Invalid credentials');
        }
        
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          office: user.office ? user.office.toString() : null,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          office: user.office,
        };
      }
      return token;
    },
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          office: token.office,
        },
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'transport-company-secret',
  debug: process.env.NODE_ENV === 'development',
};

export default authOptions; 